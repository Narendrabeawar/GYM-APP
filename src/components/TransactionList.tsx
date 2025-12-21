'use client'

import { motion } from 'framer-motion'
import { Calendar, CreditCard, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Transaction {
    id: string
    amount: number
    payable_amount: number | null
    discount_amount: number | null
    due_amount: number | null
    extra_amount: number | null
    payment_method: string
    status: string
    transaction_id: string | null
    description: string | null
    created_at: string
}

interface TransactionListProps {
    transactions: Transaction[]
    memberName: string
}

export function TransactionList({ transactions, memberName }: TransactionListProps) {
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
            case 'refunded':
                return (
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Refunded
                    </Badge>
                )
            default:
                return <Badge>Unknown</Badge>
        }
    }

    const getPaymentMethodBadge = (method: string) => {
        const colors: Record<string, string> = {
            'upi': 'bg-purple-100 text-purple-700 border-purple-200',
            'card': 'bg-blue-100 text-blue-700 border-blue-200',
            'cash': 'bg-green-100 text-green-700 border-green-200',
            'bank_transfer': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        }
        return (
            <Badge variant="outline" className={colors[method] || ''}>
                {method.toUpperCase().replace('_', ' ')}
            </Badge>
        )
    }

    if (transactions.length === 0) {
        return (
            <Card className="glass border-green-100">
                <CardContent className="p-12 text-center">
                    <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No transactions found for {memberName}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {transactions.map((transaction, index) => (
                <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="glass border-green-100 card-hover">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(transaction.created_at).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        {getStatusBadge(transaction.status)}
                                        {getPaymentMethodBadge(transaction.payment_method)}
                                    </div>

                                    {transaction.description && (
                                        <p className="text-sm text-foreground">{transaction.description}</p>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-xs">
                                        {transaction.payable_amount && (
                                            <div>
                                                <span className="text-muted-foreground">Payable: </span>
                                                <span className="font-semibold">₹{transaction.payable_amount}</span>
                                            </div>
                                        )}
                                        {transaction.discount_amount && transaction.discount_amount > 0 && (
                                            <div>
                                                <span className="text-muted-foreground">Discount: </span>
                                                <span className="font-semibold text-green-600">-₹{transaction.discount_amount}</span>
                                            </div>
                                        )}
                                        {transaction.due_amount && transaction.due_amount > 0 && (
                                            <div>
                                                <span className="text-muted-foreground">Due: </span>
                                                <span className="font-semibold text-red-600">₹{transaction.due_amount}</span>
                                            </div>
                                        )}
                                        {transaction.extra_amount && transaction.extra_amount > 0 && (
                                            <div>
                                                <span className="text-muted-foreground">Extra: </span>
                                                <span className="font-semibold text-blue-600">₹{transaction.extra_amount}</span>
                                            </div>
                                        )}
                                    </div>

                                    {transaction.transaction_id && (
                                        <p className="text-xs text-muted-foreground font-mono">
                                            Txn ID: {transaction.transaction_id}
                                        </p>
                                    )}
                                </div>

                                <div className="text-right">
                                    <p className="text-2xl font-bold text-emerald-700">
                                        ₹{transaction.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
