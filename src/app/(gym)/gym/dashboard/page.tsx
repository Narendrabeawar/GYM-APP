'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    TrendingUp,
    Calendar,
    Building2,
    IndianRupee,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { BranchDashboardData } from '@/app/actions/gym'
import FinancialMetricCard from '@/components/dashboard/FinancialMetricCard'
import BranchStatsGrid from '@/components/dashboard/BranchStatsGrid'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RevenueChart from '@/components/dashboard/RevenueChart'

export default function GymDashboardPage() {
    const [mounted, setMounted] = useState(false)
    const [gymName, setGymName] = useState('Your Gym')
    const [dashboardData, setDashboardData] = useState<{
        branches: BranchDashboardData[]
        summary: {
            total_branches: number
            total_income: number
            total_expenses: number
            total_profit: number
            total_members: number
            active_members: number
        }
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
        const initializeData = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user?.user_metadata?.gym_id) {
                    setGymName(user.user_metadata.gym_name || 'Your Gym')

                    // Fetch dashboard data from server API
                     try {
                         const res = await fetch('/api/gym/dashboard', {
                             method: 'GET',
                             headers: {
                                 'Content-Type': 'application/json',
                             },
                             credentials: 'include'
                         })
                         
                         if (!res.ok) {
                             const errData = await res.json().catch(() => null)
                             console.error('API error:', { status: res.status, data: errData })
                             
                             if (res.status === 401) {
                                 setError('Your session expired. Please login again.')
                             } else if (res.status === 400) {
                                 setError('Gym information not found in your account.')
                             } else {
                                 setError(errData?.error || 'Failed to load dashboard data')
                             }
                         } else {
                             const data = await res.json()
                             setDashboardData(data)
                         }
                     } catch (fetchErr) {
                         console.error('Fetch error:', fetchErr)
                         setError('Failed to connect to server')
                     }
                } else {
                    setError('No gym ID found')
                }
            } catch (err) {
                console.error('Error initializing dashboard:', err)
                setError('Failed to load dashboard')
            } finally {
                setIsLoading(false)
            }
        }

        initializeData()
    }, [])

    if (!mounted) return null

    // Calculate dynamic stats based on real data
    const stats = [
        {
            name: 'Total Members',
            value: dashboardData ? dashboardData.summary.total_members.toString() : '0',
            change: dashboardData ? `+${dashboardData.summary.active_members}` : '+0',
            changeType: 'increase' as const,
            icon: Users,
            color: 'from-emerald-800 to-teal-800',
        },
        {
            name: 'Total Branches',
            value: dashboardData ? dashboardData.summary.total_branches.toString() : '0',
            change: 'Active',
            changeType: 'increase' as const,
            icon: Building2,
            color: 'from-cyan-500 to-blue-600',
        },
        {
            name: 'Active Members',
            value: dashboardData ? dashboardData.summary.active_members.toString() : '0',
            change: 'Enrolled',
            changeType: 'increase' as const,
            icon: Calendar,
            color: 'from-rose-500 to-orange-600',
        },
        {
            name: 'Net Profit',
            value: dashboardData ? `₹${dashboardData.summary.total_profit.toLocaleString('en-IN')}` : '₹0',
            change: dashboardData && dashboardData.summary.total_profit >= 0 ? '+Profit' : '-Loss',
            changeType: (dashboardData?.summary.total_profit ?? 0) >= 0 ? 'increase' as const : 'decrease' as const,
            icon: TrendingUp,
            color: 'from-green-600 to-emerald-600',
        },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                    {gymName} Dashboard
                </h1>
                <p className="text-stone-500 mt-2">Welcome back! Here&apos;s what&apos;s happening across all your branches.</p>
            </div>

            {/* Overall Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <FinancialMetricCard
                        key={stat.name}
                        title={stat.name}
                        value={stat.value}
                        change={stat.change}
                        changeType={stat.changeType}
                        icon={stat.icon}
                        color={stat.color}
                        delay={index}
                    />
                ))}
            </div>

            {/* Branch Performance Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-stone-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Branch Performance Overview
                        </CardTitle>
                        <CardDescription className="text-stone-500">
                            Financial performance and member statistics for each of your branches
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BranchStatsGrid
                            branches={dashboardData?.branches || []}
                            isLoading={isLoading}
                            error={error}
                        />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Additional Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Expenses Chart Placeholder */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-stone-900">Revenue vs Expenses</CardTitle>
                            <CardDescription className="text-stone-500">Monthly comparison across all branches</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-60 rounded-lg border border-green-200">
                                <RevenueChart />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Top Performing Branches */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-stone-900">Branch Insights</CardTitle>
                            <CardDescription className="text-stone-500">Quick stats and recommendations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {dashboardData && dashboardData.branches.length > 0 ? (
                                    <>
                                        {/* Top performing branch */}
                                        {(() => {
                                            const topBranch = dashboardData.branches.reduce((prev, current) =>
                                                prev.net_profit > current.net_profit ? prev : current
                                            )
                                            return (
                                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-emerald-800">Top Performer</p>
                                                            <p className="text-sm text-emerald-600">
                                                                {topBranch.name} - ₹{topBranch.net_profit.toLocaleString('en-IN')} profit
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {/* Branch with most members */}
                                        {(() => {
                                            const memberBranch = dashboardData.branches.reduce((prev, current) =>
                                                prev.member_count > current.member_count ? prev : current
                                            )
                                            return (
                                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <Users className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-blue-800">Largest Branch</p>
                                                            <p className="text-sm text-blue-600">
                                                                {memberBranch.name} - {memberBranch.member_count} members
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </>
                                ) : (
                                    <div className="h-40 flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg border border-stone-200 border-dashed">
                                        <div className="text-center">
                                            <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                            <p className="text-stone-500 text-sm italic">Branch insights will appear here.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
