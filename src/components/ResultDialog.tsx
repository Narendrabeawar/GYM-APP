'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertCircle, X, Loader2 } from 'lucide-react'

interface ResultDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    type: 'success' | 'error' | 'warning' | 'loading'
    title: string
    description?: string
    actionText?: string
    onAction?: () => void
    autoClose?: boolean
    autoCloseDelay?: number
}

const iconConfig = {
    success: {
        icon: CheckCircle2,
        bgColor: 'bg-emerald-500',
        lightBg: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-200'
    },
    error: {
        icon: XCircle,
        bgColor: 'bg-red-500',
        lightBg: 'bg-red-50',
        textColor: 'text-red-600',
        borderColor: 'border-red-200'
    },
    warning: {
        icon: AlertCircle,
        bgColor: 'bg-yellow-500',
        lightBg: 'bg-yellow-50',
        textColor: 'text-yellow-600',
        borderColor: 'border-yellow-200'
    },
    loading: {
        icon: Loader2,
        bgColor: 'bg-blue-500',
        lightBg: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200'
    }
}

export default function ResultDialog({
    open,
    onOpenChange,
    type,
    title,
    description,
    actionText = "Continue",
    onAction,
    autoClose = false,
    autoCloseDelay = 3000
}: ResultDialogProps) {
    const config = iconConfig[type]
    const Icon = config.icon

    // Auto-close functionality
    React.useEffect(() => {
        if (open && autoClose && type !== 'loading') {
            const timer = setTimeout(() => {
                onOpenChange(false)
            }, autoCloseDelay)
            return () => clearTimeout(timer)
        }
    }, [open, autoClose, autoCloseDelay, type, onOpenChange])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative"
                >
                    {/* Close button */}
                    {!autoClose && (
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    )}

                    <Card className="border-0 shadow-2xl overflow-hidden">
                        {/* Gradient Header */}
                        <div className={`relative h-20 ${config.bgColor} flex items-center justify-center`}>
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                            >
                                <Icon className={`w-8 h-8 text-white ${type === 'loading' ? 'animate-spin' : ''}`} />
                            </motion.div>

                            {/* Decorative elements */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-2 left-4 w-2 h-2 rounded-full bg-white/30"></div>
                                <div className="absolute top-6 right-6 w-1 h-1 rounded-full bg-white/20"></div>
                                <div className="absolute bottom-3 left-8 w-1.5 h-1.5 rounded-full bg-white/25"></div>
                                <div className="absolute bottom-6 right-4 w-1 h-1 rounded-full bg-white/30"></div>
                            </div>
                        </div>

                        {/* Content */}
                        <CardContent className="p-6 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <DialogTitle className="text-xl font-bold text-gray-800 mb-2">
                                    {title}
                                </DialogTitle>

                                {description && (
                                    <DialogDescription className="text-gray-600 mb-6 leading-relaxed">
                                        {description}
                                    </DialogDescription>
                                )}

                                {/* Action Button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex justify-center"
                                >
                                    <Button
                                        onClick={() => {
                                            onAction?.()
                                            onOpenChange(false)
                                        }}
                                        className={`px-6 py-2 font-semibold rounded-lg shadow-lg transition-all duration-200 ${
                                            type === 'success'
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                : type === 'error'
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : type === 'warning'
                                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                        disabled={type === 'loading'}
                                    >
                                        {type === 'loading' ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Please Wait...
                                            </>
                                        ) : (
                                            actionText
                                        )}
                                    </Button>
                                </motion.div>

                                {/* Auto-close indicator */}
                                {autoClose && type !== 'loading' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="mt-4 flex justify-center"
                                    >
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="w-8 h-0.5 bg-gray-300 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ x: '-100%' }}
                                                    animate={{ x: '100%' }}
                                                    transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
                                                    className="h-full bg-gray-400 rounded-full"
                                                />
                                            </div>
                                            <span>Auto-closing...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </DialogContent>
        </Dialog>
    )
}

// Convenience components for common use cases
export function SuccessDialog({
    open,
    onOpenChange,
    title,
    description,
    actionText = "Continue",
    onAction,
    autoClose = true
}: Omit<ResultDialogProps, 'type'>) {
    return (
        <ResultDialog
            open={open}
            onOpenChange={onOpenChange}
            type="success"
            title={title}
            description={description}
            actionText={actionText}
            onAction={onAction}
            autoClose={autoClose}
        />
    )
}

export function ErrorDialog({
    open,
    onOpenChange,
    title,
    description,
    actionText = "Try Again",
    onAction,
    autoClose = false
}: Omit<ResultDialogProps, 'type'>) {
    return (
        <ResultDialog
            open={open}
            onOpenChange={onOpenChange}
            type="error"
            title={title}
            description={description}
            actionText={actionText}
            onAction={onAction}
            autoClose={autoClose}
        />
    )
}

export function LoadingDialog({
    open,
    onOpenChange,
    title = "Processing...",
    description
}: Omit<ResultDialogProps, 'type' | 'actionText' | 'onAction' | 'autoClose'>) {
    return (
        <ResultDialog
            open={open}
            onOpenChange={onOpenChange}
            type="loading"
            title={title}
            description={description}
            actionText="Please Wait"
            autoClose={false}
        />
    )
}
