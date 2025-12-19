'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type OperatorActionState = {
    message?: string
    error?: string
    success?: boolean
}

export async function createOperator(prevState: OperatorActionState, formData: FormData): Promise<OperatorActionState> {
    const fullName = formData.get('fullName')?.toString() || ''
    const email = formData.get('email')?.toString() || ''
    const phone = formData.get('phone')?.toString() || ''
    const address = formData.get('address')?.toString() || ''
    const designation = formData.get('designation')?.toString() || 'Receptionist'
    const gymId = formData.get('gymId')?.toString() || ''
    const branchId = formData.get('branchId')?.toString() || ''

    // 1. Basic validation
    if (!fullName || !email || !phone || !gymId || !branchId) {
        return { error: 'Full Name, Email, Phone, and Branch ID are required.' }
    }

    const supabase = createAdminClient()

    try {
        // 2. Fetch metadata (Gym/Branch names) to personalize the staff profile
        const { data: branchInfo, error: fetchError } = await supabase
            .from('branches')
            .select('name, gyms(name)')
            .eq('id', branchId)
            .maybeSingle()

        if (fetchError) {
            console.error('Fetch Error:', fetchError)
            return { error: `Database error: ${fetchError.message}` }
        }

        const branchName = branchInfo?.name || 'Branch'
        let gymName = 'Gym'

        // Robust extraction of gym name from join
        if (branchInfo?.gyms) {
            const gymsData = branchInfo.gyms as any
            gymName = Array.isArray(gymsData) ? gymsData[0]?.name : gymsData?.name || 'Gym'
        }

        // 3. Create the account in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: 'operator123',
            email_confirm: true,
            user_metadata: {
                role: 'receptionist',
                full_name: fullName,
                phone: phone,
                gym_id: gymId,
                branch_id: branchId,
                branch_name: branchName,
                gym_name: gymName,
                address: address,
                designation: designation,
                force_password_change: true
            }
        })

        if (authError) {
            console.error('Auth Error:', authError)
            return { error: authError.message }
        }

        // 4. Success! Refresh the list
        revalidatePath('/branch/operators')
        return {
            success: true,
            message: `Account created successfully for ${fullName}.`
        }

    } catch (err: any) {
        console.error('Fatal Action Error:', err)
        // Ensure we return a plain string for the error to avoid serialization issues
        return {
            error: typeof err === 'string' ? err : (err?.message || 'A server error occurred. Please try again later.')
        }
    }
}

export async function deleteOperator(operatorId: string): Promise<OperatorActionState> {
    if (!operatorId) return { error: 'Operator ID is required' }

    const supabase = createAdminClient()

    try {
        // Deleting the auth user automatically deletes the profile due to ON DELETE CASCADE
        const { error } = await supabase.auth.admin.deleteUser(operatorId)

        if (error) {
            console.error('Error deleting operator:', error)
            return { error: error.message }
        }

        revalidatePath('/branch/operators')
        return { success: true, message: 'Operator deleted successfully' }
    } catch (err: any) {
        console.error('Unexpected error during deletion:', err)
        return { error: err?.message || 'Failed to delete operator' }
    }
}
