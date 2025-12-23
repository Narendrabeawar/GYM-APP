'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type EmployeeAttendanceActionState = {
    message?: string
    error?: string
    success?: boolean
}

export type EmployeeAttendance = {
    id: string
    employee_id: string
    check_in_time: string
    check_out_time?: string
    date: string
    status: 'present' | 'absent' | 'late' | 'leave'
    created_at: string
    updated_at: string
}

export async function checkInEmployee(employeeId: string): Promise<EmployeeAttendanceActionState> {
    if (!employeeId) {
        return { error: 'Employee ID is required' }
    }

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const now = new Date().toISOString()

    try {
        // Check if employee already checked in today
        const { data: existingAttendance } = await supabase
            .from('employee_attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', today)
            .single()

        if (existingAttendance && !existingAttendance.check_out_time) {
            return { error: 'Employee is already checked in for today' }
        }

        // Create new attendance record
        const { error } = await supabase
            .from('employee_attendance')
            .insert({
                employee_id: employeeId,
                check_in_time: now,
                date: today,
                status: 'present'
            })

        if (error) {
            console.error('Error checking in employee:', error)
            return { error: 'Failed to check in employee' }
        }

        revalidatePath('/branch/employee')
        return { success: true, message: 'Employee checked in successfully' }
    } catch (err: any) {
        console.error('Unexpected error during check-in:', err)
        return { error: err?.message || 'Failed to check in employee' }
    }
}

export async function checkOutEmployee(employeeId: string): Promise<EmployeeAttendanceActionState> {
    if (!employeeId) {
        return { error: 'Employee ID is required' }
    }

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    try {
        // Find today's attendance record
        const { data: attendance, error: findError } = await supabase
            .from('employee_attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', today)
            .is('check_out_time', null)
            .single()

        if (findError || !attendance) {
            return { error: 'No active check-in found for today' }
        }

        // Update with check-out time
        const { error } = await supabase
            .from('employee_attendance')
            .update({
                check_out_time: now,
                updated_at: now
            })
            .eq('id', attendance.id)

        if (error) {
            console.error('Error checking out employee:', error)
            return { error: 'Failed to check out employee' }
        }

        revalidatePath('/branch/employee')
        return { success: true, message: 'Employee checked out successfully' }
    } catch (err: any) {
        console.error('Unexpected error during check-out:', err)
        return { error: err?.message || 'Failed to check out employee' }
    }
}

