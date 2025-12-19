'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type MemberActionState = {
    message?: string
    error?: string
    success?: boolean
}

export async function registerMember(prevState: MemberActionState, formData: FormData): Promise<MemberActionState> {
    const fullName = formData.get('fullName')?.toString() || ''
    const fatherName = formData.get('fatherName')?.toString() || ''
    const email = formData.get('email')?.toString() || ''
    const phone = formData.get('phone')?.toString() || ''
    const dob = formData.get('dob')?.toString() || ''
    const gender = formData.get('gender')?.toString() || 'male'
    const address = formData.get('address')?.toString() || ''
    const bloodGroup = formData.get('bloodGroup')?.toString() || ''
    const height = formData.get('height')?.toString() || ''
    const weight = formData.get('weight')?.toString() || ''
    const medicalConditions = formData.get('medicalConditions')?.toString() || ''
    const fitnessGoal = formData.get('fitnessGoal')?.toString() || ''
    const emergencyContactName = formData.get('emergencyContactName')?.toString() || ''
    const emergencyContactPhone = formData.get('emergencyContactPhone')?.toString() || ''
    const membershipPlanId = formData.get('membershipPlanId')?.toString() || ''
    const startDate = formData.get('startDate')?.toString() || new Date().toISOString().split('T')[0]

    // Metadata passed hidden from client
    const gymId = formData.get('gymId')?.toString() || ''
    const branchId = formData.get('branchId')?.toString() || ''

    if (!fullName || !phone || !gymId || !branchId) {
        return { error: 'Full Name, Phone, and Branch ID are required' }
    }

    const supabase = createAdminClient()

    try {
        // 1. Create member record
        const { error: memberError } = await supabase
            .from('members')
            .insert({
                gym_id: gymId,
                branch_id: branchId,
                full_name: fullName,
                father_name: fatherName || null,
                email: email || null,
                phone: phone,
                date_of_birth: dob || null,
                gender: gender,
                address: address || null,
                blood_group: bloodGroup || null,
                height: height ? parseInt(height) : null,
                weight: weight ? parseFloat(weight) : null,
                medical_conditions: medicalConditions || null,
                fitness_goal: fitnessGoal || null,
                emergency_contact_name: emergencyContactName || null,
                emergency_contact_phone: emergencyContactPhone || null,
                membership_plan_id: membershipPlanId || null,
                membership_start_date: startDate,
                status: 'active'
            })

        if (memberError) {
            console.error('Member Registration Error:', memberError)
            return { error: memberError.message }
        }

        revalidatePath('/reception/members')
        revalidatePath('/reception/dashboard')

        return {
            success: true,
            message: `Member "${fullName}" registered successfully.`
        }
    } catch (err: unknown) {
        const error = err as Error
        console.error('Fatal Registration Error:', error)
        return { error: error?.message || 'Something went wrong during registration' }
    }
}
