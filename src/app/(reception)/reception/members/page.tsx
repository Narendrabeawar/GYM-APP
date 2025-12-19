'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Search,
    UserPlus,
    Loader2,
    Mail,
    Phone,
    Calendar,
    ArrowRight,
    MoreHorizontal,
    Trash2,
    ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Member = {
    id: string
    full_name: string
    email: string
    phone: string
    status: string
    membership_start_date: string
    membership_end_date: string
    gender: string
    created_at: string
}

export default function MembersDirectoryPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const fetchMembers = async (branchId: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Failed to fetch members')
        } else {
            setMembers(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        setMounted(true)
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.branch_id) {
                fetchMembers(user.user_metadata.branch_id)
            }
        }
        getSession()
    }, [supabase])

    const filteredMembers = useMemo(() => {
        return members.filter(member =>
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.phone?.includes(searchQuery) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [members, searchQuery])

    const columns = useMemo<ColumnDef<Member>[]>(() => [
        {
            header: 'Sr.No.',
            size: 80,
            cell: ({ row }) => <span className="font-medium text-stone-500">{row.index + 1}</span>,
        },
        {
            accessorKey: 'full_name',
            header: 'Member Name',
            size: 250,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-emerald-800 font-black text-sm shadow-sm">
                        {(row.getValue('full_name') as string || 'M').substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-stone-900 leading-none">{row.getValue('full_name')}</span>
                        <span className="text-[10px] text-stone-500 uppercase mt-1 font-bold tracking-tighter">{row.original.gender}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'phone',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-stone-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{row.getValue('phone')}</span>
                    </div>
                    {row.original.email && (
                        <div className="flex items-center gap-2 text-stone-500 text-xs">
                            <Mail className="w-3.5 h-3.5 text-stone-400" />
                            <span>{row.original.email}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as string
                return (
                    <Badge
                        variant="outline"
                        className={`capitalize font-bold rounded-lg border-2 ${status === 'active'
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
            accessorKey: 'membership_start_date',
            header: 'Enrolled On',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-stone-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{new Date(row.getValue('membership_start_date')).toLocaleDateString()}</span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: () => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4 text-stone-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-40 p-1">
                        <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold uppercase">Manage</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700">
                            View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700 font-medium">
                            Edit Details
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ], [])

    if (!mounted) return null

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent underline decoration-emerald-200 decoration-4 underline-offset-8">
                        Members Directory
                    </h1>
                    <p className="text-stone-500 mt-4 font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Access and manage all members registered in this branch.
                    </p>
                </div>

                <Button
                    onClick={() => router.push('/reception/registration')}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl shadow-lg shadow-emerald-900/10 px-6 h-12"
                >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Register New Member
                </Button>
            </div>

            <Card className="border-green-200 bg-white/50 backdrop-blur-xl shadow-sm border-none ring-1 ring-green-200">
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between border-b border-green-100 gap-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-stone-900">
                        <ShieldCheck className="w-5 h-5 text-emerald-800" />
                        Registry
                    </CardTitle>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                            placeholder="Find by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 rounded-xl border-green-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 bg-white"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-emerald-800 animate-spin" />
                            <p className="text-stone-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Registry...</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={filteredMembers} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
