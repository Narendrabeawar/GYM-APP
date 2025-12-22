'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IndianRupee, CreditCard, Wallet, Banknote, ChevronDown, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import PaymentSuccessDialog from './PaymentSuccessDialog'

interface CollectDuesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    memberId: string
    memberName: string
    totalDues: number
    branchId: string | null
    gymId: string | null
    onSuccess: () => void
}

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'upi', label: 'UPI / Online', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'card', label: 'Card Payment', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
]

export default function CollectDuesDialog({
    open,
    onOpenChange,
    memberId,
    memberName,
    totalDues,
    branchId,
    gymId,
    onSuccess
}: CollectDuesDialogProps) {
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState('cash')
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [lastAmount, setLastAmount] = useState<string | number>(0)
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            setAmount(totalDues > 0 ? totalDues.toString() : '')
            setMethod('cash')
        }
    }, [open, totalDues])

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('payments')
                .insert({
                    member_id: memberId,
                    gym_id: gymId,
                    branch_id: branchId,
                    amount: parseFloat(amount),
                    payable_amount: 0,
                    payment_method: method,
                    status: 'completed',
                    description: 'Dues clearing'
                })

            if (error) throw error

            setLastAmount(amount)
            setShowSuccess(true)
            onSuccess()
            // We don't close the main dialog immediately to let the success dialog show
            // but we can clear the input
            setAmount('')
        } catch (error: any) {
            toast.error(error.message || 'Error recording payment')
        } finally {
            setLoading(false)
        }
    }

    const handleSuccessClose = (open: boolean) => {
        setShowSuccess(open)
        if (!open) {
            onOpenChange(false) // Close the collect dues dialog too when done
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-3xl border-2 border-green-200 p-0 overflow-hidden bg-white shadow-2xl">
                <DialogHeader className="p-6 bg-emerald-50 border-b border-green-200">
                    <DialogTitle className="text-xl font-bold text-stone-900 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                        Collect Payment
                    </DialogTitle>
                    <DialogDescription className="font-medium text-stone-500 text-xs uppercase tracking-wider">
                        Recording dues for {memberName}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 bg-white">
                    {/* Dues Callout */}
                    <div className="bg-emerald-50/50 rounded-2xl p-4 border border-green-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pending Balance</p>
                            <p className="text-2xl font-black text-emerald-700 tracking-tight">₹{totalDues.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-green-200">
                            <IndianRupee className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Receive Amount (₹)</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-600">₹</span>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-12 pl-10 rounded-xl border-2 border-stone-100 focus:border-emerald-500 bg-stone-50/30 text-lg font-bold tabular-nums"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Payment Method</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {PAYMENT_METHODS.map((pm) => (
                                    <button
                                        key={pm.id}
                                        onClick={() => setMethod(pm.id)}
                                        className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all gap-1 group relative ${method === pm.id
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-stone-100 bg-white hover:border-emerald-100'
                                            }`}
                                    >
                                        <pm.icon className={`w-5 h-5 ${method === pm.id ? 'text-emerald-600' : 'text-stone-400 group-hover:text-emerald-500'}`} />
                                        <span className={`text-[9px] font-bold uppercase tracking-tight ${method === pm.id ? 'text-emerald-700' : 'text-stone-500'}`}>
                                            {pm.label}
                                        </span>
                                        {method === pm.id && (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 absolute top-1 right-1" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl font-bold border-2 border-stone-100 text-stone-500"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-100"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Confirm'}
                        </Button>
                    </div>
                </div>
            </DialogContent>

            <PaymentSuccessDialog
                open={showSuccess}
                onOpenChange={handleSuccessClose}
                amount={lastAmount}
                memberName={memberName}
            />
        </Dialog>
    )
}
