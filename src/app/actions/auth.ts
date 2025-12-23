'use server'

import { createClient } from '@/lib/supabase/server'

export async function resetPassword(email: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
        })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true, message: 'Password reset email sent successfully' }
    } catch {
        return { success: false, error: 'Something went wrong. Please try again.' }
    }
}

export async function updatePassword(password: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true, message: 'Password updated successfully' }
    } catch {
        return { success: false, error: 'Something went wrong. Please try again.' }
    }
}
