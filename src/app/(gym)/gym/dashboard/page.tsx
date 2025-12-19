'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    CreditCard,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

const stats = [
    {
        name: 'Total Members',
        value: '0',
        change: '+0%',
        changeType: 'increase',
        icon: Users,
        color: 'from-emerald-800 to-teal-800',
    },
    {
        name: 'Active Plans',
        value: '0',
        change: '0',
        changeType: 'increase',
        icon: CreditCard,
        color: 'from-cyan-500 to-blue-600',
    },
    {
        name: 'Daily Attendance',
        value: '0',
        change: '0',
        changeType: 'increase',
        icon: Calendar,
        color: 'from-rose-500 to-orange-600',
    },
    {
        name: 'Monthly Revenue',
        value: '₹ 0',
        change: '+0%',
        changeType: 'increase',
        icon: TrendingUp,
        color: 'from-orange-600 to-red-600',
    },
]

export default function GymDashboardPage() {
    const [mounted, setMounted] = useState(false)
    const [gymName, setGymName] = useState('Your Gym')

    useEffect(() => {
        setMounted(true)
        const getGymData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setGymName(user.user_metadata.gym_name || 'Your Gym')
            }
        }
        getGymData()
    }, [])

    if (!mounted) return null

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                    {gymName} Dashboard
                </h1>
                <p className="text-stone-500 mt-2">Welcome back! Here&apos;s what&apos;s happening at your gym today.</p>
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
                {/* Growth Overview Placeholder */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-stone-900">Growth Overview</CardTitle>
                            <CardDescription className="text-stone-500">Your gym&apos;s growth statistics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-60 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 border-dashed">
                                <div className="text-center">
                                    <TrendingUp className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500 text-sm italic">Activity chart will appear here as you add members.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Members Placeholder */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-stone-900">Recent Members</CardTitle>
                            <CardDescription className="text-stone-500">Latest registrations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-60 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 border-dashed">
                                <div className="text-center">
                                    <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500 text-sm italic">Latest registrations will show here.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
