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
    check_in_time?: string | null
    check_out_time?: string | null
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
                    status: 'absent',
                    check_in_time: null,
                    check_out_time: null
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

        // Validate status value before attempting DB write
        const allowedStatuses = ['present', 'absent', 'late', 'leave']
        const desiredStatus = 'leave'
        if (!allowedStatuses.includes(desiredStatus)) {
            console.error('Invalid status attempted for leave:', desiredStatus)
            return { error: `Invalid attendance status: ${desiredStatus}` }
        }

        if (existingAttendance) {
            // Update existing record - mark as leave
            console.log('Updating existing attendance record for leave:', existingAttendance.id)
            const payload = {
                status: desiredStatus,
                check_in_time: null,
                check_out_time: null,
                updated_at: new Date().toISOString()
            }
            console.log('Update payload (leave -> null times):', payload)
            result = await supabase
                .from('employee_attendance')
                .update(payload)
                .eq('id', existingAttendance.id)
            error = result.error
            console.log('Update result:', result)
        } else {
            // Create new leave record with null times
            console.log('Creating new leave record for employee:', employeeId, 'date:', targetDate)
            const payload = {
                employee_id: employeeId,
                date: targetDate,
                status: desiredStatus,
                check_in_time: null,
                check_out_time: null
            }
            console.log('Insert payload (leave -> null times):', payload)
            result = await supabase
                .from('employee_attendance')
                .insert(payload)
            error = result?.error
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
    onLeaveToday: number
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

        // Get all employees in branch
        const { data: employees } = await supabase
            .from('employees')
            .select('id')
            .eq('branch_id', branchId)
            .eq('status', 'active')

        const employeeIds = employees?.map(e => e.id) || []

        // Get today's attendance records for this branch's employees
        const { data: attendanceRecords } = await supabase
            .from('employee_attendance')
            .select('employee_id, check_out_time, status')
            .eq('date', today)
            .in('employee_id', employeeIds)

        // Count employees with different statuses
        const presentToday = attendanceRecords?.filter(r => r.status === 'present').length || 0
        const absentToday = attendanceRecords?.filter(r => r.status === 'absent').length || 0
        const onLeaveToday = attendanceRecords?.filter(r => r.status === 'leave').length || 0
        const checkedInNow = attendanceRecords?.filter(record => !record.check_out_time && record.status === 'present').length || 0

        return {
            totalEmployees: totalEmployees || 0,
            presentToday,
            absentToday,
            checkedInNow,
            onLeaveToday // Employees marked as 'leave' status in database
        }
    } catch (err: any) {
        console.error('Error fetching attendance stats:', err)
        return {
            totalEmployees: 0,
            presentToday: 0,
            absentToday: 0,
            checkedInNow: 0,
            onLeaveToday: 0
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

export async function getEmployeesAttendanceReport(branchId: string, startDate: string, endDate: string): Promise<{
    employees: Array<{
        id: string
        full_name: string
        attendance_summary: {
            total_days: number
            present_days: number
            absent_days: number
            leave_days: number
            attendance_percentage: number
        }
        daily_attendance: Array<{
            date: string
            status: 'present' | 'absent' | 'leave'
            check_in_time?: string
            check_out_time?: string
        }>
    }>
    summary: {
        total_employees: number
        total_working_days: number
        average_attendance: number
    }
}> {
    const supabase = createAdminClient()

    try {
        // Get all active employees for this branch
        const { data: employees, error: employeesError } = await supabase
            .from('employees')
            .select('id, full_name')
            .eq('branch_id', branchId)
            .eq('status', 'active')
            .order('full_name', { ascending: true })

        if (employeesError) {
            console.error('Error fetching employees:', employeesError)
            return { employees: [], summary: { total_employees: 0, total_working_days: 0, average_attendance: 0 } }
        }

        // Calculate total working days in the range
        const start = new Date(startDate)
        const end = new Date(endDate)
        const totalWorkingDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

        // Get attendance data for all employees in the date range
        const { data: attendanceData, error: attendanceError } = await supabase
            .from('employee_attendance')
            .select('employee_id, date, status, check_in_time, check_out_time')
            .in('employee_id', employees?.map(emp => emp.id) || [])
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true })

        if (attendanceError) {
            console.error('Error fetching attendance data:', attendanceError)
            return { employees: [], summary: { total_employees: 0, total_working_days: 0, average_attendance: 0 } }
        }

        // Process attendance data for each employee
        const employeesReport = (employees || []).map(employee => {
            // Get attendance records for this employee
            const employeeAttendance = (attendanceData || []).filter(att => att.employee_id === employee.id)

            // Create a map of date -> attendance record
            const attendanceMap = new Map()
            employeeAttendance.forEach(att => {
                attendanceMap.set(att.date, att)
            })

            // Generate daily attendance for the entire date range
            const dailyAttendance = []
            let presentDays = 0
            let absentDays = 0
            let leaveDays = 0

            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const dateStr = date.toISOString().split('T')[0]
                const attendance = attendanceMap.get(dateStr)

                if (attendance) {
                    dailyAttendance.push({
                        date: dateStr,
                        status: attendance.status as 'present' | 'absent' | 'leave',
                        check_in_time: attendance.check_in_time,
                        check_out_time: attendance.check_out_time
                    })

                    if (attendance.status === 'present') presentDays++
                    else if (attendance.status === 'absent') absentDays++
                    else if (attendance.status === 'leave') leaveDays++
                } else {
                    // No attendance record - treat as absent
                    dailyAttendance.push({
                        date: dateStr,
                        status: 'absent' as const,
                        check_in_time: undefined,
                        check_out_time: undefined
                    })
                    absentDays++
                }
            }

            const totalRecordedDays = presentDays + absentDays + leaveDays
            const attendancePercentage = totalRecordedDays > 0 ? (presentDays / totalRecordedDays) * 100 : 0

            return {
                id: employee.id,
                full_name: employee.full_name,
                attendance_summary: {
                    total_days: totalWorkingDays,
                    present_days: presentDays,
                    absent_days: absentDays,
                    leave_days: leaveDays,
                    attendance_percentage: Math.round(attendancePercentage * 100) / 100
                },
                daily_attendance: dailyAttendance
            }
        })

        // Calculate overall summary
        const totalEmployees = employees?.length || 0
        const totalPresentDays = employeesReport.reduce((sum, emp) => sum + emp.attendance_summary.present_days, 0)
        const totalRecordedDays = employeesReport.reduce((sum, emp) => sum + emp.attendance_summary.present_days + emp.attendance_summary.absent_days + emp.attendance_summary.leave_days, 0)
        const averageAttendance = totalRecordedDays > 0 ? (totalPresentDays / totalRecordedDays) * 100 : 0

        return {
            employees: employeesReport,
            summary: {
                total_employees: totalEmployees,
                total_working_days: totalWorkingDays,
                average_attendance: Math.round(averageAttendance * 100) / 100
            }
        }
    } catch (err: any) {
        console.error('Error generating attendance report:', err)
        return { employees: [], summary: { total_employees: 0, total_working_days: 0, average_attendance: 0 } }
    }
}