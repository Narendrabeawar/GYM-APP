'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Users,
    CheckCircle2,
    XCircle,
    UserPlus,
    Loader2,
    Calendar,
    Phone,
    Mail,
    MapPin,
    Shield,
    MoreHorizontal,
    Edit,
    Trash2,
    BarChart3,
    PauseCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { checkInEmployee, checkOutEmployee, markEmployeeAbsent, markEmployeeOnLeave, getTodayAttendanceStats, getEmployeesWithAttendance, type EmployeeAttendance } from '@/app/actions/employee-attendance'
import { deleteEmployee } from '@/app/actions/employee'
import AddEmployeeForm from '@/components/AddEmployeeForm'
import ResultDialog from '@/components/ResultDialog'


type Employee = {
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
}

export default function BranchEmployeePage() {
    const [employeeStats, setEmployeeStats] = useState([
        { name: 'Today Present', value: '0', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', percentage: '0%' },
        { name: 'Total Employees', value: '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', percentage: '100%' },
        { name: 'Absent Today', value: '0', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', percentage: '0%' },
        { name: "Today's On Leave", value: '0', icon: PauseCircle, color: 'text-orange-600', bg: 'bg-orange-50', percentage: '0%' },
    ])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    // Helper: optimistic update top stat cards when an employee's status changes locally
    const updateTopStatsOptimistic = (employeeId: string, newStatus: 'present' | 'absent' | 'leave') => {
        const prevStatus = employees.find(e => e.id === employeeId)?.today_attendance?.status as (string | undefined)
        if (prevStatus === newStatus) return

        setEmployeeStats(prev => {
            const totalEmployees = Number(prev[1].value) || 0
            let present = Number(prev[0].value) || 0
            let absent = Number(prev[2].value) || 0
            let onLeave = Number(prev[3].value) || 0

            // decrement previous
            if (prevStatus === 'present') present = Math.max(0, present - 1)
            if (prevStatus === 'absent') absent = Math.max(0, absent - 1)
            if (prevStatus === 'leave') onLeave = Math.max(0, onLeave - 1)

            // increment new
            if (newStatus === 'present') present++
            if (newStatus === 'absent') absent++
            if (newStatus === 'leave') onLeave++

            const pct = (n: number) => totalEmployees > 0 ? `${Math.round((n / totalEmployees) * 100)}%` : '0%'

            return [
                { ...prev[0], value: String(present), percentage: pct(present) },
                { ...prev[1], value: String(totalEmployees), percentage: prev[1].percentage },
                { ...prev[2], value: String(absent), percentage: pct(absent) },
                { ...prev[3], value: String(onLeave), percentage: pct(onLeave) }
            ]
        })
    }
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [finalDeleteConfirmationOpen, setFinalDeleteConfirmationOpen] = useState(false)
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
    const [gymId, setGymId] = useState<string | null>(null)
    const [branchId, setBranchId] = useState<string | null>(null)
    const [resultDialogOpen, setResultDialogOpen] = useState(false)
    const [resultDialogType, setResultDialogType] = useState<'success' | 'error' | 'warning' | 'loading'>('success')
    const [resultDialogTitle, setResultDialogTitle] = useState('')
    const [resultDialogDescription, setResultDialogDescription] = useState<string | undefined>('')

    const router = useRouter()



    // Table columns definition
    /* eslint-disable react-hooks/exhaustive-deps */
    const columns = useMemo<ColumnDef<Employee>[]>(() => [
        {
            header: 'Sr.No.',
            size: 80,
            cell: ({ row }) => <span className="font-medium text-stone-500">{row.index + 1}</span>,
        },
        {
            accessorKey: 'full_name',
            header: 'Employee Name',
            size: 180,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-sm shadow-sm">
                        {(row.getValue('full_name') as string || 'U').substring(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold text-stone-900">{row.getValue('full_name')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'designation',
            header: 'Designation',
            size: 120,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="capitalize font-medium text-stone-700">
                        {row.getValue('designation') || 'Employee'}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'phone',
            header: 'Phone Number',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">{row.getValue('phone')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>{row.getValue('email') || 'Not provided'}</span>
                </div>
            ),
        },
        {
            accessorKey: 'address',
            header: 'Address',
            size: 300,
            cell: ({ row }) => (
                <div className="flex items-start gap-2 max-w-[280px]">
                    <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-stone-600 text-sm leading-snug wrap-break-word">
                        {row.getValue('address') || 'Not provided'}
                    </span>
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Today\'s Status',
            cell: ({ row }) => {
                const employee = row.original as Employee
                return employee.today_attendance ? (
                    employee.today_attendance.status === 'absent' ? (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                            Absent
                        </Badge>
                    ) : employee.today_attendance.status === 'leave' ? (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                            On Leave
                        </Badge>
                    ) : employee.today_attendance.check_out_time ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                        Completed
                        </Badge>
                    ) : (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 animate-pulse">
                            In Office
                        </Badge>
                    )
                ) : (
                    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200">
                        Not Checked In
                    </Badge>
                )
            },
        },
        {
            id: 'check_in_time',
            header: 'Check-in',
            cell: ({ row }) => {
                const employee = row.original as Employee
                const checkIn = employee.today_attendance?.check_in_time
                return checkIn ? (
                    <div className="text-sm font-medium text-stone-700">
                        {new Date(checkIn).toLocaleTimeString()}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">-</div>
                )
            },
        },
        {
            id: 'actions',
            header: 'Attendance Actions',
            cell: ({ row }) => {
                const employee = row.original
                return (
                    <div className="flex gap-2">
                        {!employee.today_attendance ? (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => handleCheckIn(employee.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white h-8"
                                >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Check In
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleMarkAbsent(employee.id)}
                                    variant="outline"
                                    className="border-orange-200 hover:bg-orange-50 text-orange-600 h-8"
                                >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Absent
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleMarkOnLeave(employee.id)}
                                    variant="outline"
                                    className="border-blue-200 hover:bg-blue-50 text-blue-600 h-8"
                                >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Leave
                                </Button>
                            </>
                        ) : employee.today_attendance.check_out_time ? (
                            <div className="text-xs text-muted-foreground px-2 py-1 bg-gray-50 rounded">
                                Checked out at {new Date(employee.today_attendance.check_out_time).toLocaleTimeString()}
                            </div>
                        ) : employee.today_attendance.status === 'present' ? (
                            <Button
                                size="sm"
                                onClick={() => handleCheckOut(employee.id)}
                                variant="outline"
                                className="border-red-200 hover:bg-red-50 text-red-600 h-8"
                            >
                                <XCircle className="w-3 h-3 mr-1" />
                                Check Out
                            </Button>
                        ) : employee.today_attendance.status === 'absent' ? (
                            <div className="text-xs text-orange-600 font-medium px-2 py-1 bg-orange-50 rounded">
                                Marked as Absent Today
                            </div>
                        ) : employee.today_attendance.status === 'leave' ? (
                            <div className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded">
                                On Leave Today
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => handleCheckOut(employee.id)}
                                variant="outline"
                                className="border-red-200 hover:bg-red-50 text-red-600 h-8"
                            >
                                <XCircle className="w-3 h-3 mr-1" />
                                Check Out
                            </Button>
                        )}
                    </div>
                )
            },
        },
        {
            id: 'more_actions',
            header: 'Actions',
            cell: ({ row }) => {
                const employee = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-40 p-1">
                            <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold">Employee Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => {
                                    setEditingEmployee(employee)
                                    setEditDialogOpen(true)
                                }}
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700 focus:text-emerald-900 font-medium transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => initiateDeleteEmployee(employee)}
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 focus:text-red-700 font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Employee
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [])

    const supabase = createClient()

    const loadStats = useCallback(async (currentBranchId: string) => {
        if (!currentBranchId) return

        const stats = await getTodayAttendanceStats(currentBranchId)
        setEmployeeStats([
            {
                name: 'Today Present',
                value: stats.presentToday.toString(),
                icon: CheckCircle2,
                color: 'text-green-600',
                bg: 'bg-green-50',
                percentage: stats.totalEmployees > 0 ? `${Math.round((stats.presentToday / stats.totalEmployees) * 100)}%` : '0%'
            },
            {
                name: 'Total Employees',
                value: stats.totalEmployees.toString(),
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                percentage: '100%'
            },
            {
                name: 'Absent Today',
                value: stats.absentToday.toString(),
                icon: XCircle,
                color: 'text-red-600',
                bg: 'bg-red-50',
                percentage: stats.totalEmployees > 0 ? `${Math.round((stats.absentToday / stats.totalEmployees) * 100)}%` : '0%'
            },
            {
                name: "Today's On Leave",
                value: stats.onLeaveToday.toString(),
                icon: PauseCircle,
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                percentage: stats.totalEmployees > 0 ? `${Math.round((stats.onLeaveToday / stats.totalEmployees) * 100)}%` : '0%'
            },
        ])
    }, [])

    const fetchEmployees = useCallback(async (currentBranchId: string) => {
        setIsLoading(true)
        const employeesWithAttendance = await getEmployeesWithAttendance(currentBranchId)
        setEmployees(employeesWithAttendance)
        loadStats(currentBranchId)
        setIsLoading(false)
    }, [loadStats])

    async function handleCheckIn(employeeId: string) {
        const result = await checkInEmployee(employeeId)
        if (result.success) {
            // Optimistic UI update: set employee as present with check_in_time now
            const now = new Date().toISOString()
            setEmployees(prev => prev.map(emp => {
                if (emp.id !== employeeId) return emp
                return {
                    ...emp,
                    today_attendance: {
                        id: emp.today_attendance?.id || 'temp-' + employeeId,
                        employee_id: employeeId,
                        check_in_time: now,
                        check_out_time: undefined,
                        date: new Date().toISOString().split('T')[0],
                        status: 'present',
                        created_at: emp.today_attendance?.created_at || now,
                        updated_at: now
                    }
                }
            }))

            // Update top stat cards optimistically
            updateTopStatsOptimistic(employeeId, 'present')

            setResultDialogType('success')
            setResultDialogTitle('Check-in Successful!')
            setResultDialogDescription(result.message)
            setResultDialogOpen(true)
            // Refresh server data to ensure final state is synced
            if (branchId) {
                fetchEmployees(branchId)
            }
        } else {
            setResultDialogType('error')
            setResultDialogTitle('Check-in Failed')
            setResultDialogDescription(result.error)
            setResultDialogOpen(true)
        }
    }

    async function handleCheckOut(employeeId: string) {
        const result = await checkOutEmployee(employeeId)
        if (result.success) {
            // Optimistic UI update: set check_out_time now while keeping existing check_in_time
            const now = new Date().toISOString()
            setEmployees(prev => prev.map(emp => {
                if (emp.id !== employeeId) return emp
                return {
                    ...emp,
                    today_attendance: {
                        id: emp.today_attendance?.id || 'temp-' + employeeId,
                        employee_id: employeeId,
                        check_in_time: emp.today_attendance?.check_in_time || undefined,
                        check_out_time: now,
                        date: emp.today_attendance?.date || new Date().toISOString().split('T')[0],
                        status: emp.today_attendance?.status || 'present',
                        created_at: emp.today_attendance?.created_at || now,
                        updated_at: now
                    }
                }
            }))

            // No change to top counts for check-out (status remains 'present')
            // but we still refresh server data below.

            setResultDialogType('success')
            setResultDialogTitle('Check-out Successful!')
            setResultDialogDescription(result.message)
            setResultDialogOpen(true)
            // Refresh server data to ensure final state is synced
            if (branchId) {
                fetchEmployees(branchId)
            }
        } else {
            setResultDialogType('error')
            setResultDialogTitle('Check-out Failed')
            setResultDialogDescription(result.error)
            setResultDialogOpen(true)
        }
    }

    async function handleMarkAbsent(employeeId: string) {
        const result = await markEmployeeAbsent(employeeId)
        if (result.success) {
            // Optimistic UI update: immediately reflect "absent" status in the table
            const now = new Date().toISOString()
            setEmployees(prev => prev.map(emp => {
                if (emp.id !== employeeId) return emp
                return {
                    ...emp,
                    today_attendance: {
                        id: emp.today_attendance?.id || 'temp-' + employeeId,
                        employee_id: employeeId,
                        check_in_time: undefined,
                        check_out_time: undefined,
                        date: new Date().toISOString().split('T')[0],
                        status: 'absent',
                        created_at: emp.today_attendance?.created_at || now,
                        updated_at: now
                    }
                }
            }))

            // Update top stat cards optimistically
            updateTopStatsOptimistic(employeeId, 'absent')

            setResultDialogType('success')
            setResultDialogTitle('Marked as Absent')
            setResultDialogDescription(result.message)
            setResultDialogOpen(true)
            if (branchId) {
                fetchEmployees(branchId)
            }
        } else {
            setResultDialogType('error')
            setResultDialogTitle('Failed to Mark Absent')
            setResultDialogDescription(result.error)
            setResultDialogOpen(true)
        }
    }

    async function handleMarkOnLeave(employeeId: string) {
        const result = await markEmployeeOnLeave(employeeId)
        if (result.success) {
            // Optimistic UI update: immediately reflect "leave" status in the table
            const now = new Date().toISOString()
            setEmployees(prev => prev.map(emp => {
                if (emp.id !== employeeId) return emp
                return {
                    ...emp,
                    today_attendance: {
                        id: emp.today_attendance?.id || 'temp-' + employeeId,
                        employee_id: employeeId,
                        check_in_time: undefined,
                        check_out_time: undefined,
                        date: new Date().toISOString().split('T')[0],
                        status: 'leave',
                        created_at: emp.today_attendance?.created_at || now,
                        updated_at: now
                    }
                }
            }))

            // Update top stat cards optimistically
            updateTopStatsOptimistic(employeeId, 'leave')

            setResultDialogType('success')
            setResultDialogTitle('Marked as On Leave')
            setResultDialogDescription(result.message)
            setResultDialogOpen(true)

            // Also refresh server data to ensure final state is synced
            if (branchId) {
                fetchEmployees(branchId)
            }
        } else {
            setResultDialogType('error')
            setResultDialogTitle('Failed to Mark On Leave')
            setResultDialogDescription(result.error || 'Unable to mark employee as on leave. Please try again or contact support.')
            setResultDialogOpen(true)
        }
    }

    const handleDeleteEmployee = async (employeeId: string) => {
        const result = await deleteEmployee(employeeId)
        if (result.success) {
            setResultDialogType('success')
            setResultDialogTitle('Employee Deleted Successfully!')
            setResultDialogDescription(result.message)
            setResultDialogOpen(true)
            setFinalDeleteConfirmationOpen(false)
            setEmployeeToDelete(null)
            if (branchId) {
                fetchEmployees(branchId)
            }
        } else {
            setResultDialogType('error')
            setResultDialogTitle('Failed to Delete Employee')
            setResultDialogDescription(result.error || 'Unable to delete employee. Please try again or contact support.')
            setResultDialogOpen(true)
            setFinalDeleteConfirmationOpen(false)
            setEmployeeToDelete(null)
        }
    }

    const initiateDeleteEmployee = (employee: Employee) => {
        setEmployeeToDelete(employee)
        setDeleteConfirmationOpen(true)
    }

    const confirmFirstDelete = () => {
        setDeleteConfirmationOpen(false)
        setFinalDeleteConfirmationOpen(true)
    }


    useEffect(() => {
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata) {
                setGymId(user.user_metadata.gym_id)
                setBranchId(user.user_metadata.branch_id)
            if (user.user_metadata.branch_id) {
                fetchEmployees(user.user_metadata.branch_id)
                loadStats(user.user_metadata.branch_id)
            }
            }
        }
        getSession()
    }, [fetchEmployees, loadStats, supabase])


    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient-emerald">
                        Employee Management
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage employees, track attendance, and monitor performance</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => router.push('/branch/employee/attendance-report')}
                        variant="outline"
                        className="border-emerald-200 hover:bg-emerald-50 text-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Attendance Report
                    </Button>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Employee
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {employeeStats.map((stat, index) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="glass border-green-100 card-hover">
                            {/* Reduced height by ~40% via h-20 (was larger). Adjust if needed */}
                            <CardContent className="p-3 h-24 relative flex flex-col justify-start items-start">
                                {/* top row: icon left, percentage badge right - slightly moved up */}
                                <div className="flex justify-between items-center w-full -mt-1">
                                    <div className="flex items-center gap-3 -mt-1">
                                        <div className={`w-9 h-9 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full -mt-1">
                                        {stat.percentage}
                                    </span>
                                </div>

                                <div className="mt-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{stat.name}</p>
                                    <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                </motion.div>
            ))}
            </div>

            {/* Employee Table */}

            {/* Employee Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full"
            >
                {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-emerald-800 animate-spin" />
                            <p className="text-stone-500 font-medium animate-pulse">Loading Employees...</p>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="text-center py-20">
                            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">No employees found</p>
                            <p className="text-sm text-muted-foreground mt-2">Add your first employee using the &ldquo;Add Employee&rdquo; button</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={employees} />
                    )}
            </motion.div>

            {/* Add Employee Form */}
            <AddEmployeeForm
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                gymId={gymId}
                branchId={branchId}
                onSuccess={() => {
                    // close create modal, show success and refresh list
                    setCreateDialogOpen(false)
                    setResultDialogType('success')
                    setResultDialogTitle('Employee Created Successfully!')
                    setResultDialogDescription('The new employee has been added.')
                    setResultDialogOpen(true)
                    if (branchId) {
                        fetchEmployees(branchId)
                    }
                }}
            />

            {/* Edit Employee Form */}
            <AddEmployeeForm
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                gymId={gymId}
                branchId={branchId}
                editMode={true}
                employeeData={editingEmployee ? {
                    id: editingEmployee.id,
                    full_name: editingEmployee.full_name,
                    email: editingEmployee.email,
                    phone: editingEmployee.phone,
                    designation: editingEmployee.designation,
                    address: editingEmployee.address,
                    date_of_birth: editingEmployee.date_of_birth,
                    gender: editingEmployee.gender,
                    emergency_contact: editingEmployee.emergency_contact,
                    emergency_phone: editingEmployee.emergency_phone
                } : null}
                onSuccess={() => {
                    setResultDialogType('success')
                    setResultDialogTitle('Employee Updated Successfully!')
                    setResultDialogDescription('Employee information has been updated.')
                    setResultDialogOpen(true)
                    fetchEmployees(branchId!)
                    setEditingEmployee(null)
                    setEditDialogOpen(false)
                }}
            />

            {/* Result Dialog for Check-in/Check-out */}
            <ResultDialog
                open={resultDialogOpen}
                onOpenChange={setResultDialogOpen}
                type={resultDialogType}
                title={resultDialogTitle}
                description={resultDialogDescription}
                actionText="Continue"
                autoClose={resultDialogType === 'success'}
            />

            {/* First Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
                <AlertDialogContent className="bg-white border-2 border-red-200 shadow-2xl rounded-2xl max-w-md">
                    <AlertDialogHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            Delete Employee
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 text-base leading-relaxed">
                            Are you sure you want to delete <span className="font-semibold text-red-600">{employeeToDelete?.full_name}</span>?
                            <br />
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-3 pt-6">
                        <AlertDialogCancel
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-xl py-3 font-medium transition-colors"
                            onClick={() => {
                                setDeleteConfirmationOpen(false)
                                setEmployeeToDelete(null)
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmFirstDelete}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl py-3 font-medium transition-colors"
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Final Delete Confirmation Dialog */}
            <AlertDialog open={finalDeleteConfirmationOpen} onOpenChange={setFinalDeleteConfirmationOpen}>
                <AlertDialogContent className="bg-white border-2 border-red-200 shadow-2xl rounded-2xl max-w-md">
                    <AlertDialogHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="w-8 h-8 text-red-600 animate-pulse" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            Final Confirmation
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 text-base leading-relaxed">
                            I am about to perform the final delete of <span className="font-semibold text-red-600">{employeeToDelete?.full_name}</span>.
                            <br />
                            <span className="font-semibold text-red-700">This action is irreversible!</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-3 pt-6">
                        <AlertDialogCancel
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-xl py-3 font-medium transition-colors"
                            onClick={() => {
                                setFinalDeleteConfirmationOpen(false)
                                setEmployeeToDelete(null)
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => employeeToDelete && handleDeleteEmployee(employeeToDelete.id)}
                            className="flex-1 bg-red-700 hover:bg-red-800 text-white border-0 rounded-xl py-3 font-medium transition-colors"
                        >
                            Final Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
