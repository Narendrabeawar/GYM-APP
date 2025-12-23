'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type EnquiryActionState = {
    message?: string
    error?: string
    success?: boolean
}

export async function updateEnquiry(enquiryId: string, formData: FormData): Promise<EnquiryActionState> {
    if (!enquiryId) {
        return { error: 'Enquiry ID is required' }
    }

    const supabase = createAdminClient()

    const updateData: Record<string, string | number | null | undefined> = {
        updated_at: new Date().toISOString()
    }

    const fullName = formData.get('fullName')?.toString()
    if (fullName) updateData.full_name = fullName

    const fatherName = formData.get('fatherName')?.toString()
    if (fatherName !== undefined) updateData.father_name = fatherName || null

    const phone = formData.get('phone')?.toString()
    if (phone) updateData.phone = phone

    const email = formData.get('email')?.toString()
    if (email !== undefined) updateData.email = email || null

    const dateOfBirth = formData.get('dateOfBirth')?.toString()
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null

    const gender = formData.get('gender')?.toString()
    if (gender !== undefined) updateData.gender = gender as 'male' | 'female' | 'other' || null

    const address = formData.get('address')?.toString()
    if (address) updateData.address = address

    const healthInfo = formData.get('healthInfo')?.toString()
    if (healthInfo !== undefined) updateData.health_info = healthInfo || null

    const bloodGroup = formData.get('bloodGroup')?.toString()
    if (bloodGroup !== undefined) updateData.blood_group = bloodGroup || null

    const height = formData.get('height')?.toString()
    if (height !== undefined) updateData.height = height ? parseFloat(height) : null

    const weight = formData.get('weight')?.toString()
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null

    const fitnessGoal = formData.get('fitnessGoal')?.toString()
    if (fitnessGoal !== undefined) updateData.fitness_goal = fitnessGoal || null

    const emergencyContactName = formData.get('emergencyContactName')?.toString()
    if (emergencyContactName !== undefined) updateData.emergency_contact_name = emergencyContactName || null

    const emergencyContactPhone = formData.get('emergencyContactPhone')?.toString()
    if (emergencyContactPhone !== undefined) updateData.emergency_contact_phone = emergencyContactPhone || null

    const emergencyContactRelationship = formData.get('emergencyContactRelationship')?.toString()
    if (emergencyContactRelationship !== undefined) updateData.emergency_contact_relationship = emergencyContactRelationship || null

    const notes = formData.get('notes')?.toString()
    if (notes !== undefined) updateData.notes = notes || null

    try {
        const { error } = await supabase
            .from('enquiries')
            .update(updateData)
            .eq('id', enquiryId)

        if (error) {
            console.error('Enquiry update error:', error)
            return { error: 'Failed to update enquiry: ' + error.message }
        }

        revalidatePath('/reception/enquiry')
        return {
            success: true,
            message: 'Enquiry updated successfully.'
        }
    } catch (err: unknown) {
        console.error('Fatal Enquiry Update Error:', err)
        return {
            error: err instanceof Error ? err.message : 'Failed to update enquiry'
        }
    }
}
