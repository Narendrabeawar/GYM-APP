'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    message?: string
    error?: string
    success?: boolean
}

export async function createPlan(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const planName = formData.get('planName') as string
    const planPeriod = formData.get('planPeriod') as string
    const planPrice = formData.get('planPrice') as string
    const discount = formData.get('discount') as string
    const customPeriod = formData.get('customPeriod') as string
    const gymId = formData.get('gymId') as string

    if (!planName || !planPrice || !gymId) {
        return { error: 'Plan Name, Price, and Gym ID are required' }
    }

    const supabase = createAdminClient()

    try {
        const price = parseFloat(planPrice)
        const discountAmount = discount ? parseFloat(discount) : 0
        const finalAmount = Math.max(0, price - discountAmount)

        // Determine duration based on plan period
        let durationMonths = 1
        if (planPeriod === 'monthly') {
            durationMonths = 1
        } else if (planPeriod === 'quarterly') {
            durationMonths = 3
        } else if (planPeriod === 'half-yearly') {
            durationMonths = 6
        } else if (planPeriod === 'yearly') {
            durationMonths = 12
        } else if (planPeriod === 'custom' && customPeriod) {
            durationMonths = Math.ceil(parseInt(customPeriod) / 30)
        }

        const { data: plan, error: planError } = await supabase
            .from('membership_plans')
            .insert({
                gym_id: gymId,
                name: planName,
                description: `${planPeriod === 'custom' ? customPeriod + ' days' : planPeriod} membership plan`,
                duration_months: durationMonths,
                price: price,
                discount_amount: discountAmount,
                final_amount: finalAmount,
                custom_days: planPeriod === 'custom' ? parseInt(customPeriod) : null,
                plan_period: planPeriod,
                status: 'active'
            })
            .select()
            .single()

        if (planError) {
            console.error('Error creating plan:', planError)
            return { error: 'Failed to create plan: ' + planError.message }
        }

        revalidatePath('/gym/plans')
        return {
            success: true,
            message: `Plan "${planName}" created successfully with ₹${finalAmount} final amount`
        }
    } catch (error) {
        console.error('Error creating plan:', error)
        return { error: 'Failed to create plan' }
    }
}

export async function deletePlan(planId: string): Promise<ActionState> {
    const supabase = createAdminClient()

    try {
        const { error } = await supabase
            .from('membership_plans')
            .delete()
            .eq('id', planId)

        if (error) {
            console.error('Error deleting plan:', error)
            return { error: 'Failed to delete plan: ' + error.message }
        }

        revalidatePath('/gym/plans')
        return {
            success: true,
            message: 'Plan deleted successfully'
        }
    } catch (error) {
        console.error('Error deleting plan:', error)
        return { error: 'Failed to delete plan' }
    }
}
