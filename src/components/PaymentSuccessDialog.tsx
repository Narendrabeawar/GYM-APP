'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PaymentSuccessDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    amount: number | string
    memberName: string
}

export default function PaymentSuccessDialog({
    open,
    onOpenChange,
    amount,
    memberName
}: PaymentSuccessDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden border-none rounded-[2rem] bg-white shadow-2xl">
                <div className="relative p-8 flex flex-col items-center text-center">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Payment Success</DialogTitle>
                        <DialogDescription>
                            Summary of the successful payment for {memberName}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-emerald-50/50 -z-10" />

                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.1
                        }}
                        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner"
                    >
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-2xl font-black text-stone-900 mb-2">Payment Success!</h2>
                        <p className="text-stone-500 font-medium text-sm leading-relaxed mb-8">
                            Transaction completed successfully.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="w-full bg-stone-50 rounded-3xl p-6 border-2 border-dashed border-stone-200 mb-8"
                    >
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Received Amount</p>
                                <p className="text-3xl font-black text-emerald-600 tracking-tight">₹{Number(amount).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="pt-4 border-t border-stone-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">From Member</p>
                                <p className="text-base font-bold text-stone-800">{memberName}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="w-full"
                    >
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="w-full h-14 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-base shadow-xl transition-all active:scale-95 shadow-emerald-100"
                        >
                            Done
                        </Button>
                        <p className="mt-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            Thank you for the payment
                        </p>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
