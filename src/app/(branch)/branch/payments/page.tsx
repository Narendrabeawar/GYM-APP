'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    IndianRupee,
    TrendingUp,
    Calendar,
    AlertCircle,
    Search,
    Filter,
    Download,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const paymentStats = [
    { name: 'Total Revenue', value: '₹4,52,000', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '+12.5%' },
    { name: 'This Month', value: '₹87,500', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', change: '+8.2%' },
    { name: 'Pending', value: '₹15,000', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', change: '5 payments' },
    { name: 'Overdue', value: '₹8,500', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', change: '3 payments' },
]

const recentPayments = [
    { 
        id: 1, 
        memberName: 'Rahul Sharma', 
        amount: 5000, 
        date: '2024-12-15', 
        plan: 'Premium Annual', 
        method: 'UPI', 
        status: 'completed',
        transactionId: 'TXN123456789'
    },
    { 
        id: 2, 
        memberName: 'Priya Singh', 
        amount: 3500, 
        date: '2024-12-14', 
        plan: 'Gold 6 Months', 
        method: 'Card', 
        status: 'completed',
        transactionId: 'TXN123456788'
    },
    { 
        id: 3, 
        memberName: 'Amit Kumar', 
        amount: 2500, 
        date: '2024-12-13', 
        plan: 'Basic 3 Months', 
        method: 'Cash', 
        status: 'completed',
        transactionId: 'TXN123456787'
    },
    { 
        id: 4, 
        memberName: 'Sneha Patel', 
        amount: 4000, 
        date: '2024-12-12', 
        plan: 'Premium 6 Months', 
        method: 'UPI', 
        status: 'pending',
        transactionId: 'TXN123456786'
    },
    { 
        id: 5, 
        memberName: 'Vikram Reddy', 
        amount: 3000, 
        date: '2024-12-10', 
        plan: 'Gold 3 Months', 
        method: 'Card', 
        status: 'failed',
        transactionId: 'TXN123456785'
    },
]

export default function BranchPaymentsPage() {
    const [searchQuery, setSearchQuery] = useState('')

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                )
            case 'failed':
                return (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                    </Badge>
                )
            default:
                return <Badge>Unknown</Badge>
        }
    }

    const getPaymentMethodBadge = (method: string) => {
        const colors: Record<string, string> = {
            'UPI': 'bg-purple-100 text-purple-700 border-purple-200',
            'Card': 'bg-blue-100 text-blue-700 border-blue-200',
            'Cash': 'bg-green-100 text-green-700 border-green-200',
        }
        return (
            <Badge variant="outline" className={colors[method] || ''}>
                {method}
            </Badge>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient-emerald">
                        Payment Management
                    </h1>
                    <p className="text-muted-foreground mt-2">Track and manage all financial transactions</p>
                </div>
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Record Payment
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {paymentStats.map((stat, index) => (
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
                                        {stat.change}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{stat.name}</p>
                                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recent Payments */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="glass border-green-100">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-xl">Recent Transactions</CardTitle>
                                <CardDescription>Latest payment activities</CardDescription>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-none sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search transactions..."
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
                        <div className="space-y-4">
                            {recentPayments.map((payment, index) => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between p-4 bg-white border border-green-100 rounded-xl hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <Avatar className="w-12 h-12 border-2 border-emerald-100">
                                            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                                                {payment.memberName.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-semibold text-foreground">{payment.memberName}</h3>
                                                {getStatusBadge(payment.status)}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {payment.date}
                                                </span>
                                                <span>•</span>
                                                <span>{payment.plan}</span>
                                                <span>•</span>
                                                {getPaymentMethodBadge(payment.method)}
                                                <span>•</span>
                                                <span className="text-xs text-muted-foreground">{payment.transactionId}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-emerald-700">₹{payment.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Monthly Revenue Chart Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card className="glass border-green-100">
                    <CardHeader>
                        <CardTitle>Monthly Revenue Trend</CardTitle>
                        <CardDescription>Revenue overview for the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center border-2 border-dashed border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 text-green-300 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">Revenue chart will be displayed here</p>
                                <p className="text-xs text-muted-foreground mt-1">Integration with charting library pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
