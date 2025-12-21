'use client'

import { useState, useEffect, useMemo, useActionState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, MoreHorizontal, IndianRupee, Trash2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createPlan, deletePlan, type ActionState } from '@/app/actions/plan'

const initialState: ActionState = {
    message: '',
    error: '',
    success: false
}

type Plan = {
    id: string
    gym_id: string
    name: string
    description: string
    duration_months: number
    price: number
    discount_amount?: number
    final_amount?: number
    custom_days?: number
    plan_period: string
    status: 'active' | 'inactive'
    created_at: string
}

export default function PlansPage() {
    const [open, setOpen] = useState(false)
    const [plans, setPlans] = useState<Plan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [gymId, setGymId] = useState<string | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [planPeriod, setPlanPeriod] = useState('monthly')

    const [state, formAction, isPending] = useActionState(createPlan, initialState)
    const supabase = createClient()

    const fetchPlans = async (currentGymId: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('membership_plans')
            .select('*')
            .eq('gym_id', currentGymId)
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Failed to fetch plans')
            console.error(error)
        } else {
            setPlans(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        setMounted(true)
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.gym_id) {
                setGymId(user.user_metadata.gym_id)
                fetchPlans(user.user_metadata.gym_id)
            }
        }
        getSession()
    }, [])

    useEffect(() => {
        if (state?.success) {
            setOpen(false)
            setPlanPeriod('monthly')
            if (state.message) toast.success(state.message)
            if (gymId) fetchPlans(gymId)
        }
    }, [state, gymId])

    const columns = useMemo<ColumnDef<Plan>[]>(() => [
        {
            header: 'Sr.No.',
            cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Plan Name',
            cell: ({ row }) => <span className="font-bold text-stone-900">{row.getValue('name')}</span>,
        },
        {
            accessorKey: 'plan_period',
            header: 'Plan Period',
            cell: ({ row }) => {
                const period = row.getValue('plan_period') as string
                const customDays = row.original.custom_days
                const displayPeriod = period === 'custom' ? `${customDays} days` : period
                return <Badge variant="outline" className="capitalize">{displayPeriod}</Badge>
            },
        },
        {
            accessorKey: 'price',
            header: 'Plan Price',
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-800" />
                    <span className="font-semibold text-stone-900">{row.getValue('price')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'discount_amount',
            header: 'Discount',
            cell: ({ row }) => {
                const discount = row.getValue('discount_amount') as number
                return (
                    <div className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-800" />
                        <span>{discount || 0}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: 'final_amount',
            header: 'Final Amount',
            cell: ({ row }) => {
                const finalAmount = row.original.final_amount || row.original.price
                return (
                    <div className="flex items-center gap-1 font-bold text-emerald-700">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>{finalAmount}</span>
                    </div>
                )
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const plan = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-40 p-1">
                            <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold">Plan Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-green-200 my-1" />
                            <DropdownMenuItem
                                onClick={() => setDeleteId(plan.id)}
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 focus:text-red-700 font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Plan
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [gymId])

    const handleDelete = async () => {
        if (!deleteId) return

        setIsDeleting(true)
        const toastId = toast.loading('Deleting plan...')
        const result = await deletePlan(deleteId)

        if (result.success) {
            toast.success(result.message || 'Plan deleted', { id: toastId })
            if (gymId) fetchPlans(gymId)
        } else {
            toast.error(result.error || 'Failed to delete plan', { id: toastId })
        }
        setIsDeleting(false)
        setDeleteId(null)
    }

    if (!mounted) return null

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                        Membership Plans
                    </h1>
                    <p className="text-stone-500 mt-2">Create and manage membership plans for your gym branches.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg shadow-emerald-900/20 px-6 h-11 text-md font-bold rounded-xl transition-all">
                            <Plus className="w-5 h-5 mr-2" />
                            Create New Plan
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white rounded-[24px] border-none shadow-2xl p-0 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-stone-900">Create New Plan</DialogTitle>
                                <DialogDescription className="text-stone-500 text-base">
                                    Add a new membership plan available to all branches.
                                </DialogDescription>
                            </DialogHeader>

                            {/* Info Box */}
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-3 items-start">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                    <TrendingUp className="w-4 h-4 text-emerald-800" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Plan Details</p>
                                    <p className="text-xs text-emerald-800 mt-1 font-medium">
                                        Plans created here will be visible to all branches and members.
                                    </p>
                                </div>
                            </div>

                            <form action={formAction} className="space-y-5">
                                <input type="hidden" name="gymId" value={gymId || ''} />
                                <div className="space-y-2">
                                    <Label htmlFor="planName" className="text-stone-700 font-medium text-sm">Plan Name</Label>
                                    <Input
                                        id="planName"
                                        name="planName"
                                        placeholder="e.g. Basic Membership"
                                        required
                                        className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="planPeriod" className="text-stone-700 font-medium text-sm">Plan Period</Label>
                                        <Select value={planPeriod} onValueChange={setPlanPeriod}>
                                            <SelectTrigger className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all font-medium outline-none">
                                                <SelectValue placeholder="Select period" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white rounded-xl border-2 border-emerald-600/30 shadow-xl">
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                                                <SelectItem value="half-yearly">Half Yearly (6 months)</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                                <SelectItem value="custom">Custom (Days)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <input type="hidden" name="planPeriod" value={planPeriod} />
                                    </div>

                                    {planPeriod === 'custom' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="customPeriod" className="text-stone-700 font-medium text-sm">Days</Label>
                                            <Input
                                                id="customPeriod"
                                                name="customPeriod"
                                                type="number"
                                                placeholder="e.g. 45"
                                                min="1"
                                                className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="planPrice" className="text-stone-700 font-medium text-sm">Plan Price (₹)</Label>
                                        <Input
                                            id="planPrice"
                                            name="planPrice"
                                            type="number"
                                            placeholder="e.g. 5000"
                                            min="0"
                                            step="0.01"
                                            required
                                            className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount" className="text-stone-700 font-medium text-sm">Discount (₹)</Label>
                                        <Input
                                            id="discount"
                                            name="discount"
                                            type="number"
                                            placeholder="e.g. 500"
                                            min="0"
                                            step="0.01"
                                            className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                        />
                                    </div>
                                </div>

                                {state?.error && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                                        {state.error}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setOpen(false)}
                                        className="flex-1 h-12 rounded-xl border-2 border-green-200 text-green-600 hover:bg-green-50 font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold shadow-lg shadow-emerald-900/20"
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Plan'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-emerald-800 animate-spin" />
                        <p className="text-stone-500 font-medium animate-pulse">Loading Plans...</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={plans} />
                )}
            </motion.div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-white rounded-[24px] border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold text-stone-900 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            Delete Plan?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-stone-500 text-center text-base mt-2">
                            This will permanently delete this membership plan. Members already enrolled in this plan will not be affected, but new members won't be able to select it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-3 mt-6">
                        <AlertDialogCancel className="flex-1 h-12 rounded-xl border-2 border-green-200 text-green-600 hover:bg-green-50 font-semibold mt-0">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete Plan'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
