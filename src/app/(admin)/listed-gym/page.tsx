'use client'

import { useActionState, useState, useEffect, useMemo } from 'react'
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
import { Plus, Loader2, MoreHorizontal, MapPin, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { createGym, updateGym, type ActionState } from '@/app/actions/gym'
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

const initialState: ActionState = {
    message: '',
    error: '',
    success: false
}

type Gym = {
    id: string
    name: string
    email: string
    phone: string
    address: string
    subscription_status: 'active' | 'inactive' | 'expired'
    created_at: string
}

export default function ListedGymsPage() {
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editingGym, setEditingGym] = useState<Gym | null>(null)
    const [gyms, setGyms] = useState<Gym[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    const [state, formAction, isPending] = useActionState(createGym, initialState)
    const [updateState, updateFormAction, isUpdating] = useActionState(updateGym, initialState)
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
        fetchGyms()
    }, [])

    const fetchGyms = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('gyms')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Failed to fetch gyms')
        } else {
            // Mapping for demo purposes since we just added the subscription_status via alter script (if run)
            // or setting default
            setGyms(data.map((item: any) => ({
                ...item,
                subscription_status: item.subscription_status || 'active'
            })))
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (state?.success && open) {
            setOpen(false)
            if (state.message) toast.success(state.message)
            fetchGyms() // Refresh table
        }
    }, [state, open])

    useEffect(() => {
        if (updateState?.success && editOpen) {
            setEditOpen(false)
            setEditingGym(null)
            if (updateState.message) toast.success(updateState.message)
            fetchGyms()
        }
    }, [updateState, editOpen])

    const handleEdit = (gym: Gym) => {
        setEditingGym(gym)
        setEditOpen(true)
    }

    const columns = useMemo<ColumnDef<Gym>[]>(() => [
        {
            header: 'Sr.No.',
            cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Name Of GYM',
            cell: ({ row }) => <span className="font-bold text-stone-900">{row.getValue('name')}</span>,
        },
        {
            accessorKey: 'phone',
            header: 'Mobile Number',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{row.getValue('phone')}</span>
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
            header: 'Address',
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
            accessorKey: 'subscription_status',
            header: 'Subscription status',
            cell: ({ row }) => {
                const status = row.getValue('subscription_status') as string
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
            header: 'Other',
            cell: ({ row }) => {
                const gym = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-40 p-1">
                            <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold">Gym Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700 focus:text-emerald-900 font-medium transition-colors"
                                onClick={() => navigator.clipboard.writeText(gym.id)}
                            >
                                Copy Gym ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-green-100 mx-1 my-1" />
                            <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700 focus:text-emerald-900 font-medium transition-colors"
                                onClick={() => handleEdit(gym)}
                            >
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 focus:text-red-700 font-medium transition-colors">
                                Delete Gym
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [])

    if (!mounted) return null

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                        Listed GYMs
                    </h1>
                    <p className="text-stone-500 mt-2">Manage all registered gyms on the platform.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg shadow-emerald-900/20 px-6 h-11 text-md font-bold rounded-xl transition-all">
                            <Plus className="w-5 h-5 mr-2" />
                            Add New GYM
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white rounded-[24px] border-none shadow-2xl p-0 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-stone-900">Create New GYM</DialogTitle>
                                <DialogDescription className="text-stone-500 text-base">
                                    Add a new gym to the platform. An account will be created with default password "newgym123".
                                </DialogDescription>
                            </DialogHeader>
                            <form action={formAction} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="gymName" className="text-stone-700 font-medium text-sm">Gym Name</Label>
                                    <Input
                                        id="gymName"
                                        name="gymName"
                                        placeholder="Enter Gym Name here"
                                        required
                                        className="h-12 rounded-xl !bg-white border border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 focus-visible:ring-1 focus-visible:ring-emerald-800/20 focus-visible:border-emerald-800 transition-all font-medium outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile" className="text-stone-700 font-medium text-sm">Mobile Number</Label>
                                    <Input
                                        id="mobile"
                                        name="mobile"
                                        placeholder="e.g. +91 98765 43210"
                                        required
                                        className="h-12 rounded-xl !bg-white border border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 focus-visible:ring-1 focus-visible:ring-emerald-800/20 focus-visible:border-emerald-800 transition-all font-medium outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-stone-700 font-medium text-sm">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="admin@gym.com"
                                        required
                                        className="h-12 rounded-xl !bg-white border border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 focus-visible:ring-1 focus-visible:ring-emerald-800/20 focus-visible:border-emerald-800 transition-all font-medium outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-stone-700 font-medium text-sm">Gym Address</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        placeholder="Enter full gym address here..."
                                        rows={3}
                                        className="min-h-[100px] rounded-xl !bg-white border border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20 focus-visible:ring-1 focus-visible:ring-emerald-800/20 focus-visible:border-emerald-800 transition-all font-medium outline-none resize-none"
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
                                        className="flex-1 h-12 rounded-xl border-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-900 font-semibold"
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
                                            'Create GYM'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Gym Dialog */}
                <Dialog open={editOpen} onOpenChange={(val) => {
                    setEditOpen(val)
                    if (!val) {
                        setEditingGym(null)
                    }
                }}>
                    <DialogContent className="sm:max-w-md bg-white rounded-[24px] border-none shadow-2xl p-0 overflow-hidden text-stone-900">
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-stone-900">Edit GYM Details</DialogTitle>
                                <DialogDescription className="text-stone-500 text-base">
                                    Update the information for your listed gym.
                                </DialogDescription>
                            </DialogHeader>
                            {editingGym && (
                                <form action={updateFormAction} className="space-y-4">
                                    <input type="hidden" name="id" value={editingGym.id} />
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-gymName" className="text-stone-700 font-medium text-sm">Gym Name</Label>
                                        <Input
                                            id="edit-gymName"
                                            name="gymName"
                                            defaultValue={editingGym.name}
                                            required
                                            className="h-11 rounded-xl !bg-white border border-emerald-600/30 text-stone-900 focus-visible:border-emerald-800 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-mobile" className="text-stone-700 font-medium text-sm">Mobile</Label>
                                            <Input
                                                id="edit-mobile"
                                                name="mobile"
                                                defaultValue={editingGym.phone}
                                                required
                                                className="h-11 rounded-xl !bg-white border border-emerald-600/30 text-stone-900 focus-visible:border-emerald-800 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-status" className="text-stone-700 font-medium text-sm">Status</Label>
                                            <select
                                                id="edit-status"
                                                name="subscriptionStatus"
                                                defaultValue={editingGym.subscription_status}
                                                className="w-full h-11 rounded-xl bg-white border border-emerald-600/30 text-stone-900 px-3 font-medium outline-none focus:border-emerald-800 transition-all"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="expired">Expired</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-email" className="text-stone-700 font-medium text-sm">Email ID</Label>
                                        <Input
                                            id="edit-email"
                                            name="email"
                                            type="email"
                                            defaultValue={editingGym.email}
                                            required
                                            className="h-11 rounded-xl !bg-white border border-emerald-600/30 text-stone-900 focus-visible:border-emerald-800 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-address" className="text-stone-700 font-medium text-sm">Address</Label>
                                        <Textarea
                                            id="edit-address"
                                            name="address"
                                            defaultValue={editingGym.address}
                                            rows={2}
                                            className="min-h-[80px] rounded-xl !bg-white border border-emerald-600/30 text-stone-900 focus-visible:border-emerald-800 transition-all font-medium resize-none"
                                        />
                                    </div>

                                    {updateState?.error && (
                                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                                            {updateState.error}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditOpen(false)}
                                            className="flex-1 h-11 rounded-xl border-2 border-green-200 text-green-700 hover:bg-green-50 font-semibold"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="flex-1 h-11 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold shadow-lg shadow-emerald-900/20"
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Update Changes'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}
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
                        <p className="text-stone-500 font-medium animate-pulse">Fetching Gyms from Database...</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={gyms} />
                )}
            </motion.div>
        </div>
    )
}
