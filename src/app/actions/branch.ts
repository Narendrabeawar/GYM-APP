'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    message?: string
    error?: string
    success?: boolean
}

export async function createBranch(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const email = formData.get('email') as string
    const branchName = formData.get('branchName') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const gymId = formData.get('gymId') as string // Current gym admin's gym ID

    if (!email || !branchName || !phone || !gymId) {
        return { error: 'Branch Name, Email, and Phone Number are required' }
    }

    const supabase = createAdminClient()

    try {
        // 1. Create the Branch record
        const { data: branch, error: branchError } = await supabase
            .from('branches')
            .insert({
                name: branchName,
                email: email,
                phone: phone,
                address: address,
                gym_id: gymId,
                status: 'active'
            })
            .select()
            .single()

        if (branchError) {
            console.error('Error creating branch:', branchError)
            // If the table doesn't exist, we'll get an error here.
            return { error: 'Failed to create branch record: ' + branchError.message }
        }

        // Fetch Gym Name to include in metadata
        const { data: gym } = await supabase.from('gyms').select('name').eq('id', gymId).single()
        const gymName = gym?.name || 'My Gym'

        // 2. Create the Branch Admin User in Auth
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email,
            password: 'gymbranch123',
            email_confirm: true,
            user_metadata: {
                role: 'branch_admin',
                full_name: branchName + ' Manager',
                gym_id: gymId,
                branch_id: branch.id,
                branch_name: branchName,
                gym_name: gymName,
                force_password_change: true
            }
        })

        if (userError) {
            // Rollback: delete the branch if user creation fails
            await supabase.from('branches').delete().eq('id', branch.id)
            console.error('Error creating branch user:', userError)
            return { error: userError.message }
        }

        revalidatePath('/gym/listed-branches')
        return {
            success: true,
            message: `Branch "${branchName}" created successfully. Login: ${email}, Default Password: "gymbranch123"`
        }
    } catch (err) {
        console.error('Unexpected error:', err)
        return { error: 'Something went wrong' }
    }
}

export async function deleteBranch(branchId: string): Promise<ActionState> {
    if (!branchId) return { error: 'Branch ID is required' }

    const supabase = createAdminClient()

    try {
        // 1. Get all profiles associated with this branch to delete their auth accounts
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('branch_id', branchId)

        if (profileError) {
            console.error('Error fetching branch profiles:', profileError)
            return { error: 'Failed to fetch branch staff details' }
        }

        // 2. Delete each auth user
        if (profiles && profiles.length > 0) {
            for (const profile of profiles) {
                await supabase.auth.admin.deleteUser(profile.id)
            }
        }

        // 3. Delete the branch record (this will automatically clean up remaining profile entries via trigger/cascade if set)
        const { error: branchError } = await supabase
            .from('branches')
            .delete()
            .eq('id', branchId)

        if (branchError) {
            console.error('Error deleting branch record:', branchError)
            return { error: branchError.message }
        }

        revalidatePath('/gym/listed-branches')
        return { success: true, message: 'Branch and all associated staff deleted successfully' }
    } catch (err) {
        console.error('Unexpected error during branch deletion:', err)
        return { error: 'Failed to delete branch' }
    }
}
