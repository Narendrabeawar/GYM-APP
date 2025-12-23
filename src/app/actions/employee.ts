'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type EmployeeActionState = {
    message?: string
    error?: string
    success?: boolean
}

export type Employee = {
    id: string
    gym_id: string
    branch_id: string
    full_name: string
    email?: string
    phone: string
    designation?: string
    address?: string
    date_of_birth?: string
    gender?: 'male' | 'female' | 'other'
    emergency_contact?: string
    emergency_phone?: string
    joining_date: string
    status: 'active' | 'inactive' | 'terminated'
    created_at: string
    updated_at: string
}

export async function createEmployee(prevState: EmployeeActionState, formData: FormData): Promise<EmployeeActionState> {
    const fullName = formData.get('fullName')?.toString() || ''
    const email = formData.get('email')?.toString() || ''
    const phone = formData.get('phone')?.toString() || ''
    const designation = formData.get('designation')?.toString() || ''
    const address = formData.get('address')?.toString() || ''
    const dateOfBirth = formData.get('dateOfBirth')?.toString() || ''
    const gender = formData.get('gender')?.toString() || ''
    const emergencyContact = formData.get('emergencyContact')?.toString() || ''
    const emergencyPhone = formData.get('emergencyPhone')?.toString() || ''
    const gymId = formData.get('gymId')?.toString() || ''
    const branchId = formData.get('branchId')?.toString() || ''

    // Basic validation
    if (!fullName || !phone || !gymId || !branchId) {
        return { error: 'Full Name, Phone, Gym ID, and Branch ID are required.' }
    }

    const supabase = createAdminClient()

    try {
        // If a designation name is provided, ensure it exists in the designations table for this branch
        if (designation && branchId) {
            try {
                const { data: existingDesignation, error: selectErr } = await supabase
                    .from('designations')
                    .select('id')
                    .eq('branch_id', branchId)
                    .eq('name', designation)
                    .limit(1)
                    .maybeSingle()

                if (selectErr) {
                    console.error('Error checking existing designation:', selectErr)
                } else if (!existingDesignation) {
                    const { error: insertDesErr } = await supabase
                        .from('designations')
                        .insert({
                            gym_id: gymId,
                            branch_id: branchId,
                            name: designation
                        })

                    if (insertDesErr) {
                        console.error('Error inserting designation:', insertDesErr)
                    }
                }
            } catch (desErr: any) {
                console.error('Fatal designation upsert error:', desErr)
            }
        }
        // Create the employee record
        const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .insert({
                gym_id: gymId,
                branch_id: branchId,
                full_name: fullName,
                email: email || null,
                phone: phone,
                designation: designation || null,
                address: address || null,
                date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null,
                gender: gender as 'male' | 'female' | 'other' || null,
                emergency_contact: emergencyContact || null,
                emergency_phone: emergencyPhone || null,
                joining_date: new Date().toISOString().split('T')[0],
                status: 'active'
            })
            .select()
            .single()

        if (employeeError) {
            console.error('Employee creation error:', employeeError)
            return { error: 'Failed to create employee record: ' + employeeError.message }
        }

        revalidatePath('/branch/employee')
        return {
            success: true,
            message: `Employee ${fullName} created successfully.`
        }

    } catch (err: any) {
        console.error('Fatal Employee Creation Error:', err)
        return {
            error: typeof err === 'string' ? err : (err?.message || 'A server error occurred. Please try again later.')
        }
    }
}

export async function updateEmployee(employeeId: string, formData: FormData): Promise<EmployeeActionState> {
    if (!employeeId) {
        return { error: 'Employee ID is required' }
    }

    const supabase = createAdminClient()

    const updateData: any = {
        updated_at: new Date().toISOString()
    }

    // Only add fields that are provided
    const fullName = formData.get('fullName')?.toString()
    if (fullName) updateData.full_name = fullName

    const email = formData.get('email')?.toString()
    if (email !== undefined) updateData.email = email || null

    const phone = formData.get('phone')?.toString()
    if (phone) updateData.phone = phone

    const designation = formData.get('designation')?.toString()
    if (designation !== undefined) updateData.designation = designation || null

    const address = formData.get('address')?.toString()
    if (address !== undefined) updateData.address = address || null

    const dateOfBirth = formData.get('dateOfBirth')?.toString()
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null

    const gender = formData.get('gender')?.toString()
    if (gender !== undefined) updateData.gender = gender as 'male' | 'female' | 'other' || null

    const emergencyContact = formData.get('emergencyContact')?.toString()
    if (emergencyContact !== undefined) updateData.emergency_contact = emergencyContact || null

    const emergencyPhone = formData.get('emergencyPhone')?.toString()
    if (emergencyPhone !== undefined) updateData.emergency_phone = emergencyPhone || null

    const status = formData.get('status')?.toString()
    if (status) updateData.status = status as 'active' | 'inactive' | 'terminated'

    try {
        const { error } = await supabase
            .from('employees')
            .update(updateData)
            .eq('id', employeeId)

        if (error) {
            console.error('Employee update error:', error)
            return { error: 'Failed to update employee: ' + error.message }
        }

        revalidatePath('/branch/employee')
        return {
            success: true,
            message: 'Employee updated successfully.'
        }
    } catch (err: any) {
        console.error('Fatal Employee Update Error:', err)
        return {
            error: err?.message || 'Failed to update employee'
        }
    }
}

export async function deleteEmployee(employeeId: string): Promise<EmployeeActionState> {
    if (!employeeId) {
        return { error: 'Employee ID is required' }
    }

    const supabase = createAdminClient()

    try {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', employeeId)

        if (error) {
            console.error('Employee deletion error:', error)
            return { error: 'Failed to delete employee: ' + error.message }
        }

        revalidatePath('/branch/employee')
        return {
            success: true,
            message: 'Employee deleted successfully.'
        }
    } catch (err: any) {
        console.error('Fatal Employee Deletion Error:', err)
        return {
            error: err?.message || 'Failed to delete employee'
        }
    }
}

export async function getEmployeesByBranch(branchId: string): Promise<Employee[]> {
    const supabase = createAdminClient()

    try {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching employees:', error)
            return []
        }

        return data || []
    } catch (err: any) {
        console.error('Fatal error fetching employees:', err)
        return []
    }
}
