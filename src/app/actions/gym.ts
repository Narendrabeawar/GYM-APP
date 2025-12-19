'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    message?: string
    error?: string
    success?: boolean
}

export async function createGym(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const email = formData.get('email') as string
    const gymName = formData.get('gymName') as string
    const mobile = formData.get('mobile') as string
    const address = formData.get('address') as string

    if (!email || !gymName || !mobile) {
        return { error: 'Gym Name, Email, and Mobile Number are required' }
    }

    const supabase = createAdminClient()

    try {
        // 1. Create the Gym record first
        const { data: gym, error: gymError } = await supabase
            .from('gyms')
            .insert({
                name: gymName,
                email: email,
                phone: mobile,
                address: address
            })
            .select()
            .single()

        if (gymError) {
            console.error('Error creating gym:', gymError)
            return { error: 'Failed to create gym record: ' + gymError.message }
        }

        // 2. Create the Gym Admin User
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email,
            password: 'newgym123',
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                role: 'gym_admin',
                full_name: gymName + ' Admin', // Default name
                gym_id: gym.id,
                gym_name: gymName,
                force_password_change: true
            }
        })

        if (userError) {
            // Rollback: delete the gym if user creation fails
            await supabase.from('gyms').delete().eq('id', gym.id)
            console.error('Error creating user:', userError)
            return { error: userError.message }
        }

        // 3. Update Gym with Admin ID
        if (user.user) {
            const { error: updateError } = await supabase
                .from('gyms')
                .update({ admin_id: user.user.id })
                .eq('id', gym.id)

            if (updateError) {
                console.error('Error linking admin to gym:', updateError)
                // Not critical enough to fail the whole process, but good to know
            }
        }

        revalidatePath('/members')
        return { success: true, message: `Gym "${gymName}" created successfully with default password "newgym123"` }
    } catch (err) {
        console.error('Unexpected error:', err)
        return { error: 'Something went wrong' }
    }
}

export async function updateGym(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const id = formData.get('id') as string
    const email = formData.get('email') as string
    const gymName = formData.get('gymName') as string
    const mobile = formData.get('mobile') as string
    const address = formData.get('address') as string
    const subscriptionStatus = formData.get('subscriptionStatus') as string

    if (!id || !email || !gymName || !mobile) {
        return { error: 'Required fields are missing' }
    }

    const supabase = createAdminClient()

    try {
        const { error } = await supabase
            .from('gyms')
            .update({
                name: gymName,
                email: email,
                phone: mobile,
                address: address,
                subscription_status: subscriptionStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) {
            console.error('Error updating gym:', error)
            return { error: 'Failed to update gym: ' + error.message }
        }

        revalidatePath('/listed-gym')
        return { success: true, message: `Gym "${gymName}" updated successfully` }
    } catch (err) {
        console.error('Unexpected error:', err)
        return { error: 'Something went wrong' }
    }
}
