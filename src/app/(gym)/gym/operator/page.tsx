'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Plus, Loader2, MoreHorizontal, User, Phone, Mail, ShieldCheck } from 'lucide-react'
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

type Operator = {
    id: string
    full_name: string
    email: string
    phone: string
    role: string
    branch_name: string
    branch_id: string
}

export default function OperatorsPage() {
    const [open, setOpen] = useState(false)
    const [operators, setOperators] = useState<Operator[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [selectedBranch, setSelectedBranch] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const fetchOperators = async () => {
            try {
                setIsLoading(true)
                const { data: { user } } = await supabase.auth.getUser()
                
                if (!user) {
                    toast.error('User not authenticated')
                    return
                }

                // Get gym_id from profiles
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('gym_id')
                    .eq('id', user.id)
                    .single()

                if (!profileData?.gym_id) {
                    toast.error('Gym not found')
                    return
                }

                // Fetch operators (branch_admin and receptionist) with their branch info
                const { data: operatorsData, error } = await supabase
                    .from('profiles')
                    .select(`
                        id,
                        full_name,
                        email,
                        phone,
                        role,
                        branch_id,
                        branches (
                            id,
                            name
                        )
                    `)
                    .eq('gym_id', profileData.gym_id)
                    .in('role', ['branch_admin', 'receptionist'])

                if (error) {
                    console.error('Error fetching operators:', error)
                    toast.error('Failed to fetch operators')
                    return
                }

                // Get full user data including metadata for branch info fallback
                const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
                const userMetadata = new Map(
                    (users || [])
                        .filter(u => (operatorsData || []).some(op => op.id === u.id))
                        .map(u => [u.id, u.user_metadata || {}])
                )

                // Format the data
                const formattedOperators: Operator[] = (operatorsData || []).map((op: any) => {
                    const metadata = userMetadata.get(op.id) || {}
                    return {
                        id: op.id,
                        full_name: op.full_name || 'N/A',
                        email: op.email || 'N/A',
                        phone: op.phone || 'N/A',
                        role: op.role || 'N/A',
                        branch_name: op.branches?.name || metadata?.branch_name || 'No Branch',
                        branch_id: op.branch_id || metadata?.branch_id || 'N/A'
                    }
                })

                setOperators(formattedOperators)
            } catch (error) {
                console.error('Error:', error)
                toast.error('Failed to load operators')
            } finally {
                setIsLoading(false)
            }
        }

        if (mounted) {
            fetchOperators()
        }
    }, [mounted, supabase])

    // Get unique roles and branches for filter dropdowns
    const uniqueRoles = useMemo(() => {
        const roles = [...new Set(operators.map(op => op.role))]
        return roles.sort()
    }, [operators])

    const uniqueBranches = useMemo(() => {
        const branches = [...new Set(operators.map(op => op.branch_name))]
        return branches.sort()
    }, [operators])

    // Filter operators based on selected filters
    const filteredOperators = useMemo(() => {
        return operators.filter(op => {
            const matchesRole = !selectedRole || op.role === selectedRole
            const matchesBranch = !selectedBranch || op.branch_name === selectedBranch
            const matchesSearch = !searchQuery || 
                op.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                op.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                op.phone.includes(searchQuery)
            
            return matchesRole && matchesBranch && matchesSearch
        })
    }, [operators, selectedRole, selectedBranch, searchQuery])

    const columns = useMemo<ColumnDef<Operator>[]>(() => [
        {
            header: 'Sr.No.',
            cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: 'full_name',
            header: 'Operator Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-xs">
                        {(row.getValue('full_name') as string).substring(0, 1)}
                    </div>
                    <span className="font-bold text-stone-900">{row.getValue('full_name')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'branch_name',
            header: 'Branch',
            cell: ({ row }) => (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 capitalize">
                    {row.getValue('branch_name')}
                </Badge>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => {
                const role = row.getValue('role') as string
                return (
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-800" />
                        <span className="capitalize font-medium text-stone-700">{role}</span>
                    </div>
                )
            },
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
            header: 'Phone Number',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{row.getValue('phone')}</span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
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
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 focus:text-red-700 font-medium transition-colors">
                                Deactivate Account
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                        Manage Operators
                    </h1>
                    <p className="text-stone-500 mt-2">Manage staff accounts and permissions for your gym.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg shadow-emerald-900/20 px-6 h-11 text-md font-bold rounded-xl transition-all">
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Operator
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-stone-900">Create Operator Account</DialogTitle>
                                <DialogDescription className="text-stone-500 text-base">
                                    Set up a new staff member with appropriate access.
                                </DialogDescription>
                            </DialogHeader>
                            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setOpen(false); toast.success('Operator added successfully (Demo)'); }}>
                                <div className="space-y-2">
                                    <Label htmlFor="operatorName" className="text-stone-700 font-medium text-sm">Full Name</Label>
                                    <Input
                                        id="operatorName"
                                        placeholder="Enter Operator's Name"
                                        required
                                        className="h-12 rounded-xl bg-white! border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-stone-700 font-medium text-sm">Designation</Label>
                                        <select
                                            id="role"
                                            className="w-full h-12 rounded-xl bg-white border-2 border-emerald-600/30 text-stone-900 px-3 font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                                        >
                                            <option value="manager">Manager</option>
                                            <option value="receptionist">Receptionist</option>
                                            <option value="staff">Other Staff</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-stone-700 font-medium text-sm">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+91 00000 00000"
                                            required
                                            className="h-12 rounded-xl bg-white! border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-stone-700 font-medium text-sm">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="operator@gymflow.com"
                                        required
                                        className="h-12 rounded-xl bg-white! border-2 border-emerald-600/30 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 transition-all font-medium outline-none"
                                    />
                                </div>

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
                                    >
                                        Create Account
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-stone-700">Search</Label>
                    <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 rounded-lg border-emerald-200 focus:border-emerald-600 focus:ring-emerald-600/20"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-stone-700">Role</Label>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="h-10 w-full px-3 rounded-lg border border-emerald-200 bg-white text-stone-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all cursor-pointer"
                    >
                        <option value="">All Roles</option>
                        {uniqueRoles.map((role) => (
                            <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-stone-700">Branch</Label>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="h-10 w-full px-3 rounded-lg border border-emerald-200 bg-white text-stone-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all cursor-pointer"
                    >
                        <option value="">All Branches</option>
                        {uniqueBranches.map((branch) => (
                            <option key={branch} value={branch}>
                                {branch}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-stone-700">Results</Label>
                    <div className="h-10 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center">
                        <span className="font-bold text-emerald-800">{filteredOperators.length} operators</span>
                    </div>
                </div>
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
                ) : filteredOperators.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <User className="w-12 h-12 text-stone-300" />
                        <p className="text-stone-500 font-medium">No operators found matching your filters</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={filteredOperators} />
                )}
            </motion.div>
        </div>
    )
}
