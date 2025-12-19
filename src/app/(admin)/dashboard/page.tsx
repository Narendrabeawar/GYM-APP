'use client'

import { motion } from 'framer-motion'
import {
    Users,
    UserCheck,
    DollarSign,
    TrendingUp,
    Calendar,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const stats = [
    {
        name: 'Listed GYM',
        value: '1,234',
        change: '+12%',
        changeType: 'increase',
        icon: Users,
        color: 'from-emerald-800 to-teal-800',
    },
    {
        name: 'Active Today',
        value: '89',
        change: '+8%',
        changeType: 'increase',
        icon: UserCheck,
        color: 'from-cyan-500 to-blue-600',
    },
    {
        name: 'Monthly Revenue',
        value: '₹2,45,000',
        change: '+23%',
        changeType: 'increase',
        icon: DollarSign,
        color: 'from-rose-500 to-orange-600',
    },
    {
        name: 'Pending Payments',
        value: '₹45,000',
        change: '-5%',
        changeType: 'decrease',
        icon: AlertCircle,
        color: 'from-orange-600 to-red-600',
    },
]

const recentActivities = [
    {
        id: 1,
        type: 'new_gym',
        title: 'New Listed GYM Joined',
        description: 'Iron Pump Gym joined with Professional Plan',
        time: '5 minutes ago',
    },
    {
        id: 2,
        type: 'payment',
        title: 'Payment Received',
        description: 'Priya Sharma paid ₹2,499 for 3-month plan',
        time: '15 minutes ago',
    },
    {
        id: 3,
        type: 'checkin',
        title: 'Listed GYM Check-in',
        description: 'Fit Life Studio status updated to Active',
        time: '30 minutes ago',
    },
    {
        id: 4,
        type: 'expiring',
        title: 'Subscription Expiring Soon',
        description: 'Muscle House subscription expires in 3 days',
        time: '1 hour ago',
    },
]

const upcomingClasses = [
    { name: 'Yoga', time: '06:00 AM', trainer: 'Sarah Johnson', slots: '8/20' },
    { name: 'CrossFit', time: '07:00 AM', trainer: 'Mike Williams', slots: '12/15' },
    { name: 'Zumba', time: '05:30 PM', trainer: 'Lisa Anderson', slots: '15/25' },
    { name: 'Boxing', time: '06:30 PM', trainer: 'John Davis', slots: '6/10' },
]

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                    Dashboard
                </h1>
                <p className="text-stone-500 mt-2">Welcome back! Here&apos;s what&apos;s happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="border-green-200 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-stone-500 mb-1">{stat.name}</p>
                                        <h3 className="text-2xl font-bold text-stone-900 mb-2">{stat.value}</h3>
                                        <div className="flex items-center gap-1">
                                            {stat.changeType === 'increase' ? (
                                                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                                <ArrowDownRight className="w-4 h-4 text-red-600" />
                                            )}
                                            <span
                                                className={`text-sm font-medium ${stat.changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'
                                                    }`}
                                            >
                                                {stat.change}
                                            </span>
                                            <span className="text-xs text-stone-500">from last month</span>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-stone-200 bg-white/60 backdrop-blur-xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-stone-900">Recent Activities</CardTitle>
                            <CardDescription className="text-stone-500">Latest updates from your gym</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivities.map((activity, index) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + index * 0.1 }}
                                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-green-50 transition-colors"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-800 to-teal-800 mt-2" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-stone-900">{activity.title}</p>
                                            <p className="text-xs text-stone-500 mt-1">{activity.description}</p>
                                            <p className="text-xs text-stone-400 mt-1">{activity.time}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Upcoming Classes */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-stone-200 bg-white/60 backdrop-blur-xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-stone-900">Today&apos;s Classes</CardTitle>
                            <CardDescription className="text-stone-500">Scheduled group fitness sessions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {upcomingClasses.map((classItem, index) => (
                                    <motion.div
                                        key={classItem.name}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + index * 0.1 }}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-green-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-800/10 to-teal-800/10 border border-emerald-800/20">
                                                <Calendar className="w-6 h-6 text-emerald-800" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-stone-900">{classItem.name}</p>
                                                <p className="text-xs text-stone-500">{classItem.trainer}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-stone-900">{classItem.time}</p>
                                            <Badge variant="outline" className="mt-1 border-stone-200 text-stone-500">
                                                {classItem.slots}
                                            </Badge>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Revenue Chart Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card className="border-stone-200 bg-white/60 backdrop-blur-xl shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-stone-900">Revenue Overview</CardTitle>
                                <CardDescription className="text-stone-500">Monthly revenue trends</CardDescription>
                            </div>
                            <Badge className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-500/20">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                +23% increase
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg border border-stone-200">
                            <div className="text-center">
                                <TrendingUp className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                                <p className="text-stone-500">Chart will be rendered here</p>
                                <p className="text-xs text-stone-400 mt-2">Recharts integration coming soon</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
