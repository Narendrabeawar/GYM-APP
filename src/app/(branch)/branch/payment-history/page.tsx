'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Search, 
    Filter, 
    Download, 
    Users, 
    ArrowLeft,
    FileText,
    Calendar
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentHistoryCard } from '@/components/PaymentHistoryCard'
import { TransactionList } from '@/components/TransactionList'
import { AccountSummary } from '@/components/AccountSummary'
import { createClient } from '@/lib/supabase/client'

interface Transaction {
    id: string
    member_id: string
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
    updated_at: string
}

interface MemberPaymentData {
    memberId: string
    memberName: string
    totalPaid: number
    totalDue: number
    totalCredit: number
    lastPaymentDate: string | null
    status: 'active' | 'due' | 'credit'
    transactions: Transaction[]
}

export default function PaymentHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMember, setSelectedMember] = useState<MemberPaymentData | null>(null)
    const [membersPaymentData, setMembersPaymentData] = useState<MemberPaymentData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const fetchPaymentHistory = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            
            // Get current user's branch
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('User not found. Please sign in again.')
                setMembersPaymentData([])
                return
            }

            // Prefer auth metadata, fallback to profiles table
            let branchId = user.user_metadata?.branch_id as string | undefined
            let gymId = user.user_metadata?.gym_id as string | undefined

            if (!branchId || !gymId) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('branch_id, gym_id')
                    .eq('id', user.id)
                    .maybeSingle()

                if (profileError) {
                    console.error('Profile fetch error:', profileError)
                }

                branchId = branchId || profile?.branch_id || undefined
                gymId = gymId || profile?.gym_id || undefined
            }

            if (!branchId || !gymId) {
                setError('Branch or Gym information missing. Please update your profile or contact admin.')
                setMembersPaymentData([])
                return
            }

            // Get all members from this branch
            const { data: members, error: membersError } = await supabase
                .from('members')
                .select('id, full_name')
                .eq('branch_id', branchId)

            if (membersError) {
                console.error('Members fetch error:', membersError)
                setError('Failed to load members for this branch.')
                setMembersPaymentData([])
                return
            }

            if (!members) {
                setMembersPaymentData([])
                return
            }

            // Get payment data for each member
            const paymentDataPromises = members.map(async (member) => {
                let paymentsQuery = supabase
                    .from('payments')
                    .select('id, member_id, amount, payable_amount, discount_amount, due_amount, extra_amount, payment_method, status, transaction_id, description, created_at, updated_at')
                    .eq('member_id', member.id)
                    .order('created_at', { ascending: false })

                if (branchId) {
                    paymentsQuery = paymentsQuery.eq('branch_id', branchId)
                }
                if (gymId) {
                    paymentsQuery = paymentsQuery.eq('gym_id', gymId)
                }

                const { data: payments, error: paymentsError } = await paymentsQuery

                if (paymentsError) {
                    console.error(`Payments fetch error for member ${member.id}:`, paymentsError)
                }

                const transactions = (payments || []) as Transaction[]
                
                // Calculate totals
                const totalPaid = transactions
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
                
                const totalDue = transactions
                    .reduce((sum, p) => sum + Number(p.due_amount || 0), 0)
                
                const totalCredit = transactions
                    .reduce((sum, p) => sum + Number(p.extra_amount || 0), 0)

                const lastPaymentDate = transactions.length > 0 
                    ? transactions[0].created_at 
                    : null

                let status: 'active' | 'due' | 'credit' = 'active'
                if (totalDue > 0) status = 'due'
                else if (totalCredit > 0) status = 'credit'

                return {
                    memberId: member.id,
                    memberName: member.full_name,
                    totalPaid,
                    totalDue,
                    totalCredit,
                    lastPaymentDate,
                    status,
                    transactions
                }
            })

            const paymentData = await Promise.all(paymentDataPromises)
            setMembersPaymentData(paymentData)
        } catch (error) {
            console.error('Error fetching payment history:', error)
            setError('Unable to fetch payment history. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchPaymentHistory()
    }, [fetchPaymentHistory])

    const filteredMembers = membersPaymentData.filter(member =>
        member.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.memberId.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const overallStats = {
        totalPaid: membersPaymentData.reduce((sum, m) => sum + m.totalPaid, 0),
        totalDue: membersPaymentData.reduce((sum, m) => sum + m.totalDue, 0),
        totalCredit: membersPaymentData.reduce((sum, m) => sum + m.totalCredit, 0),
        totalTransactions: membersPaymentData.reduce((sum, m) => sum + m.transactions.length, 0)
    }

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-emerald">Payment History</h1>
                        <p className="text-muted-foreground mt-2">Loading payment data...</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="glass border-green-100">
                            <CardContent className="p-6">
                                <div className="animate-pulse space-y-4">
                                    <div className="h-12 w-12 bg-gray-200 rounded-full" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-8 bg-gray-200 rounded w-1/2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gradient-emerald">Payment History</h1>
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <p className="text-red-700 font-semibold">{error}</p>
                        <Button
                            onClick={fetchPaymentHistory}
                            className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <AnimatePresence mode="wait">
                {!selectedMember ? (
                    <motion.div
                        key="members-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-8"
                    >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gradient-emerald">
                                    Payment History
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    Track payment history for all members
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    className="border-green-200 hover:bg-green-50"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                                <Button 
                                    onClick={fetchPaymentHistory}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        {/* Overall Summary */}
                        <AccountSummary {...overallStats} />

                        {/* Search Bar */}
                        <Card className="glass border-green-100">
                            <CardContent className="p-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by member name or ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 border-green-200 focus:border-emerald-500"
                                        />
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="border-green-200 hover:bg-green-50"
                                    >
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Members Grid */}
                        {filteredMembers.length === 0 ? (
                            <Card className="glass border-green-100">
                                <CardContent className="p-12 text-center">
                                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <p className="text-muted-foreground">
                                        {searchQuery ? 'No members found matching your search' : 'No members with payment history'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredMembers.map((member, index) => (
                                    <motion.div
                                        key={member.memberId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <PaymentHistoryCard
                                            memberName={member.memberName}
                                            memberId={member.memberId}
                                            totalPaid={member.totalPaid}
                                            totalDue={member.totalDue}
                                            totalCredit={member.totalCredit}
                                            lastPaymentDate={member.lastPaymentDate || undefined}
                                            status={member.status}
                                            onViewHistory={() => setSelectedMember(member)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="transaction-details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Back Button & Header */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedMember(null)}
                                className="border-green-200 hover:bg-green-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gradient-emerald">
                                    {selectedMember.memberName}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Complete payment history and transactions
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="border-green-200 hover:bg-green-50"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>

                        {/* Member Summary */}
                        <AccountSummary
                            totalPaid={selectedMember.totalPaid}
                            totalDue={selectedMember.totalDue}
                            totalCredit={selectedMember.totalCredit}
                            totalTransactions={selectedMember.transactions.length}
                        />

                        {/* Transaction History */}
                        <Card className="glass border-green-100">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Transaction History
                                </CardTitle>
                                <CardDescription>
                                    All payment transactions for {selectedMember.memberName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TransactionList
                                    transactions={selectedMember.transactions}
                                    memberName={selectedMember.memberName}
                                />
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
