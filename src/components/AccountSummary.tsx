'use client'

import { motion } from 'framer-motion'
import { IndianRupee, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AccountSummaryProps {
    totalPaid: number
    totalDue: number
    totalCredit: number
    totalTransactions: number
}

export function AccountSummary({ 
    totalPaid, 
    totalDue, 
    totalCredit, 
    totalTransactions 
}: AccountSummaryProps) {
    const summaryItems = [
        {
            label: 'Total Paid',
            value: totalPaid,
            icon: IndianRupee,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            borderColor: 'border-green-200'
        },
        {
            label: 'Total Due',
            value: totalDue,
            icon: TrendingDown,
            color: 'text-red-600',
            bg: 'bg-red-50',
            borderColor: 'border-red-200'
        },
        {
            label: 'Total Credit',
            value: totalCredit,
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            label: 'Transactions',
            value: totalTransactions,
            icon: CreditCard,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            borderColor: 'border-purple-200',
            isCount: true
        }
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryItems.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className={`glass ${item.borderColor} card-hover`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                {item.label}
                            </p>
                            <h3 className={`text-2xl font-bold ${item.color}`}>
                                {item.isCount ? item.value : `₹${item.value.toLocaleString()}`}
                            </h3>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
