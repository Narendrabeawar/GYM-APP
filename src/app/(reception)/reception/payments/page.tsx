'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    CreditCard,
    Search,
    Loader2,
    IndianRupee,
    Calendar,
    ArrowRight,
    MoreHorizontal,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Payment = {
    id: string
    member_id: string
    amount: number
    payment_method: string
    payment_type: string
    status: string
    description: string
    created_at: string
    member?: {
        full_name: string
        phone: string
        email: string
    }
}

export default function ReceptionPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const supabase = createClient()

    const fetchPayments = useCallback(async () => {
        setIsLoading(true)
        try {
            // Get user profile to get gym_id
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError) throw userError

            let gymId = user?.user_metadata?.gym_id
            if (!gymId) {
                if (user?.id) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('gym_id')
                        .eq('id', user.id)
                        .single()
                    gymId = profile?.gym_id
                }
            }

            if (!gymId) {
                toast.error('No gym associated with your account')
                return
            }

            // Fetch payments with member details
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    id,
                    member_id,
                    amount,
                    payment_method,
                    payment_type,
                    status,
                    description,
                    created_at,
                    member:members!member_id (
                        full_name,
                        phone,
                        email
                    )
                `)
                .eq('gym_id', gymId)
                .order('created_at', { ascending: false })

            if (error) throw error

            // supabase returns related rows as arrays; normalize member to single object
            const normalized = (data || []).map((row: any) => ({
                ...row,
                member: Array.isArray(row.member) ? row.member[0] ?? null : row.member ?? null,
            }))
            setPayments(normalized)
        } catch (error) {
            console.error('Error fetching payments:', error)
            toast.error('Failed to fetch payments')
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchPayments()
        setMounted(true)
    }, [fetchPayments])

    const filteredPayments = useMemo(() => {
        return payments.filter(payment =>
            payment.member?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.member?.phone?.includes(searchQuery) ||
            payment.member?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.payment_method?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [payments, searchQuery])

    const getPaymentMethodIcon = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'cash': return '💵'
            case 'card': return '💳'
            case 'upi': return '📱'
            case 'bank_transfer': return '🏦'
            default: return '💰'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
            case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
            case 'refunded': return <RefreshCw className="w-4 h-4 text-blue-600" />
            default: return <Clock className="w-4 h-4 text-gray-600" />
        }
    }

    const columns = useMemo<ColumnDef<Payment>[]>(() => [
        {
            header: 'Sr.No.',
            size: 80,
            cell: ({ row }) => <span className="font-medium text-stone-500">{row.index + 1}</span>,
        },
        {
            accessorKey: 'member',
            header: 'Member',
            size: 250,
            cell: ({ row }) => {
                const member = row.original.member
                if (!member) return <span className="text-stone-500">-</span>

                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-emerald-800 font-black text-sm shadow-sm">
                            {(member.full_name || 'M').substring(0, 1).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-stone-900 leading-none">{member.full_name}</span>
                            <span className="text-[10px] text-stone-500 uppercase mt-1 font-bold tracking-tighter">
                                {member.phone}
                            </span>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            size: 120,
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-stone-900 font-bold">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span>{row.getValue('amount')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'payment_method',
            header: 'Method',
            size: 120,
            cell: ({ row }) => {
                const method = row.getValue('payment_method') as string
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{getPaymentMethodIcon(method)}</span>
                        <span className="font-medium text-stone-700 capitalize">{method}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: 'payment_type',
            header: 'Type',
            size: 120,
            cell: ({ row }) => {
                const type = row.getValue('payment_type') as string
                return (
                    <Badge
                        variant="outline"
                        className="capitalize font-bold rounded-lg border-2 border-purple-200 bg-purple-50 text-purple-800"
                    >
                        {type.replace('_', ' ')}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            size: 120,
            cell: ({ row }) => {
                const status = row.getValue('status') as string
                return (
                    <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <Badge
                            variant="outline"
                            className={`capitalize font-bold rounded-lg border-2 ${
                                status === 'completed'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : status === 'pending'
                                    ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                                    : status === 'failed'
                                    ? 'border-red-200 bg-red-50 text-red-800'
                                    : 'border-blue-200 bg-blue-50 text-blue-800'
                            }`}
                        >
                            {status}
                        </Badge>
                    </div>
                )
            },
        },
        {
            accessorKey: 'description',
            header: 'Description',
            size: 200,
            cell: ({ row }) => (
                <span className="text-stone-700 font-medium">{row.getValue('description') || '-'}</span>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Date',
            size: 140,
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-stone-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{new Date(row.getValue('created_at')).toLocaleDateString()}</span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: () => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4 text-stone-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-40 p-1">
                        <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold uppercase">Manage</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700">
                            View Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700 font-medium">
                            Print Receipt
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ], [])

    const totalAmount = useMemo(() => {
        return filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    }, [filteredPayments])

    if (!mounted) return null

    return (
        <div className="space-y-6 -mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent underline decoration-emerald-200 decoration-4 underline-offset-8">
                        Payment Records
                    </h1>
                    <p className="text-stone-500 mt-4 font-medium flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        Track all payments and transactions in your gym.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-xl border border-emerald-200">
                        <div className="text-sm text-stone-600 font-medium">Total Amount</div>
                        <div className="text-lg font-bold text-emerald-800 flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            {totalAmount.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div className="flex-1 flex items-center justify-center">
                    <h3 className="text-lg font-bold text-center text-stone-900">Payment History</h3>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                        placeholder="Search payments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 rounded-xl border-green-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 bg-white"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-800 animate-spin" />
                    <p className="text-stone-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Payments...</p>
                </div>
            ) : (
                <DataTable columns={columns} data={filteredPayments} />
            )}
        </div>
    )
}
