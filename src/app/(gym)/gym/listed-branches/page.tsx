'use client'

import { useState, useEffect, useMemo, useActionState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Loader2, MoreHorizontal, MapPin, Phone, Mail, Building2, KeyRound, Trash2 } from 'lucide-react'
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
import { createBranch, deleteBranch, type ActionState } from '@/app/actions/branch'

const initialState: ActionState = {
    message: '',
    error: '',
    success: false
}

type Branch = {
    id: string
    gym_id: string
    name: string
    email: string
    phone: string
    address: string
    status: 'active' | 'inactive'
    created_at: string
}

export default function ListedBranchesPage() {
    const [open, setOpen] = useState(false)
    const [branches, setBranches] = useState<Branch[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [gymId, setGymId] = useState<string | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [state, formAction, isPending] = useActionState(createBranch, initialState)
    const supabase = createClient()

    const fetchBranches = async (currentGymId: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('branches')
            .select('*')
            .eq('gym_id', currentGymId)
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Failed to fetch branches')
            console.error(error)
        } else {
            setBranches(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        setMounted(true)
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.gym_id) {
                setGymId(user.user_metadata.gym_id)
                fetchBranches(user.user_metadata.gym_id)
            }
        }
        getSession()
    }, [])

    useEffect(() => {
        if (state?.success) {
            setOpen(false)
            if (state.message) toast.success(state.message)
            if (gymId) fetchBranches(gymId)
        }
    }, [state, gymId])

    const columns = useMemo<ColumnDef<Branch>[]>(() => [
        {
            header: 'Sr.No.',
            cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Branch Name',
            cell: ({ row }) => <span className="font-bold text-stone-900">{row.getValue('name')}</span>,
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
            accessorKey: 'phone',
            header: 'Contact Number',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{row.getValue('phone')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'address',
            header: 'Location',
            cell: ({ row }) => {
                const address = row.getValue('address') as string
                return (
                    <div className="flex items-center gap-2 max-w-[200px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                        <span title={address}>{address || 'Not specified'}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as string
                return (
                    <Badge
                        variant="outline"
                        className={`capitalize ${status === 'active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                            }`}
                    >
                        {status}
                    </Badge>
                )
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const branch = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-40 p-1">
                            <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold">Branch Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700 focus:text-emerald-900 font-medium transition-colors">
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteId(branch.id)}
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 focus:text-red-700 font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Branch
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
        const toastId = toast.loading('Deleting branch and associated data...')
        const result = await deleteBranch(deleteId)

        if (result.success) {
            toast.success(result.message || 'Branch deleted', { id: toastId })
            if (gymId) fetchBranches(gymId)
        } else {
            toast.error(result.error || 'Failed to delete branch', { id: toastId })
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
                        Listed Branches
                    </h1>
                    <p className="text-stone-500 mt-2">Manage all your gym branches and their details.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg shadow-emerald-900/20 px-6 h-11 text-md font-bold rounded-xl transition-all">
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Branch
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white rounded-[24px] border-none shadow-2xl p-0 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-stone-900">Create New Branch</DialogTitle>
                                <DialogDescription className="text-stone-500 text-base">
                                    Add a new location to your gym network.
                                </DialogDescription>
                            </DialogHeader>

                            {/* Info Box for Default Password */}
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-3 items-start">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                    <KeyRound className="w-4 h-4 text-emerald-800" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Default Security</p>
                                    <p className="text-xs text-emerald-800 mt-1 font-medium">
                                        Login: <span className="font-bold underline decoration-emerald-300">New Branch Email</span><br />
                                        Password: <span className="font-bold underline decoration-emerald-300">gymbranch123</span>
                                    </p>
                                </div>
                            </div>

                            <form action={formAction} className="space-y-5">
                                <input type="hidden" name="gymId" value={gymId || ''} />
                                <div className="space-y-2">
                                    <Label htmlFor="branchName" className="text-stone-700 font-medium text-sm">Branch Name</Label>
                                    <Input
                                        id="branchName"
                                        name="branchName"
                                        placeholder="e.g. Downtown Fitness Center"
                                        required
                                        className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
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
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-stone-700 font-medium text-sm">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="branch@gymflow.com"
                                            required
                                            className="h-12 rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-stone-700 font-medium text-sm">Full Address</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        placeholder="Enter full branch address here..."
                                        rows={3}
                                        className="min-h-[100px] rounded-xl !bg-white border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none resize-none"
                                    />
                                </div>

                                {/* Manager Details Section */}
                                <div className="border-t border-stone-200 pt-4 space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-stone-900">Branch Manager Details</h3>
                                        <p className="text-xs text-stone-500 mt-1">Assign a manager who will handle this branch operations</p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="managerName" className="text-stone-700 font-medium text-sm">Manager Name</Label>
                                        <Input
                                            id="managerName"
                                            name="managerName"
                                            placeholder="e.g. Rajesh Kumar"
                                            required
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
                                            'Create Branch'
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
                        <p className="text-stone-500 font-medium animate-pulse">Loading Branches...</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={branches} />
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
                            Delete Branch?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-stone-500 text-center text-base mt-2">
                            This will permanently delete this branch and all associated staff/operator accounts. This action is irreversible.
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
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete Branch'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
