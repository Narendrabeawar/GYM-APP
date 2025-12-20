'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    Users,
    Search,
    Loader2,
    Mail,
    Phone,
    Calendar,
    MoreHorizontal,
    ShieldCheck,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
// Card removed - rendering table outside card

type Member = {
    id: string
    full_name: string
    email: string
    phone: string
    status: string
    membership_start_date?: string
    membership_end_date?: string
    membership_plan_id?: string
    gender: string
    created_at: string
}

export default function MembersDirectoryPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [expiredMembers, setExpiredMembers] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active')
    const [membershipPlans, setMembershipPlans] = useState<{id: string, name: string, duration_months: number, price?: number}[]>([])
    const [showRenewalModal, setShowRenewalModal] = useState(false)
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [selectedPlan, setSelectedPlan] = useState('')
    const [amountReceived, setAmountReceived] = useState('')
    const [isRenewing, setIsRenewing] = useState(false)
    const supabase = createClient()

    const fetchMembers = useCallback(async (branchId: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Failed to fetch members')
        } else {
            const now = new Date()
            const activeMembers = []
            const expiredMembers = []

            for (const member of data || []) {
                if (member.membership_end_date && new Date(member.membership_end_date) < now) {
                    expiredMembers.push(member)
                } else {
                    activeMembers.push(member)
                }
            }

            setMembers(activeMembers)
            setExpiredMembers(expiredMembers)
        }
        setIsLoading(false)
    }, [supabase])

    const fetchMembershipPlans = useCallback(async (gymId?: string) => {
        try {
            let query = supabase.from('membership_plans').select('id, name, duration_months, price').eq('status', 'active')
            if (gymId) {
                query = query.eq('gym_id', gymId)
            } else {
                query = query.is('gym_id', null)
            }

            const { data: plans, error } = await query
            if (!error && plans && plans.length > 0) {
                setMembershipPlans(plans)
                return
            }

            // fallback: fetch any active plans regardless of gym_id
            const { data: anyPlans, error: anyErr } = await supabase
                .from('membership_plans')
                .select('id, name, duration_months, price')
                .eq('status', 'active')
            if (!anyErr) setMembershipPlans(anyPlans || [])
        } catch (err) {
            console.error('Failed to load membership plans (fallback):', err)
        }
    }, [supabase])

    useEffect(() => {
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.branch_id) {
                await fetchMembers(user.user_metadata.branch_id)
            }

            // fetch membership plans for this user's gym (if available in metadata) or via profiles
            try {
                let gymId = user?.user_metadata?.gym_id
                if (!gymId && user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('gym_id')
                        .eq('id', user.id)
                        .single()
                    gymId = profile?.gym_id
                }
                if (gymId) {
                    const { data: plans } = await supabase
                        .from('membership_plans')
                        .select('id, name, duration_months, price')
                        .eq('gym_id', gymId)
                        .eq('status', 'active')
                    if (plans && plans.length > 0) {
                        setMembershipPlans(plans)
                    } else {
                        await fetchMembershipPlans()
                    }
                } else {
                    await fetchMembershipPlans()
                }
            } catch (err) {
                console.error('Failed to load membership plans', err)
            }
            // mark mounted after initial fetch to avoid SSR issues
            setMounted(true)
        }
        getSession()
    }, [supabase, fetchMembers, fetchMembershipPlans])

    const filteredMembers = useMemo(() => {
        const memberList = activeTab === 'active' ? members : expiredMembers
        return memberList.filter(member =>
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.phone?.includes(searchQuery) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [members, expiredMembers, searchQuery, activeTab])

    const handleRenewal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMember || !selectedPlan || !amountReceived) {
            toast.error('Please select a plan and enter the amount received.')
            return
        }

        setIsRenewing(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('User not authenticated.')
                return
            }

            const selectedMembershipPlan = membershipPlans.find(plan => plan.id === selectedPlan)
            if (!selectedMembershipPlan) {
                toast.error('Selected membership plan not found.')
                return
            }

            // Calculate new membership dates
            const membershipStartDate = new Date()
            const membershipEndDate = new Date()
            membershipEndDate.setMonth(membershipEndDate.getMonth() + selectedMembershipPlan.duration_months)

            // Update member with new membership details
            const { error: updateError } = await supabase
                .from('members')
                .update({
                    membership_plan_id: selectedPlan,
                    membership_start_date: membershipStartDate.toISOString().split('T')[0],
                    membership_end_date: membershipEndDate.toISOString().split('T')[0],
                    status: 'active',
                })
                .eq('id', selectedMember.id)

            if (updateError) throw updateError

            // Record payment
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    gym_id: user.user_metadata?.gym_id,
                    member_id: selectedMember.id,
                    amount: parseFloat(amountReceived),
                    payment_method: 'cash',
                    payment_type: 'membership',
                    status: 'completed',
                    description: `Membership renewal for ${selectedMembershipPlan.name}`,
                })

            if (paymentError) {
                console.error('Payment recording failed:', paymentError)
                toast.warning('Member renewed but payment recording failed')
            } else {
                toast.success('Member renewed successfully!')
            }

            // Refresh data
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (currentUser?.user_metadata?.branch_id) {
                await fetchMembers(currentUser.user_metadata.branch_id)
            }

            // Reset modal
            setShowRenewalModal(false)
            setSelectedMember(null)
            setSelectedPlan('')
            setAmountReceived('')

        } catch (error) {
            console.error('Renewal error:', error)
            toast.error('Failed to renew membership')
        } finally {
            setIsRenewing(false)
        }
    }

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
                const endVal = row.original.membership_end_date as string | undefined
                const isExpired = endVal ? (new Date(endVal) < new Date()) : false

                // Display label: show friendly text for expired/inactive
                const displayLabel = isExpired || status === 'inactive' ? 'Subscription Expired' : (status || 'active')

                const badgeClasses = displayLabel === 'active'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : displayLabel === 'Subscription Expired'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'

                return (
                    <Badge
                        variant="outline"
                        className={`capitalize font-bold rounded-lg border-2 ${badgeClasses}`}
                    >
                        {displayLabel}
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
            accessorKey: 'membership_end_date',
            header: 'Subscription Till',
            cell: ({ row }) => {
                const endVal = row.getValue('membership_end_date') as string | undefined
                if (endVal) {
                    return <span className="text-stone-700 font-medium">{new Date(endVal).toLocaleDateString()}</span>
                }
                // try to compute from start date + plan duration
                const startVal = row.original.membership_start_date
                const planId = row.original.membership_plan_id
                if (startVal && planId) {
                    const plan = membershipPlans.find(p => p.id === planId)
                    if (plan) {
                        const d = new Date(startVal)
                        d.setMonth(d.getMonth() + (plan.duration_months || 0))
                        return <span className="text-stone-700 font-medium">{d.toLocaleDateString()}</span>
                    }
                }
                return <span className="text-stone-500">-</span>
            },
            size: 160,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const member = row.original
                const isExpired = activeTab === 'expired' || (member.membership_end_date && new Date(member.membership_end_date) < new Date())

                return (
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
                            {isExpired && (
                                <DropdownMenuItem
                                    className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-orange-50 text-orange-700 font-medium"
                                    onClick={async () => {
                                        // Open renewal modal and ensure plans are loaded
                                        setSelectedMember(member)
                                        try {
                                            const { data: { user } } = await supabase.auth.getUser()
                                            let gymId = user?.user_metadata?.gym_id
                                            if (!gymId && user) {
                                                const { data: profile } = await supabase
                                                    .from('profiles')
                                                    .select('gym_id')
                                                    .eq('id', user.id)
                                                    .single()
                                                gymId = profile?.gym_id
                                            }
                                            await fetchMembershipPlans(gymId)
                                        } catch (err) {
                                            console.error('Failed to load plans before opening modal:', err)
                                        }
                                        setShowRenewalModal(true)
                                    }}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Renew Membership
                                </DropdownMenuItem>
                            )}
                    </DropdownMenuContent>
                </DropdownMenu>
                )
            },
        },
    ], [membershipPlans])

    if (!mounted) return null

    return (
        <div className="space-y-6 -mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent underline decoration-emerald-200 decoration-4 underline-offset-8">
                        Members Management
                    </h1>
                    <p className="text-stone-500 mt-4 font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Access and manage all members registered in this branch.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {expiredMembers.length > 0 && (
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2 rounded-xl border border-red-200">
                            <div className="text-sm text-red-600 font-medium">Expired</div>
                            <div className="text-lg font-bold text-red-800">{expiredMembers.length}</div>
                        </div>
                    )}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-xl border border-emerald-200">
                        <div className="text-sm text-emerald-600 font-medium">Active</div>
                        <div className="text-lg font-bold text-emerald-800">{members.length}</div>
                    </div>
                </div>

                {/* Register New Member button removed per request */}
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'expired')} className="w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                        <TabsTrigger
                            value="active"
                            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-800 data-[state=active]:to-teal-800 data-[state=active]:text-white"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Active ({members.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="expired"
                            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-800 data-[state=active]:to-red-800 data-[state=active]:text-white"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Expired ({expiredMembers.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                            placeholder="Find by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 rounded-xl border-green-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 bg-white"
                        />
                    </div>
            </div>

                <TabsContent value="active" className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-emerald-800 animate-spin" />
                            <p className="text-stone-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Registry...</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={filteredMembers} />
                    )}
                </TabsContent>

                <TabsContent value="expired" className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-emerald-800 animate-spin" />
                            <p className="text-stone-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Registry...</p>
                        </div>
                    ) : filteredMembers.length > 0 ? (
                        <DataTable columns={columns} data={filteredMembers} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                            </div>
                            <p className="text-stone-600 font-medium">All memberships are active! 🎉</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Renewal Modal */}
            <Dialog open={showRenewalModal} onOpenChange={setShowRenewalModal}>
                <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl border-none shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                            Renew Membership
                        </DialogTitle>
                        <DialogDescription className="text-stone-500">
                            Renew membership for {selectedMember?.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRenewal} className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="renewalPlan" className="text-stone-700 font-medium">Membership Plan</Label>
                            <select
                                id="renewalPlan"
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                                className="w-full h-11 rounded-xl border border-stone-200 px-3 bg-white focus:border-emerald-500 focus:ring-emerald-500"
                                required
                            >
                                <option value="">Select a plan</option>
                                {membershipPlans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} ({plan.duration_months} months){plan.price ? ` - ₹${plan.price}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="renewalAmount" className="text-stone-700 font-medium">Amount Received</Label>
                            <Input
                                id="renewalAmount"
                                type="number"
                                placeholder="Enter amount received"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                required
                                className="h-11 rounded-xl border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>
                        <DialogFooter className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowRenewalModal(false)}
                                className="border-stone-200 text-stone-700 hover:bg-stone-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isRenewing}
                                className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg"
                            >
                                {isRenewing ? 'Renewing...' : 'Renew Membership'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
