'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Users,
    CheckCircle2,
    XCircle,
    Search,
    Download,
    Calendar,
    ArrowLeft,
    Loader2,
    BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { getEmployeesAttendanceReport, getTodayAttendanceStats } from '@/app/actions/employee-attendance'

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
    today_attendance?: any
}

export default function AttendanceReportPage() {
    const router = useRouter()
    const [employeeStats, setEmployeeStats] = useState([{
        name: 'Today Present',
        value: '0',
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
        percentage: '0%'
    }])

    const [reportStartDate, setReportStartDate] = useState('')
    const [reportEndDate, setReportEndDate] = useState('')
    const [attendanceReport, setAttendanceReport] = useState<any>(null)
    const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<any>(null)
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const [reportGenerated, setReportGenerated] = useState(false)
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('')
    const [branchId, setBranchId] = useState<string | null>(null)

    // Helper functions for date formatting
    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    }


    // Get branch ID from authenticated user
    useEffect(() => {
        const getBranchId = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user?.user_metadata?.branch_id) {
                    setBranchId(user.user_metadata.branch_id)
                    // Load today's stats
                    const stats = await getTodayAttendanceStats(user.user_metadata.branch_id)
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
                            name: 'Avg Attendance',
                            value: '0%',
                            icon: CheckCircle2,
                            color: 'text-emerald-600',
                            bg: 'bg-emerald-50',
                            percentage: '0%'
                        },
                    ])
                } else {
                    router.push('/auth/login')
                }
            } catch (error) {
                console.error('Error getting branch ID:', error)
            }
        }
        getBranchId()
    }, [router])

    const handleSetCurrentMonth = () => {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        setReportStartDate(startOfMonth.toISOString().split('T')[0])
        setReportEndDate(endOfMonth.toISOString().split('T')[0])
    }

    // Filter employees based on search query
    const filteredEmployees = useCallback(() => {
        if (!attendanceReport?.employees) return []
        if (!employeeSearchQuery.trim()) return attendanceReport.employees

        const query = employeeSearchQuery.toLowerCase().trim()
        return attendanceReport.employees.filter((employee: any) =>
            employee.full_name.toLowerCase().includes(query)
        )
    }, [attendanceReport, employeeSearchQuery])

    const handleGenerateReport = async () => {
        if (!branchId || !reportStartDate || !reportEndDate) {
            alert('Please select both start and end dates.')
            return
        }

        if (new Date(reportStartDate) > new Date(reportEndDate)) {
            alert('Start date cannot be after end date.')
            return
        }

        setIsGeneratingReport(true)
        try {
            const report = await getEmployeesAttendanceReport(branchId, reportStartDate, reportEndDate)
            setAttendanceReport(report)
            setSelectedEmployeeDetail(null)
            setReportGenerated(true)
        } catch (error) {
            console.error('Error generating report:', error)
            alert('Unable to generate attendance report. Please try again.')
        } finally {
            setIsGeneratingReport(false)
        }
    }

    const handleShowEmployeeDetail = (employee: any) => {
        setSelectedEmployeeDetail(employee)
    }

    const handleBackToReport = () => {
        setSelectedEmployeeDetail(null)
        setEmployeeSearchQuery('')
    }

    // If viewing employee details, show only the details (full screen)
    if (selectedEmployeeDetail) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleBackToReport}
                                    variant="outline"
                                    size="sm"
                                    className="border-emerald-200 hover:bg-emerald-50"
                                >
                                    ← Back to Report
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-stone-900">{selectedEmployeeDetail.full_name}</h1>
                                    <p className="text-sm text-stone-500">Detailed attendance from {formatDateForDisplay(reportStartDate)} to {formatDateForDisplay(reportEndDate)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-stone-600">
                                    <div className="font-semibold text-lg text-stone-900 mb-1">Attendance: {selectedEmployeeDetail.attendance_summary.attendance_percentage}%</div>
                                    <div className="flex gap-4 text-xs">
                                        <span>Present: <span className="text-green-600 font-semibold">{selectedEmployeeDetail.attendance_summary.present_days}</span></span>
                                        <span>Absent: <span className="text-red-600 font-semibold">{selectedEmployeeDetail.attendance_summary.absent_days}</span></span>
                                        <span>Leave: <span className="text-blue-600 font-semibold">{selectedEmployeeDetail.attendance_summary.leave_days}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Daily Attendance Calendar */}
                        <div className="bg-stone-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Daily Attendance Details
                            </h3>
                            <div className="overflow-x-auto">
                                <div className="grid grid-cols-10 gap-2 min-w-max">
                                    {selectedEmployeeDetail.daily_attendance.map((day: any) => (
                                        <div key={day.date} className="bg-white p-3 rounded-lg border border-stone-200 text-center min-w-0 shadow-sm">
                                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                                                day.status === 'present' ? 'bg-green-500' :
                                                day.status === 'absent' ? 'bg-red-500' :
                                                'bg-blue-500'
                                            }`}></div>
                                            <div className="text-sm font-medium text-stone-900 leading-tight">
                                                {new Date(day.date).toLocaleDateString('en-IN', {
                                                    day: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-xs text-stone-500 uppercase leading-tight">
                                                {new Date(day.date).toLocaleDateString('en-IN', {
                                                    month: 'short'
                                                })}
                                            </div>
                                            <div className="text-xs text-stone-500 capitalize mt-1 font-medium">{day.status}</div>
                                            {day.status === 'present' && day.check_in_time && (
                                                <div className="text-xs text-stone-600 mt-1 font-medium">
                                                    {new Date(day.check_in_time).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-stone-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm font-medium text-stone-700">Present</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm font-medium text-stone-700">Absent</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-sm font-medium text-stone-700">Leave</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-green-900">
                        Attendance Report
                    </h1>
                    <p className="text-muted-foreground mt-2">Detailed attendance analytics and reports</p>
                </div>
                <Button
                    onClick={() => router.push('/branch/employee')}
                    size="sm"
                    className="bg-green-900 hover:bg-green-950 text-white shadow-lg"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Employees
                </Button>
            </div>

            {/* Quick Stats - Hide when report is generated */}
            {!reportGenerated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {employeeStats.map((stat, index) => (
                    <div key={stat.name} className="bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                                <stat.icon className="w-5 h-5 text-current" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                {stat.percentage}
                            </span>
                        </div>
                        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">{stat.name}</div>
                        <div className="text-2xl font-extrabold text-stone-900 mt-1">{stat.value}</div>
                    </div>
                ))}
            </div>
            )}

            {/* Report Generation Section */}
            <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-lg p-6">
                <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Start Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={reportStartDate}
                                onChange={(e) => setReportStartDate(e.target.value)}
                                className="w-40 px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-medium"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                                📅
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">End Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={reportEndDate}
                                onChange={(e) => setReportEndDate(e.target.value)}
                                className="w-40 px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-medium"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                                📅
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleSetCurrentMonth}
                        variant="outline"
                        className="border-emerald-200 hover:bg-emerald-50 text-emerald-700 px-4 py-2 h-10"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Current Month
                    </Button>
                    <Button
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport || !reportStartDate || !reportEndDate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 h-10"
                    >
                        {isGeneratingReport ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Generate Report
                            </>
                        )}
                    </Button>

                    {/* Employee Search - Show inline after report generation */}
                    {attendanceReport && (
                        <div className="flex items-center gap-4 ml-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={employeeSearchQuery}
                                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                    className="w-64 pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div className="text-sm text-stone-600">
                                Showing {filteredEmployees().length} of {attendanceReport.employees.length} employees
                            </div>
                        </div>
                    )}
                </div>

                {/* Report Results */}
                {attendanceReport && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="text-sm font-medium text-blue-800">Total Employees</div>
                                <div className="text-2xl font-bold text-blue-900">{attendanceReport.summary.total_employees}</div>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="text-sm font-medium text-green-800">Working Days</div>
                                <div className="text-2xl font-bold text-green-900">{attendanceReport.summary.total_working_days}</div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <div className="text-sm font-medium text-emerald-800">Avg Attendance</div>
                                <div className="text-2xl font-bold text-emerald-900">{attendanceReport.summary.average_attendance}%</div>
                            </div>
                        </div>

                        {/* Employee-wise Summary Report */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-stone-200">
                                <thead>
                                    <tr className="bg-stone-50">
                                        <th className="border border-stone-200 px-4 py-2 text-left font-semibold">Employee</th>
                                        <th className="border border-stone-200 px-4 py-2 text-center font-semibold">Total Days</th>
                                        <th className="border border-stone-200 px-4 py-2 text-center font-semibold">Present</th>
                                        <th className="border border-stone-200 px-4 py-2 text-center font-semibold">Absent</th>
                                        <th className="border border-stone-200 px-4 py-2 text-center font-semibold">Leave</th>
                                        <th className="border border-stone-200 px-4 py-2 text-center font-semibold">Attendance %</th>
                                        <th className="border border-stone-200 px-4 py-2 text-center font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees().map((employee: any) => (
                                        <tr key={employee.id} className="hover:bg-stone-50">
                                            <td className="border border-stone-200 px-4 py-2 font-medium">{employee.full_name}</td>
                                            <td className="border border-stone-200 px-4 py-2 text-center">{employee.attendance_summary.total_days}</td>
                                            <td className="border border-stone-200 px-4 py-2 text-center text-green-600 font-semibold">{employee.attendance_summary.present_days}</td>
                                            <td className="border border-stone-200 px-4 py-2 text-center text-red-600 font-semibold">{employee.attendance_summary.absent_days}</td>
                                            <td className="border border-stone-200 px-4 py-2 text-center text-blue-600 font-semibold">{employee.attendance_summary.leave_days}</td>
                                            <td className="border border-stone-200 px-4 py-2 text-center font-bold">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    employee.attendance_summary.attendance_percentage >= 90 ? 'bg-green-100 text-green-800' :
                                                    employee.attendance_summary.attendance_percentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {employee.attendance_summary.attendance_percentage}%
                                                </span>
                                            </td>
                                            <td className="border border-stone-200 px-4 py-2 text-center">
                                                <Button
                                                    onClick={() => handleShowEmployeeDetail(employee)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs border-emerald-200 hover:bg-emerald-50"
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 pt-4 border-t border-stone-200">
                            <Button
                                onClick={() => {
                                    // Export as CSV
                                    const csvContent = [
                                        ['Employee', 'Total Days', 'Present', 'Absent', 'Leave', 'Attendance %'],
                                        ...attendanceReport.employees.map((emp: any) => [
                                            emp.full_name,
                                            emp.attendance_summary.total_days,
                                            emp.attendance_summary.present_days,
                                            emp.attendance_summary.absent_days,
                                            emp.attendance_summary.leave_days,
                                            emp.attendance_summary.attendance_percentage + '%'
                                        ])
                                    ].map(row => row.map((cell: string | number) => cell.toString().replace(/"/g, '""')).map((cell: string) => `"${cell}"`).join(',')).join('\n')

                                    const blob = new Blob([csvContent], { type: 'text/csv' })
                                    const url = window.URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `attendance_report_${reportStartDate}_to_${reportEndDate}.csv`
                                    a.click()
                                    window.URL.revokeObjectURL(url)
                                }}
                                variant="outline"
                                className="border-emerald-200 hover:bg-emerald-50"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
