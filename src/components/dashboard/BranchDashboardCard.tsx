'use client'

import { motion } from 'framer-motion'
import {
    Building2,
    Users,
    CreditCard,
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Calendar,
    UserCheck,
    UserX,
    Clock,
    Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BranchDashboardCardProps {
    title: string
    value: string | number
    change?: string
    changeType?: 'increase' | 'decrease' | 'neutral'
    icon: any
    color: string
    subtitle?: string
    delay?: number
}

export function BranchDashboardCard({
    title,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
    color,
    subtitle,
    delay = 0
}: BranchDashboardCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1 }}
        >
            <Card className="border-green-200 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-stone-500 mb-1">{title}</p>
                            <h3 className="text-2xl font-bold text-stone-900 mb-2">
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </h3>
                            {subtitle && (
                                <p className="text-xs text-stone-400 mb-2">{subtitle}</p>
                            )}
                            {change && (
                                <div className="flex items-center gap-1">
                                    <span
                                        className={`text-sm font-medium ${
                                            changeType === 'increase' ? 'text-emerald-600' :
                                            changeType === 'decrease' ? 'text-red-600' : 'text-stone-500'
                                        }`}
                                    >
                                        {change}
                                    </span>
                                    {/* removed 'vs last month' per UI request */}
                                </div>
                            )}
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

interface BranchOverviewWidgetProps {
    branchData: any
    delay?: number
}

export function BranchOverviewWidget({ branchData, delay = 0 }: BranchOverviewWidgetProps) {
    const capacityUsage = branchData?.branch?.member_capacity
        ? (branchData.members.total_members / branchData.branch.member_capacity) * 100
        : 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1 }}
            className="h-full"
        >
            <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm h-full">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-800 to-teal-800 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-stone-900">{branchData?.branch?.name}</CardTitle>
                                {branchData?.branch?.address && (
                                    <p className="text-sm text-stone-500 truncate max-w-[200px]">{branchData.branch.address}</p>
                                )}
                            </div>
                        </div>
                        <Badge
                            variant={branchData?.branch?.status === 'active' ? 'default' : 'secondary'}
                            className={branchData?.branch?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}
                        >
                            {branchData?.branch?.status}
                        </Badge>
                    </div>

                    {branchData?.branch?.manager_name && (
                        <p className="text-sm text-stone-600 mt-2">
                            Manager: <span className="font-medium">{branchData.branch.manager_name}</span>
                        </p>
                    )}
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Capacity Usage */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-stone-600">Capacity Usage</span>
                            <span className="text-sm font-medium text-stone-900">
                                {branchData?.members?.total_members || 0} / {branchData?.branch?.member_capacity || '∞'}
                            </span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(capacityUsage, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                            {capacityUsage.toFixed(1)}% utilized
                        </p>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <Users className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                            <p className="text-xs text-emerald-700 font-medium">Active Members</p>
                            <p className="text-lg font-bold text-emerald-800">
                                {branchData?.members?.active_members || 0}
                            </p>
                        </div>

                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <IndianRupee className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                            <p className="text-xs text-blue-700 font-medium">Monthly Revenue</p>
                            <p className="text-lg font-bold text-blue-800">
                                ₹{(branchData?.financials?.monthly_revenue || 0).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-2 border-t border-stone-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-600">Net Profit</span>
                            <span className={`font-bold ${
                                (branchData?.financials?.net_profit || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                            }`}>
                                ₹{(branchData?.financials?.net_profit || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

interface RecentActivityWidgetProps {
    activity: any
    delay?: number
}

export function RecentActivityWidget({ activity, delay = 0 }: RecentActivityWidgetProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1 }}
        >
            <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-stone-900 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                            <UserCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-emerald-800">{activity?.new_members_today || 0}</p>
                            <p className="text-sm text-emerald-600">New members today</p>
                        </div>

                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <IndianRupee className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-800">₹{(activity?.todays_income || 0).toLocaleString('en-IN')}</p>
                            <p className="text-sm text-blue-600">Today's Income</p>
                        </div>

                        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-purple-800">{activity?.new_members_this_week || 0}</p>
                            <p className="text-sm text-purple-600">New members this week</p>
                        </div>

                        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                            <CreditCard className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-orange-800">₹{(activity?.todays_expenses || 0).toLocaleString('en-IN')}</p>
                            <p className="text-sm text-orange-600">Today's Expenses</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
