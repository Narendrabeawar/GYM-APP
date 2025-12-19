'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Calendar,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Download,
    Filter,
    TrendingUp,
    UserCheck,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const attendanceStats = [
    { name: 'Today Present', value: '87', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', percentage: '78%' },
    { name: 'Total Members', value: '112', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', percentage: '100%' },
    { name: 'Absent', value: '25', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', percentage: '22%' },
    { name: 'Average Rate', value: '82%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', percentage: '+5%' },
]

const todayAttendance = [
    { id: 1, name: 'Rahul Sharma', checkIn: '06:15 AM', checkOut: '07:45 AM', duration: '1h 30m', status: 'present' },
    { id: 2, name: 'Priya Singh', checkIn: '07:30 AM', checkOut: '09:00 AM', duration: '1h 30m', status: 'present' },
    { id: 3, name: 'Amit Kumar', checkIn: '08:00 AM', checkOut: '-', duration: 'In Progress', status: 'in-gym' },
    { id: 4, name: 'Sneha Patel', checkIn: '06:45 AM', checkOut: '08:15 AM', duration: '1h 30m', status: 'present' },
    { id: 5, name: 'Vikram Reddy', checkIn: '07:15 AM', checkOut: '08:45 AM', duration: '1h 30m', status: 'present' },
    { id: 6, name: 'Anjali Gupta', checkIn: '08:30 AM', checkOut: '-', duration: 'In Progress', status: 'in-gym' },
    { id: 7, name: 'Ravi Kumar', checkIn: '05:45 AM', checkOut: '07:15 AM', duration: '1h 30m', status: 'present' },
    { id: 8, name: 'Neha Sharma', checkIn: '06:30 AM', checkOut: '08:00 AM', duration: '1h 30m', status: 'present' },
]

export default function BranchAttendancePage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                )
            case 'in-gym':
                return (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 animate-pulse">
                        <UserCheck className="w-3 h-3 mr-1" />
                        In Gym
                    </Badge>
                )
            case 'absent':
                return (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Absent
                    </Badge>
                )
            default:
                return <Badge>Unknown</Badge>
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient-emerald">
                        Attendance Tracking
                    </h1>
                    <p className="text-muted-foreground mt-2">Monitor daily member check-ins and attendance patterns</p>
                </div>
                <div className="flex gap-2">
                    <Input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border-green-200 focus:border-emerald-500"
                    />
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald">
                        <Calendar className="w-4 h-4 mr-2" />
                        Mark Attendance
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {attendanceStats.map((stat, index) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="glass border-green-100 card-hover">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        {stat.percentage}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{stat.name}</p>
                                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Today's Attendance */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="glass border-green-100">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-xl">Today's Attendance Log</CardTitle>
                                <CardDescription>Real-time member check-in and check-out records</CardDescription>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-none sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search members..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 border-green-200 focus:border-emerald-500"
                                    />
                                </div>
                                <Button variant="outline" size="icon" className="border-green-200 hover:bg-green-50">
                                    <Filter className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="border-green-200 hover:bg-green-50">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {todayAttendance.map((record, index) => (
                                <motion.div
                                    key={record.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between p-4 bg-white border border-green-100 rounded-xl hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <Avatar className="w-12 h-12 border-2 border-emerald-100">
                                            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                                                {record.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-semibold text-foreground">{record.name}</h3>
                                                {getStatusBadge(record.status)}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-green-600" />
                                                    In: <span className="font-semibold text-foreground">{record.checkIn}</span>
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-red-600" />
                                                    Out: <span className="font-semibold text-foreground">{record.checkOut}</span>
                                                </span>
                                                <span>•</span>
                                                <span className="font-semibold text-emerald-600">{record.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Weekly Attendance Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                <Card className="glass border-green-100">
                    <CardHeader>
                        <CardTitle>Weekly Attendance Trend</CardTitle>
                        <CardDescription>Attendance pattern for the past 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center border-2 border-dashed border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 text-green-300 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">Weekly attendance chart</p>
                                <p className="text-xs text-muted-foreground mt-1">Chart integration pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-green-100">
                    <CardHeader>
                        <CardTitle>Peak Hours</CardTitle>
                        <CardDescription>Busiest gym hours today</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { time: '06:00 AM - 08:00 AM', count: 32, percentage: 85 },
                                { time: '05:00 PM - 07:00 PM', count: 28, percentage: 70 },
                                { time: '08:00 AM - 10:00 AM', count: 18, percentage: 45 },
                                { time: '07:00 PM - 09:00 PM', count: 15, percentage: 38 },
                            ].map((slot, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-foreground">{slot.time}</span>
                                        <span className="font-bold text-emerald-600">{slot.count} members</span>
                                    </div>
                                    <div className="w-full bg-green-100 rounded-full h-2.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${slot.percentage}%` }}
                                            transition={{ duration: 1, delay: index * 0.1 }}
                                            className="bg-gradient-to-r from-emerald-500 to-green-600 h-2.5 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
