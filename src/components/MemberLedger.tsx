'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    User,
    ArrowDownLeft,
    ArrowUpRight,
    Download,
    Plus,
    Calendar
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import CollectDuesDialog from './CollectDuesDialog'
import { useRouter } from 'next/navigation'

interface MemberLedgerProps {
    memberId: string
    memberName: string
    branchId: string | null
    gymId: string | null
    onTransactionSuccess?: () => void
    onClose?: () => void
}

export default function MemberLedger({
    memberId,
    memberName,
    branchId,
    gymId,
    onTransactionSuccess,
    onClose
}: MemberLedgerProps) {
    const supabase = createClient()
    const router = useRouter()
    const [isLoadingLedger, setIsLoadingLedger] = useState(false)
    const [ledgerEntries, setLedgerEntries] = useState<{ debit: any[], credit: any[] }>({ debit: [], credit: [] })
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

    const fetchLedger = async () => {
        if (!memberId) return
        setIsLoadingLedger(true)

        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .eq('member_id', memberId)
            .order('created_at', { ascending: true })

        if (!error && payments) {
            const debit: any[] = []
            const credit: any[] = []

            payments.forEach((p: any) => {
                if (p.payable_amount > 0) {
                    debit.push({
                        date: p.created_at,
                        particular: p.description || 'Membership Plan Charge',
                        amount: p.payable_amount
                    })
                }
                if (p.amount > 0) {
                    credit.push({
                        date: p.created_at,
                        particular: `Payment Received (${p.payment_method || 'Cash'})`,
                        amount: p.amount
                    })
                }
                if (p.extra_discount > 0) {
                    credit.push({
                        date: p.created_at,
                        particular: 'Additional Discount Applied',
                        amount: p.extra_discount
                    })
                }
            })
            setLedgerEntries({ debit, credit })
        }
        setIsLoadingLedger(false)
    }

    useEffect(() => {
        fetchLedger()
    }, [memberId])

    const currentMemberBalance = useMemo(() => {
        const dr = ledgerEntries.debit.reduce((sum, e) => sum + e.amount, 0)
        const cr = ledgerEntries.credit.reduce((sum, e) => sum + e.amount, 0)
        return dr - cr
    }, [ledgerEntries])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    return (
        <div className="mt-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-2 border-b border-green-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 uppercase">
                            {memberName}
                        </h2>
                        <p className="text-xs text-stone-500 font-medium">Member ID: {memberId.substring(0, 8)}</p>
                    </div>
                </div>
                <div className="mt-2 sm:mt-0 text-right">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Statement Date</p>
                    <p className="text-sm font-bold text-stone-700">{formatDate(new Date().toISOString())}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* DEBIT SIDE */}
                <div className="bg-white rounded-xl border border-green-200 overflow-hidden shadow-sm">
                    <div className="bg-red-50 p-3 text-center font-bold text-red-800 border-b border-green-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                        <ArrowDownLeft className="w-4 h-4" />
                        Debit Side (Charges)
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-emerald-800/5">
                                <TableRow className="hover:bg-transparent border-b border-green-200">
                                    <TableHead className="w-10 font-bold text-stone-900 text-xs text-center border-r border-green-200">S.N</TableHead>
                                    <TableHead className="w-24 font-bold text-stone-900 text-xs border-r border-green-200">Date</TableHead>
                                    <TableHead className="font-bold text-stone-900 text-xs border-r border-green-200">Particulars</TableHead>
                                    <TableHead className="w-24 font-bold text-stone-900 text-xs text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ledgerEntries.debit.map((entry, idx) => (
                                    <TableRow key={idx} className="hover:bg-slate-50 transition-colors border-b border-green-100 last:border-0 h-10">
                                        <TableCell className="text-stone-400 font-medium text-center border-r border-green-100">{idx + 1}</TableCell>
                                        <TableCell className="text-stone-600 font-medium whitespace-nowrap border-r border-green-100">{formatDate(entry.date)}</TableCell>
                                        <TableCell className="text-stone-900 font-semibold border-r border-green-100">{entry.particular}</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">₹{entry.amount.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))}
                                {ledgerEntries.debit.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-stone-400 text-sm">No debit records found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* CREDIT SIDE */}
                <div className="bg-white rounded-xl border border-green-200 overflow-hidden shadow-sm">
                    <div className="bg-emerald-50 p-3 text-center font-bold text-emerald-800 border-b border-green-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Credit Side (Payments)
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-emerald-800/5">
                                <TableRow className="hover:bg-transparent border-b border-green-200">
                                    <TableHead className="w-10 font-bold text-stone-900 text-xs text-center border-r border-green-200">S.N</TableHead>
                                    <TableHead className="w-24 font-bold text-stone-900 text-xs border-r border-green-200">Date</TableHead>
                                    <TableHead className="font-bold text-stone-900 text-xs border-r border-green-200">Particulars</TableHead>
                                    <TableHead className="w-24 font-bold text-stone-900 text-xs text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ledgerEntries.credit.map((entry, idx) => (
                                    <TableRow key={idx} className="hover:bg-slate-50 transition-colors border-b border-green-100 last:border-0 h-10">
                                        <TableCell className="text-stone-400 font-medium text-center border-r border-green-100">{idx + 1}</TableCell>
                                        <TableCell className="text-stone-600 font-medium whitespace-nowrap border-r border-green-100">{formatDate(entry.date)}</TableCell>
                                        <TableCell className="text-stone-900 font-semibold border-r border-green-100">{entry.particular}</TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600">₹{entry.amount.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))}
                                {ledgerEntries.credit.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-stone-400 text-sm">No credit records found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Summary & Actions */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={() => setIsPaymentDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 h-11 rounded-xl shadow-lg shadow-emerald-200 uppercase tracking-wider text-xs"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Collect Dues
                    </Button>

                    <CollectDuesDialog
                        open={isPaymentDialogOpen}
                        onOpenChange={setIsPaymentDialogOpen}
                        memberId={memberId}
                        memberName={memberName}
                        totalDues={Math.max(0, currentMemberBalance)}
                        branchId={branchId}
                        gymId={gymId}
                        onSuccess={() => {
                            fetchLedger()
                            if (onTransactionSuccess) onTransactionSuccess()
                        }}
                    />

                    <Button variant="outline" className="h-11 border-2 border-stone-100 font-bold uppercase tracking-wider text-xs px-6 hover:bg-stone-50 transition-all rounded-xl">
                        <Download className="w-4 h-4 mr-2 text-stone-400" />
                        Download
                    </Button>
                    <Button variant="outline" className="h-11 border-2 border-stone-100 font-bold uppercase tracking-wider text-xs px-6 hover:bg-stone-50 transition-all rounded-xl">
                        <Plus className="w-4 h-4 mr-2 text-stone-400" />
                        Print
                    </Button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-emerald-100 w-full sm:w-96 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-stone-500">
                        <span>Total Charges (DR)</span>
                        <span className="text-red-600 font-black">₹{ledgerEntries.debit.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-stone-500">
                        <span>Total Paid (CR)</span>
                        <span className="text-emerald-600 font-black">₹{ledgerEntries.credit.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-3 border-t-2 border-stone-100 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="font-black text-stone-900 uppercase text-sm">Net Balance</span>
                            {currentMemberBalance !== 0 && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${currentMemberBalance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                    ({currentMemberBalance > 0 ? 'Receivable' : 'Payable'})
                                </span>
                            )}
                        </div>
                        <span className={`text-2xl font-black ${currentMemberBalance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                            ₹{Math.abs(currentMemberBalance).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