export async function markEmployeeAbsent(employeeId: string, date?: string): Promise<EmployeeAttendanceActionState> {
    if (!employeeId) {
        return { error: 'Employee ID is required' }
    }

    const supabase = createAdminClient()
    const targetDate = date || new Date().toISOString().split('T')[0]

    try {
        // Check if attendance already exists for this date
        const { data: existingAttendance } = await supabase
            .from('employee_attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', targetDate)
            .single()

        let error = null
        let result

        if (existingAttendance) {
            // Update existing record
            console.log('Updating existing attendance record for absent:', existingAttendance.id)
            result = await supabase
                .from('employee_attendance')
                .update({
                    status: 'absent',
                    check_in_time: null,
                    check_out_time: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingAttendance.id)
            error = result.error
            console.log('Update result:', result)
        } else {
            // Create new absent record
            console.log('Creating new absent record for employee:', employeeId, 'date:', targetDate)
            result = await supabase
                .from('employee_attendance')
                .insert({
                    employee_id: employeeId,
                    date: targetDate,
                    status: 'absent'
                })
            error = result.error
            console.log('Insert result:', result)
        }

        if (error) {
            console.error('Error marking employee absent:', error)
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            return { error: `Failed to mark employee as absent: ${error.message || 'Unknown error'}` }
        }

        revalidatePath('/branch/employee')
        return { success: true, message: 'Employee marked as absent for today' }
    } catch (err: any) {
        console.error('Unexpected error marking absent:', err)
        return { error: err?.message || 'Failed to mark employee as absent' }
    }
}

export async function markEmployeeOnLeave(employeeId: string, date?: string): Promise<EmployeeAttendanceActionState> {
    if (!employeeId) {
        return { error: 'Employee ID is required' }
    }

    const supabase = createAdminClient()
    const targetDate = date || new Date().toISOString().split('T')[0]

    try {
        // Check if attendance already exists for this date
        const { data: existingAttendance } = await supabase
            .from('employee_attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', targetDate)
            .single()

        let error = null
        let result

        if (existingAttendance) {
            // Update existing record
            console.log('Updating existing attendance record for leave:', existingAttendance.id)
            result = await supabase
                .from('employee_attendance')
                .update({
                    status: 'leave',
                    check_in_time: null,
                    check_out_time: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingAttendance.id)
            error = result.error
            console.log('Update result:', result)
        } else {
            // Create new leave record
            console.log('Creating new leave record for employee:', employeeId, 'date:', targetDate)
            result = await supabase
                .from('employee_attendance')
                .insert({
                    employee_id: employeeId,
                    date: targetDate,
                    status: 'leave'
                })
            error = result.error
            console.log('Insert result:', result)
        }

        if (error) {
            console.error('Error marking employee on leave:', error)
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            return { error: `Failed to mark employee on leave: ${error.message || 'Unknown error'}` }
        }

        revalidatePath('/branch/employee')
        return { success: true, message: 'Employee marked as on leave for today' }
    } catch (err: any) {
        console.error('Unexpected error marking on leave:', err)
        return { error: err?.message || 'Failed to mark employee on leave' }
    }
}

export async function getEmployeeAttendance(employeeId: string, date?: string): Promise<EmployeeAttendance[]> {
    const supabase = createAdminClient()
    const targetDate = date || new Date().toISOString().split('T')[0]

    try {
        const { data, error } = await supabase
            .from('employee_attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', targetDate)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching employee attendance:', error)
            return []
        }

        return data || []
    } catch (err: any) {
        console.error('Unexpected error fetching attendance:', err)
        return []
    }
}

export async function getTodayAttendanceStats(branchId: string): Promise<{
    totalEmployees: number
    presentToday: number
    absentToday: number
    checkedInNow: number
}> {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    try {
        // Get total employees in branch
        const { count: totalEmployees } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .eq('status', 'active')

        // Get today's attendance records
        const { data: attendanceRecords } = await supabase
            .from('employee_attendance')
            .select('employee_id, check_out_time')
            .eq('date', today)

        const presentToday = attendanceRecords?.length || 0
        const checkedInNow = attendanceRecords?.filter(record => !record.check_out_time).length || 0
        const absentToday = (totalEmployees || 0) - presentToday

        return {
            totalEmployees: totalEmployees || 0,
            presentToday,
            absentToday: Math.max(0, absentToday),
            checkedInNow
        }
    } catch (err: any) {
        console.error('Error fetching attendance stats:', err)
        return {
            totalEmployees: 0,
            presentToday: 0,
            absentToday: 0,
            checkedInNow: 0
        }
    }
}

export async function getEmployeesWithAttendance(branchId: string): Promise<Array<{
    id: string
    full_name: string
    email?: string
    phone: string
    designation?: string
    address?: string
    date_of_birth?: string
    gender?: 'male' | 'female' | 'other'
    emergency_contact?: string
    emergency_phone?: string
    status: string
    created_at: string
    today_attendance?: EmployeeAttendance | null
}>> {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    try {
        // Get all active employees for this branch
        const { data: employees, error: employeesError } = await supabase
            .from('employees')
            .select('id, full_name, email, phone, designation, address, date_of_birth, gender, emergency_contact, emergency_phone, status, created_at')
            .eq('branch_id', branchId)
            .eq('status', 'active')
            .order('full_name', { ascending: true })

        if (employeesError) {
            console.error('Error fetching employees:', employeesError)
            return []
        }

        // Get today's attendance for each employee
        const employeesWithAttendance = await Promise.all(
            (employees || []).map(async (employee) => {
                const { data: attendance } = await supabase
                    .from('employee_attendance')
                    .select('*')
                    .eq('employee_id', employee.id)
                    .eq('date', today)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                return {
                    ...employee,
                    today_attendance: attendance || null
                }
            })
        )

        return employeesWithAttendance
    } catch (err: any) {
        console.error('Error fetching employees with attendance:', err)
        return []
    }
}
