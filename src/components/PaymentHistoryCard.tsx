'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IndianRupee, TrendingUp, TrendingDown, AlertCircle, History } from 'lucide-react'

interface PaymentHistoryCardProps {
    memberName: string
    memberId: string
    totalPaid: number
    totalDue: number
    totalCredit: number
    lastPaymentDate?: string
    status: 'active' | 'due' | 'credit'
    onViewHistory: () => void
}

export function PaymentHistoryCard({
    memberName,
    memberId,
    totalPaid,
    totalDue,
    totalCredit,
    lastPaymentDate,
    status,
    onViewHistory
}: PaymentHistoryCardProps) {
    const getStatusBadge = () => {
        switch (status) {
            case 'active':
                return (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                        Active
                    </Badge>
                )
            case 'due':
                return (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Due Pending
                    </Badge>
                )
            case 'credit':
                return (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Credit Available
                    </Badge>
                )
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="glass border-green-100 card-hover overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 border-2 border-emerald-100">
                                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-600 text-white font-bold">
                                    {memberName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold text-foreground text-lg">{memberName}</h3>
                                <p className="text-xs text-muted-foreground">ID: {memberId.slice(0, 8)}</p>
                            </div>
                        </div>
                        {getStatusBadge()}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 mb-1">
                                <IndianRupee className="w-4 h-4 text-green-600" />
                                <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
                            </div>
                            <p className="text-lg font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
                        </div>

                        {totalDue > 0 && (
                            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-3 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                    <p className="text-xs font-medium text-muted-foreground">Due</p>
                                </div>
                                <p className="text-lg font-bold text-red-700">₹{totalDue.toLocaleString()}</p>
                            </div>
                        )}

                        {totalCredit > 0 && (
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    <p className="text-xs font-medium text-muted-foreground">Credit</p>
                                </div>
                                <p className="text-lg font-bold text-blue-700">₹{totalCredit.toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    {lastPaymentDate && (
                        <p className="text-xs text-muted-foreground mb-4">
                            Last Payment: {new Date(lastPaymentDate).toLocaleDateString('en-IN')}
                        </p>
                    )}

                    <Button
                        onClick={onViewHistory}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                        <History className="w-4 h-4 mr-2" />
                        View Full History
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    )
}
