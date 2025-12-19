'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Calendar,
    IndianRupee,
    UserPlus,
    Activity,
    CreditCard,
    ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const quickStats = [
    { name: 'Today Attendance', value: '0', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'New Registrations', value: '0', icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Pending Payments', value: '₹ 0', icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Active Members', value: '0', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
]

export default function ReceptionDashboardPage() {
    const [mounted, setMounted] = useState(false)
    const [branchName, setBranchName] = useState('Your Branch')

    useEffect(() => {
        setMounted(true)
        const getBranchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setBranchName(user.user_metadata.branch_name || 'Your Branch')
            }
        }
        getBranchData()
    }, [])

    if (!mounted) return null

    return (
        <div className="space-y-8">
            {/* Reception Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent underline decoration-emerald-200 decoration-4 underline-offset-8">
                    Reception Terminal - {branchName}
                </h1>
                <p className="text-stone-500 mt-4 font-medium">Ready for member check-ins and new registrations.</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickStats.map((stat, index) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="border-green-200 bg-white shadow-sm hover:shadow-md transition-all group cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{stat.name}</p>
                                        <h3 className="text-2xl font-black text-stone-900">{stat.value}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Reception Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Check-ins Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-green-200 bg-white/60 backdrop-blur-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-stone-900 border-l-4 border-emerald-600 pl-3">Live Member Attendance</CardTitle>
                                <p className="text-stone-500 text-sm mt-1 ml-4">Real-time check-ins for this session</p>
                            </div>
                            <Button size="sm" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/10">
                                Mark Attendance
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-2xl bg-green-50/30">
                                <Activity className="w-12 h-12 text-stone-300 mb-2 animate-pulse" />
                                <p className="text-stone-400 font-medium">No check-ins yet for this shift.</p>
                                <p className="text-stone-300 text-xs mt-1">Check-ins will appear here live.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Quick Links */}
                <div className="space-y-6">
                    <Card className="border-green-200 bg-gradient-to-br from-green-900 to-emerald-800 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <CardHeader>
                            <CardTitle className="text-xl">Quick Terminal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative">
                            <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-between px-4 group">
                                <span>Register New Member</span>
                                <UserPlus className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-xl flex items-center justify-between px-4 group">
                                <span>Collect Payment</span>
                                <IndianRupee className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                            </Button>
                            <Button variant="ghost" className="w-full text-stone-400 hover:text-white hover:bg-white/5 font-bold">
                                View Daily Registry
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg text-stone-900">Today's Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                    <div className="w-2 h-2 bg-red-600 rounded-full mt-1.5 shrink-0"></div>
                                    <p className="text-xs text-red-800 font-medium leading-relaxed">3 Memberships expiring in the next 48 hours.</p>
                                </div>
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                    <div className="w-2 h-2 bg-amber-600 rounded-full mt-1.5 shrink-0"></div>
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">2 Payment installments overdue today.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
