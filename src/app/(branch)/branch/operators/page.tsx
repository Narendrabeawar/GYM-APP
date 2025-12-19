'use client'

import { useState, useEffect, useMemo, useActionState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Loader2, MoreHorizontal, User, Phone, Mail, ShieldCheck, KeyRound, MapPin, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createOperator, deleteOperator, type OperatorActionState } from '@/app/actions/operator'

const initialState: OperatorActionState = {
    message: '',
    error: '',
    success: false
}

type Operator = {
    id: string
    full_name: string
    email: string
    role: string
    address?: string
    created_at: string
}

export default function BranchOperatorsPage() {
    const [open, setOpen] = useState(false)
    const [operators, setOperators] = useState<Operator[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [gymId, setGymId] = useState<string | null>(null)
    const [branchId, setBranchId] = useState<string | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [state, formAction, isPending] = useActionState(createOperator, initialState)
    const supabase = createClient()

    const fetchOperators = async (currentBranchId: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('branch_id', currentBranchId)
            .neq('role', 'branch_admin')
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Failed to fetch operators')
        } else {
            setOperators(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        setMounted(true)
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata) {
                setGymId(user.user_metadata.gym_id)
                setBranchId(user.user_metadata.branch_id)
                if (user.user_metadata.branch_id) {
                    fetchOperators(user.user_metadata.branch_id)
                }
            }
        }
        getSession()
    }, [])

    useEffect(() => {
        if (state?.success) {
            setOpen(false)
            if (state.message) toast.success(state.message)
            if (branchId) fetchOperators(branchId)
        }
    }, [state, branchId])

    const columns = useMemo<ColumnDef<Operator>[]>(() => [
        {
            header: 'Sr.No.',
            size: 80,
            cell: ({ row }) => <span className="font-medium text-stone-500">{row.index + 1}</span>,
        },
        {
            accessorKey: 'full_name',
            header: 'Operator Name',
            size: 200,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-xs shadow-sm">
                        {(row.getValue('full_name') as string || 'U').substring(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold text-stone-900 truncate">{row.getValue('full_name')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Designation',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-800" />
                    <span className="capitalize font-medium text-stone-700">{row.getValue('role')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email ID',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{row.getValue('email')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'address',
            header: 'Full Address',
            size: 400,
            cell: ({ row }) => (
                <div className="flex items-start gap-2 min-w-[300px] max-w-[500px]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-800 shrink-0 mt-0.5" />
                    <span className="text-stone-600 leading-snug break-words">
                        {row.getValue('address') || 'Not Provided'}
                    </span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const operator = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-40 p-1">
                            <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold">Operator Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700 focus:text-emerald-900 font-medium transition-colors">
                                <User className="w-4 h-4" />
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteId(operator.id)}
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 focus:text-red-700 font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [])

    const handleDelete = async () => {
        if (!deleteId) return

        setIsDeleting(true)
        const toastId = toast.loading('Deleting operator...')
        const result = await deleteOperator(deleteId)

        if (result.success) {
            toast.success(result.message || 'Operator deleted', { id: toastId })
            if (branchId) fetchOperators(branchId)
        } else {
            toast.error(result.error || 'Failed to delete operator', { id: toastId })
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
                        Branch Operators
                    </h1>
                    <p className="text-stone-500 mt-2">Manage your branch staff and their portal access.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg shadow-emerald-900/20 px-6 h-11 text-md font-bold rounded-xl transition-all">
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Operator
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white rounded-[24px] border-none shadow-2xl p-0 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-stone-900">Create Operator Account</DialogTitle>
                                <DialogDescription className="text-stone-500 text-base">
                                    Add a new staff member to this branch.
                                </DialogDescription>
                            </DialogHeader>

                            {/* Info Box for Default Password */}
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-3 items-start">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                    <KeyRound className="w-4 h-4 text-emerald-800" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Staff Security</p>
                                    <p className="text-xs text-emerald-800 mt-1 font-medium">
                                        Password: <span className="font-bold underline decoration-emerald-300">operator123</span>
                                    </p>
                                </div>
                            </div>

                            <form action={formAction} className="space-y-5">
                                <input type="hidden" name="gymId" value={gymId || ''} />
                                <input type="hidden" name="branchId" value={branchId || ''} />

                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-stone-700 font-medium text-sm">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        placeholder="Enter Operator's Name"
                                        required
                                        className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="designation" className="text-stone-700 font-medium text-sm">Designation</Label>
                                        <select
                                            id="designation"
                                            name="designation"
                                            className="w-full h-12 rounded-xl bg-white border-2 border-emerald-600/30 text-stone-900 px-3 font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all shadow-sm"
                                        >
                                            <option value="receptionist">Receptionist</option>
                                            <option value="trainer">Trainer / Instructor</option>
                                            <option value="manager">Asst. Manager</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-stone-700 font-medium text-sm">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            placeholder="+91 00000 00000"
                                            required
                                            className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-stone-700 font-medium text-sm">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="operator@gymflow.com"
                                        required
                                        className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-stone-700 font-medium text-sm">Residential Address</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        placeholder="Enter operator's full address"
                                        className="min-h-[80px] rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none resize-none"
                                    />
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
                                            'Create Account'
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
                        <p className="text-stone-500 font-medium animate-pulse">Loading Operators...</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={operators} />
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
                            Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-stone-500 text-center text-base mt-2">
                            Are you sure you want to delete this operator account? This action cannot be undone and will permanently remove their access records.
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
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete Permanently'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
