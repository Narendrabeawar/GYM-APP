'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    CreditCard,
    TrendingUp,
    Calendar,
    IndianRupee,
    Building2,
    Activity,
    Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { BranchDashboardData } from '@/app/actions/branch'
import {
    BranchDashboardCard,
    BranchOverviewWidget,
    RecentActivityWidget
} from '@/components/dashboard/BranchDashboardCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BranchDashboardPage() {
    const [mounted, setMounted] = useState(false)
    const [dashboardData, setDashboardData] = useState<BranchDashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [branchId, setBranchId] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
        const initializeData = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user?.user_metadata?.branch_id) {
                    setBranchId(user.user_metadata.branch_id)

                    // Fetch dashboard data from server API
                     try {
                         const res = await fetch('/api/branch/dashboard', {
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
                                 setError('Branch information not found in your account.')
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
                    setError('No branch ID found')
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

    // Dynamic stats based on real data
    const stats = [
        {
            title: 'Total Members',
            value: dashboardData?.members?.total_members || 0,
            change: dashboardData ? `+${dashboardData.recent_activity.new_members_this_week} this week` : '+0 this week',
            changeType: 'increase' as const,
            icon: Users,
            color: 'from-emerald-800 to-teal-800',
        },
        {
            title: 'Active Members',
            value: dashboardData?.members?.active_members || 0,
            subtitle: `${dashboardData ? Math.round((dashboardData.members.active_members / Math.max(dashboardData.members.total_members, 1)) * 100) : 0}% of total`,
            changeType: 'increase' as const,
            icon: Calendar,
            color: 'from-cyan-500 to-blue-600',
        },
        {
            title: 'Monthly Revenue',
            value: `₹${(dashboardData?.financials?.monthly_revenue || 0).toLocaleString('en-IN')}`,
            change: dashboardData?.financials?.net_profit ? `₹${dashboardData.financials.net_profit.toLocaleString('en-IN')} profit` : '₹0 profit',
            changeType: (dashboardData?.financials?.net_profit ?? 0) >= 0 ? 'increase' as const : 'decrease' as const,
            icon: IndianRupee,
            color: 'from-orange-600 to-red-600',
        },
        {
            title: 'Yearly Revenue',
            value: `₹${(dashboardData?.financials?.year_revenue || 0).toLocaleString('en-IN')}`,
            change: dashboardData?.financials?.net_profit ? `₹${dashboardData.financials.net_profit.toLocaleString('en-IN')} profit` : '₹0 profit',
            changeType: (dashboardData?.financials?.net_profit ?? 0) >= 0 ? 'increase' as const : 'decrease' as const,
            icon: CreditCard,
            color: 'from-rose-500 to-orange-600',
        },
    ]

    const branchName = dashboardData?.branch?.name || 'Your Branch'

    if (error) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                        Branch Dashboard
                    </h1>
                    <p className="text-stone-500 mt-2">Error loading dashboard data</p>
                </div>
                <Card className="border-red-200 bg-red-50/60 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-700 font-medium">Failed to load dashboard</p>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                    {branchName} Dashboard
                </h1>
                <p className="text-stone-500 mt-2">Welcome back! Here's what's happening at your branch today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <BranchDashboardCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        changeType={stat.changeType}
                        icon={stat.icon}
                        color={stat.color}
                        subtitle={stat.subtitle}
                        delay={index}
                    />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Branch Overview */}
                <div className="lg:col-span-2">
                    <BranchOverviewWidget
                        branchData={dashboardData}
                        delay={4}
                    />
                </div>

                {/* Recent Activity */}
                <div>
                    <RecentActivityWidget
                        activity={dashboardData?.recent_activity}
                        delay={5}
                    />
                </div>
            </div>

            {/* Financial Overview & Growth Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Financial Summary */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-stone-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Financial Overview
                            </CardTitle>
                            <CardDescription className="text-stone-500">
                                Income, expenses and profitability summary
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {dashboardData ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <IndianRupee className="w-4 h-4 text-emerald-600" />
                                                <span className="text-sm font-medium text-emerald-800">Total Income</span>
                                            </div>
                                            <p className="text-2xl font-bold text-emerald-700">
                                                ₹{dashboardData.financials.total_income.toLocaleString('en-IN')}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-4 h-4 text-red-600" />
                                                <span className="text-sm font-medium text-red-800">Total Expenses</span>
                                            </div>
                                            <p className="text-2xl font-bold text-red-700">
                                                ₹{dashboardData.financials.total_expenses.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className={`w-4 h-4 ${(dashboardData.financials.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                                            <span className={`text-sm font-medium ${(dashboardData.financials.net_profit || 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                                Net Profit
                                            </span>
                                        </div>
                                        <p className={`text-2xl font-bold ${(dashboardData.financials.net_profit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            ₹{dashboardData.financials.net_profit.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="h-40 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Growth Chart Placeholder */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-stone-900 flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Growth Trends
                            </CardTitle>
                            <CardDescription className="text-stone-500">
                                Member growth and activity patterns
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-60 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 border-dashed">
                                <div className="text-center">
                                    <TrendingUp className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500 text-sm italic">
                                        {dashboardData && dashboardData.members.total_members > 0
                                            ? 'Growth charts and analytics will appear here with more data.'
                                            : 'Add members and activity data to see growth trends.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
