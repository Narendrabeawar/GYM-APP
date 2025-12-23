'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    User,
    ArrowDownLeft,
    ArrowUpRight,
    Download,
    Plus,
    Calendar,
    Printer
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

    const handleDownloadLedger = () => {
        // Create CSV content
        let csvContent = 'Member Ledger\n'
        csvContent += `Member Name: ${memberName}\n`
        csvContent += `Member ID: ${memberId.substring(0, 8)}\n`
        csvContent += `Statement Date: ${formatDate(new Date().toISOString())}\n\n`

        // Debit side
        csvContent += 'DEBIT SIDE (Charges)\n'
        csvContent += 'Sr.No,Date,Particulars,Amount\n'
        ledgerEntries.debit.forEach((entry, idx) => {
            csvContent += `${idx + 1},${formatDate(entry.date)},"${entry.particular}",${entry.amount}\n`
        })
        csvContent += `\nTotal Charges,${ledgerEntries.debit.reduce((sum, e) => sum + e.amount, 0)}\n\n`

        // Credit side
        csvContent += 'CREDIT SIDE (Payments)\n'
        csvContent += 'Sr.No,Date,Particulars,Amount\n'
        ledgerEntries.credit.forEach((entry, idx) => {
            csvContent += `${idx + 1},${formatDate(entry.date)},"${entry.particular}",${entry.amount}\n`
        })
        csvContent += `\nTotal Payments,${ledgerEntries.credit.reduce((sum, e) => sum + e.amount, 0)}\n\n`

        // Summary
        csvContent += 'SUMMARY\n'
        csvContent += `Net Balance,${Math.abs(currentMemberBalance)}\n`
        csvContent += `Status,${currentMemberBalance > 0 ? 'Receivable' : currentMemberBalance < 0 ? 'Payable' : 'Settled'}\n`

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${memberName.replace(/\s+/g, '_')}_ledger_${formatDate(new Date().toISOString())}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePrintLedger = () => {
        // Create a print-friendly version
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${memberName} - Member Ledger</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        margin: 20px;
                        color: #1f2937;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #10b981;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #065f46;
                        font-size: 24px;
                        margin: 0;
                        text-transform: uppercase;
                    }
                    .header p {
                        margin: 5px 0;
                        font-size: 12px;
                        color: #6b7280;
                    }
                    .ledger-section {
                        margin-bottom: 30px;
                    }
                    .section-title {
                        font-weight: bold;
                        font-size: 14px;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        border-bottom: 1px solid #d1d5db;
                        padding-bottom: 5px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #d1d5db;
                        padding: 8px;
                        text-align: left;
                        font-size: 12px;
                    }
                    th {
                        background-color: #f3f4f6;
                        font-weight: bold;
                    }
                    .amount {
                        text-align: right;
                    }
                    .debit-amount {
                        color: #dc2626;
                    }
                    .credit-amount {
                        color: #059669;
                    }
                    .summary {
                        border: 2px solid #10b981;
                        padding: 20px;
                        border-radius: 8px;
                        background-color: #f0fdf4;
                    }
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        font-size: 14px;
                    }
                    .summary-label {
                        font-weight: bold;
                    }
                    .summary-value {
                        font-weight: bold;
                    }
                    .net-balance {
                        font-size: 18px;
                        color: ${currentMemberBalance > 0 ? '#dc2626' : '#059669'};
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${memberName}</h1>
                    <p>Member ID: ${memberId.substring(0, 8)}</p>
                    <p>Statement Date: ${formatDate(new Date().toISOString())}</p>
                </div>

                <div class="ledger-section">
                    <div class="section-title">Debit Side (Charges)</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px;">Sr.No</th>
                                <th style="width: 100px;">Date</th>
                                <th>Particulars</th>
                                <th style="width: 100px;" class="amount">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ledgerEntries.debit.map((entry, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${formatDate(entry.date)}</td>
                                    <td>${entry.particular}</td>
                                    <td class="amount debit-amount">₹${entry.amount.toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')}
                            ${ledgerEntries.debit.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No debit records found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>

                <div class="ledger-section">
                    <div class="section-title">Credit Side (Payments)</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px;">Sr.No</th>
                                <th style="width: 100px;">Date</th>
                                <th>Particulars</th>
                                <th style="width: 100px;" class="amount">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ledgerEntries.credit.map((entry, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${formatDate(entry.date)}</td>
                                    <td>${entry.particular}</td>
                                    <td class="amount credit-amount">₹${entry.amount.toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')}
                            ${ledgerEntries.credit.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No credit records found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>

                <div class="summary">
                    <div class="summary-row">
                        <span class="summary-label">Total Charges (DR):</span>
                        <span class="summary-value debit-amount">₹${ledgerEntries.debit.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Total Paid (CR):</span>
                        <span class="summary-value credit-amount">₹${ledgerEntries.credit.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="summary-row" style="border-top: 1px solid #d1d5db; padding-top: 10px; margin-top: 10px;">
                        <span class="summary-label net-balance">Net Balance:</span>
                        <span class="summary-value net-balance">₹${Math.abs(currentMemberBalance).toLocaleString('en-IN')}</span>
                    </div>
                    ${currentMemberBalance !== 0 ? `<div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 10px;">(${currentMemberBalance > 0 ? 'Receivable' : 'Payable'})</div>` : ''}
                </div>
            </body>
            </html>
        `

        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()

        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 500)
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

                    <Button
                        onClick={handleDownloadLedger}
                        variant="outline"
                        className="h-11 border-2 border-stone-100 font-bold uppercase tracking-wider text-xs px-6 hover:bg-stone-50 transition-all rounded-xl"
                    >
                        <Download className="w-4 h-4 mr-2 text-stone-400" />
                        Download Ledger
                    </Button>
                    <Button
                        onClick={handlePrintLedger}
                        variant="outline"
                        className="h-11 border-2 border-stone-100 font-bold uppercase tracking-wider text-xs px-6 hover:bg-stone-50 transition-all rounded-xl"
                    >
                        <Printer className="w-4 h-4 mr-2 text-stone-400" />
                        Print Ledger
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
