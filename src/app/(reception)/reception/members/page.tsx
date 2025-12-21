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
    Clock,
    RotateCcw,
    MessageSquare,
    Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from '@/components/ui/alert-dialog'
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
import MemberProfileModal from '@/components/MemberProfileModal'
// Card removed - rendering table outside card

type Member = {
    id: string
    user_id?: string
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
    const [expiringSoonMembers, setExpiringSoonMembers] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'active' | 'expired' | 'expiring-soon'>('active')
    const [membershipPlans, setMembershipPlans] = useState<{id: string, name: string, duration_months: number, price?: number, discount_amount?: number}[]>([])
    const [showRenewalModal, setShowRenewalModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [selectedPlan, setSelectedPlan] = useState('')
    const [amountReceived, setAmountReceived] = useState('')
    const [differenceAction, setDifferenceAction] = useState('')
    const [isRenewing, setIsRenewing] = useState(false)
    const [isExtension, setIsExtension] = useState(false)
    const [isActiveMemberExtension, setIsActiveMemberExtension] = useState(false)
    const [alertOpen, setAlertOpen] = useState(false)
    const [alertMsg, setAlertMsg] = useState('')
    // Edit form states
    const [editForm, setEditForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        gender: '',
        address: ''
    })
    const [selectedMembers, setSelectedMembers] = useState<Member[]>([])
    const [selectAll, setSelectAll] = useState(false)
    const supabase = createClient()
    const formatDate = (input?: string | Date | null) => {
        if (!input) return 'N/A'
        const date = new Date(input)
        const dd = String(date.getDate()).padStart(2, '0')
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const yyyy = date.getFullYear()
        return `${dd}/${mm}/${yyyy}`
    }

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
            const fifteenDaysFromNow = new Date()
            fifteenDaysFromNow.setDate(now.getDate() + 15)

            const activeMembers = []
            const expiredMembers = []
            const expiringSoonMembers = []

            for (const member of data || []) {
                const endDate = member.membership_end_date ? new Date(member.membership_end_date) : null

                if (endDate && endDate < now) {
                    expiredMembers.push(member)
                } else if (endDate && endDate <= fifteenDaysFromNow && endDate >= now) {
                    expiringSoonMembers.push(member)
                } else {
                    activeMembers.push(member)
                }
            }

            setMembers(activeMembers)
            setExpiredMembers(expiredMembers)
            setExpiringSoonMembers(expiringSoonMembers)
        }
        setIsLoading(false)
    }, [supabase])

    const fetchMembershipPlans = useCallback(async (gymId?: string) => {
        try {
            let query = supabase.from('membership_plans').select('id, name, duration_months, price, discount_amount').eq('status', 'active')
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

    // Reset selection when tab changes
    useEffect(() => {
        setSelectedMembers([])
        setSelectAll(false)
    }, [activeTab])

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
        const memberList = activeTab === 'active' ? members : activeTab === 'expired' ? expiredMembers : expiringSoonMembers
        return memberList.filter(member =>
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.phone?.includes(searchQuery) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [members, expiredMembers, expiringSoonMembers, searchQuery, activeTab])

    const handleRefresh = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.branch_id) {
            await fetchMembers(user.user_metadata.branch_id)
            // Reset selections after refresh
            setSelectedMembers([])
            setSelectAll(false)
        }
    }

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
            const now = new Date()
            const memberEndDate = selectedMember.membership_end_date ? new Date(selectedMember.membership_end_date) : null
            const isExpiringSoon = memberEndDate && memberEndDate >= now && memberEndDate <= new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)

            let membershipStartDate = new Date()
            let membershipEndDate = new Date()

            if (isActiveMemberExtension && memberEndDate) {
                // For active members extending membership, keep current start date and extend from current end date
                membershipStartDate = new Date(selectedMember.membership_start_date || now)
                membershipEndDate = new Date(memberEndDate)
                membershipEndDate.setMonth(membershipEndDate.getMonth() + selectedMembershipPlan.duration_months)
            } else if (isExpiringSoon && memberEndDate) {
                // For expiring soon members, add remaining days to new subscription
                const remainingDays = Math.ceil((memberEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const newPlanDays = selectedMembershipPlan.duration_months * 30 // Approximate days in a month

                membershipEndDate.setDate(membershipStartDate.getDate() + remainingDays + newPlanDays)
            } else {
                // Regular renewal for expired members
                membershipEndDate.setMonth(membershipEndDate.getMonth() + selectedMembershipPlan.duration_months)
            }

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
            let paymentDescription = `Membership renewal for ${selectedMembershipPlan.name}`
            if (isActiveMemberExtension) {
                paymentDescription = `Membership extension for ${selectedMembershipPlan.name} (extended from current end date)`
            } else if (isExpiringSoon) {
                paymentDescription = `Membership extension for ${selectedMembershipPlan.name} (remaining days added)`
            }

            const basePrice = selectedMembershipPlan.price || 0
            const planDiscountAmount = selectedMembershipPlan.discount_amount || 0
            const finalPayableAmount = Math.max(0, basePrice - planDiscountAmount)
            const receivedAmount = parseFloat(amountReceived || '0')

            if (receivedAmount > finalPayableAmount) {
                setAlertMsg('Amount cannot exceed final payable amount')
                setAlertOpen(true)
                setIsRenewing(false)
                return
            }

            let paymentStatus: 'completed' | 'pending' = 'completed'
            const difference = Number((receivedAmount - finalPayableAmount).toFixed(2))

            let discountApplied = 0
            let dueAmount = 0
            let extraAmount = 0

            if (difference < 0) {
                const remaining = Math.abs(difference)
                if (!differenceAction) {
                    toast.error('Select how to handle the remaining amount.')
                    return
                }

                if (differenceAction === 'discount') {
                    paymentDescription += ` | Additional discount ₹${remaining}`
                    discountApplied = remaining
                } else if (differenceAction === 'due') {
                    paymentStatus = 'pending'
                    paymentDescription += ` | Amount due ₹${remaining}`
                    dueAmount = remaining
                }
            } else if (difference > 0) {
                const extra = difference
                if (!differenceAction) {
                    toast.error('Select how to handle the extra amount.')
                    return
                }

                if (differenceAction === 'extra_keep') {
                    paymentDescription += ` | Extra received ₹${extra}`
                    extraAmount = extra
                } else if (differenceAction === 'extra_adjust') {
                    paymentDescription += ` | Adjusted with extra ₹${extra}`
                    extraAmount = extra
                }
            }

            // Get profile to ensure branch_id and gym_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('gym_id, branch_id')
                .eq('id', user.id)
                .single()

            if (!profile?.gym_id) {
                toast.error('No gym associated with your account.')
                return
            }

            // Store only numeric value for extra_discount (or 0 if none)
            const extraDiscountValue = discountApplied > 0 ? discountApplied : 0

            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    gym_id: profile.gym_id,
                    branch_id: profile.branch_id || null,
                    member_id: selectedMember.id,
                    amount: receivedAmount,
                    payable_amount: finalPayableAmount,
                    discount_amount: planDiscountAmount,
                    due_amount: dueAmount,
                    extra_amount: extraAmount,
                    payment_method: 'cash',
                    extra_discount: extraDiscountValue,
                    status: paymentStatus,
                    description: paymentDescription,
                })

            if (paymentError) {
                console.error('Payment recording failed:', paymentError)
                toast.warning('Member membership updated but payment recording failed')
            } else {
                if (isActiveMemberExtension) {
                    toast.success('Member membership extended successfully!')
                } else if (isExpiringSoon) {
                    toast.success('Member subscription extended successfully!')
                } else {
                    toast.success('Member renewed successfully!')
                }
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
            setDifferenceAction('')
            setIsExtension(false)
            setIsActiveMemberExtension(false)

        } catch (error) {
            console.error('Renewal error:', error)
            toast.error('Failed to renew membership')
        } finally {
            setIsRenewing(false)
        }
    }

    const handleEditMember = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMember) {
            toast.error('No member selected')
            return
        }

        setIsRenewing(true)

        try {
            const { error } = await supabase
                .from('members')
                .update({
                    full_name: editForm.full_name,
                    phone: editForm.phone,
                    email: editForm.email || null,
                    gender: editForm.gender,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedMember.id)

            if (error) throw error

            // If address is provided, update the profile as well (if user exists)
            if (editForm.address && selectedMember.user_id) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        address: editForm.address,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedMember.user_id)

                if (profileError) {
                    console.warn('Failed to update profile address:', profileError)
                }
            }

            toast.success('Member details updated successfully!')

            // Refresh data
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.branch_id) {
                await fetchMembers(user.user_metadata.branch_id)
            }

            // Reset modal
            setShowEditModal(false)
            setSelectedMember(null)
            setEditForm({
                full_name: '',
                phone: '',
                email: '',
                gender: '',
                address: ''
            })

        } catch (error) {
            console.error('Edit member error:', error)
            toast.error('Failed to update member details')
        } finally {
            setIsRenewing(false)
        }
    }

    const handleMemberSelect = (member: Member, checked: boolean) => {
        if (checked) {
            setSelectedMembers(prev => [...prev, member])
        } else {
            setSelectedMembers(prev => prev.filter(m => m.id !== member.id))
        }
    }

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked)
        if (checked) {
            setSelectedMembers(expiringSoonMembers)
        } else {
            setSelectedMembers([])
        }
    }

    const generateWhatsAppMessage = async (member: Member) => {
        const endDate = member.membership_end_date ? new Date(member.membership_end_date) : null
        const now = new Date()
        const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0

        const { data: { user } } = await supabase.auth.getUser()
        const gymName = user?.user_metadata?.gym_name || 'Your Gym'

        const message = `Dear ${member.full_name},

Your gym membership is expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.

Please renew your membership to continue enjoying our services.

Best regards,
${gymName}`

        return encodeURIComponent(message)
    }

    const formatPhoneForWa = async (rawPhone?: string) => {
        if (!rawPhone) return null
        // Remove all non-digit characters
        let cleaned = rawPhone.replace(/\D/g, '')
        // Remove leading zeros
        cleaned = cleaned.replace(/^0+/, '')

        // Try to get default country code from user metadata, fallback to '91'
        let defaultCountry = '91'
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const metaCode = user?.user_metadata?.country_code || user?.user_metadata?.country || user?.user_metadata?.gym_country_code
            if (metaCode) defaultCountry = String(metaCode).replace(/\D/g, '') || defaultCountry
        } catch (err) {
            // ignore - use fallback
        }

        // If number looks like a local 10-digit number, prepend country code
        if (cleaned.length === 10) {
            cleaned = defaultCountry + cleaned
        }

        // Final validation: wa.me expects digits only, international format without '+' and length between 8-15
        if (!/^\d{8,15}$/.test(cleaned)) return null
        return cleaned
    }

    const sendWhatsAppMessage = async (member: Member) => {
        const phoneNumber = await formatPhoneForWa(member.phone)
        if (!phoneNumber) {
            toast.error(`Phone number invalid or not available for ${member.full_name}`)
            return
        }

        const message = await generateWhatsAppMessage(member)
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

        window.open(whatsappUrl, '_blank')
    }

    const sendBulkWhatsAppMessages = () => {
        if (selectedMembers.length === 0) {
            toast.error('Please select members to send messages')
            return
        }

        selectedMembers.forEach((member, index) => {
            setTimeout(() => {
                sendWhatsAppMessage(member)
            }, index * 1000) // 1 second delay between messages
        })

        toast.success(`Opening WhatsApp for ${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''}`)
        setSelectedMembers([])
        setSelectAll(false)
    }

    const columns = useMemo<ColumnDef<Member>[]>(() => {
        const baseColumns: ColumnDef<Member>[] = [
            // Add checkbox column for expiring soon tab
            ...(activeTab === 'expiring-soon' ? [{
                id: 'select',
                header: () => (
                    <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                    />
                ),
                cell: ({ row }: { row: { original: Member } }) => {
                    const member = row.original
                    const isSelected = selectedMembers.some(m => m.id === member.id)
                    return (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleMemberSelect(member, e.target.checked)}
                            className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                        />
                    )
                },
                size: 50,
            }] : []),
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
                size: 120,
                cell: ({ row }) => {
                    const status = row.getValue('status') as string
                    const endVal = row.original.membership_end_date as string | undefined
                    const endDate = endVal ? new Date(endVal) : null
                    const now = new Date()
                    const isExpired = endDate ? endDate < now : false
                    const daysUntilExpiry = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

                    // Display label: show friendly text for expired/inactive
                    let displayLabel = isExpired || status === 'inactive' ? 'Subscription Expired' : (status || 'active')

                    // For expiring soon members, show days remaining
                    if (!isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 15 && daysUntilExpiry >= 0) {
                        displayLabel = `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left`
                    }

                    const badgeClasses = displayLabel === 'active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : displayLabel.includes('days left') || displayLabel.includes('day left')
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
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
                        <span>{formatDate(row.getValue('membership_start_date'))}</span>
                    </div>
                ),
            },
            {
                accessorKey: 'membership_end_date',
                header: 'Subscription Till',
                cell: ({ row }) => {
                    const endVal = row.getValue('membership_end_date') as string | undefined
                    if (endVal) {
                        return <span className="text-stone-700 font-medium">{formatDate(endVal)}</span>
                    }
                    // try to compute from start date + plan duration
                    const startVal = row.original.membership_start_date
                    const planId = row.original.membership_plan_id
                    if (startVal && planId) {
                        const plan = membershipPlans.find(p => p.id === planId)
                        if (plan) {
                            const d = new Date(startVal)
                            d.setMonth(d.getMonth() + (plan.duration_months || 0))
                            return <span className="text-stone-700 font-medium">{formatDate(d)}</span>
                        }
                    }
                    return <span className="text-stone-500">-</span>
                },
                size: 160,
            },
        ]

        // Add "Last Renewed" column only for active tab
        if (activeTab === 'active') {
            baseColumns.splice(5, 0, {
                id: 'last_renewed',
                header: 'Last Renewed',
                cell: ({ row }) => {
                    const startVal = row.original.membership_start_date
                    const planId = row.original.membership_plan_id

                    if (startVal && planId) {
                        const plan = membershipPlans.find(p => p.id === planId)
                        if (plan) {
                            const renewalDate = formatDate(startVal)
                            const duration = `${plan.duration_months} month${plan.duration_months !== 1 ? 's' : ''}`
                            return (
                                <div className="flex flex-col text-stone-600">
                                    <span className="font-medium">{renewalDate}</span>
                                    <span className="text-xs text-stone-500">({duration})</span>
                                </div>
                            )
                        }
                    }
                    return <span className="text-stone-500">-</span>
                },
                size: 140,
            })
        }

        // Add actions column
        baseColumns.push({
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const member = row.original
                const isExpired = activeTab === 'expired' || (member.membership_end_date && new Date(member.membership_end_date) < new Date())
                const isExpiringSoon = activeTab === 'expiring-soon' || (member.membership_end_date && (() => {
                    const endDate = new Date(member.membership_end_date)
                    const now = new Date()
                    const fifteenDaysFromNow = new Date()
                    fifteenDaysFromNow.setDate(now.getDate() + 15)
                    return endDate >= now && endDate <= fifteenDaysFromNow
                })())

                return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4 text-stone-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-40 p-1">
                        <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold uppercase">Manage</DropdownMenuLabel>
                        <DropdownMenuItem
                            className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700"
                            onClick={() => {
                                setSelectedMember(member)
                                setShowViewModal(true)
                            }}
                        >
                            View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700 font-medium"
                            onClick={() => {
                                setSelectedMember(member)
                                setEditForm({
                                    full_name: member.full_name || '',
                                    phone: member.phone || '',
                                    email: member.email || '',
                                    gender: member.gender || '',
                                    address: '' // We'll need to fetch this from profiles if needed
                                })
                                setShowEditModal(true)
                            }}
                        >
                            Edit Details
                        </DropdownMenuItem>
                        {activeTab === 'active' && !isExpired && !isExpiringSoon && (
                            <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-blue-50 text-blue-700 font-medium"
                                onClick={async () => {
                                    // Open extension modal for active members
                                    setSelectedMember(member)
                                    setIsExtension(true)
                                    setIsActiveMemberExtension(true)
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
                                <RotateCcw className="w-4 h-4" />
                                Extend Membership
                            </DropdownMenuItem>
                        )}
                        {isExpiringSoon && (
                            <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-green-50 text-green-700 font-medium"
                                onClick={() => sendWhatsAppMessage(member)}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Send WhatsApp
                            </DropdownMenuItem>
                        )}
                            {(isExpired || isExpiringSoon) && (
                                <DropdownMenuItem
                                    className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-orange-50 text-orange-700 font-medium"
                                    onClick={async () => {
                                        // Open renewal modal and ensure plans are loaded
                                        setSelectedMember(member)
                                        // Check if this is an extension (for expiring soon members)
                                        const memberEndDate = member.membership_end_date ? new Date(member.membership_end_date) : null
                                        const now = new Date()
                                        const isExpiringSoonCheck = memberEndDate && memberEndDate >= now && memberEndDate <= new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
                                        setIsExtension(isExpiringSoonCheck || false)
                                        setIsActiveMemberExtension(false)
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
        })

        return baseColumns
    }, [membershipPlans, activeTab])

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
                    {expiringSoonMembers.length > 0 && (
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-2 rounded-xl border border-amber-200">
                            <div className="text-sm text-amber-600 font-medium">Expiring Soon</div>
                            <div className="text-lg font-bold text-amber-800">{expiringSoonMembers.length}</div>
                        </div>
                    )}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-xl border border-emerald-200">
                        <div className="text-sm text-emerald-600 font-medium">Active</div>
                        <div className="text-lg font-bold text-emerald-800">{members.length}</div>
                    </div>
                </div>

                {/* Register New Member button removed per request */}
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'expired' | 'expiring-soon')} className="w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                        <TabsTrigger
                            value="active"
                            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-800 data-[state=active]:to-teal-800 data-[state=active]:text-white"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Active ({members.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="expiring-soon"
                            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-800 data-[state=active]:to-yellow-800 data-[state=active]:text-white"
                        >
                            <Clock className="w-4 h-4" />
                            Expiring Soon ({expiringSoonMembers.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="expired"
                            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-800 data-[state=active]:to-red-800 data-[state=active]:text-white"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Expired ({expiredMembers.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <Input
                                placeholder="Find by name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 rounded-xl border-green-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 bg-white"
                            />
                        </div>
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            className="h-10 px-3 rounded-xl border-stone-200 hover:bg-stone-50"
                            disabled={isLoading}
                        >
                            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
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

                <TabsContent value="expiring-soon" className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-amber-800 animate-spin" />
                            <p className="text-stone-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Registry...</p>
                        </div>
                    ) : filteredMembers.length > 0 ? (
                        <div className="space-y-4">
                            {/* Bulk WhatsApp Actions */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-200">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-amber-600" />
                                        <span className="font-medium text-amber-800">
                                            {selectedMembers.length} of {filteredMembers.length} selected
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedMembers.length > 0 && (
                                        <Button
                                            onClick={() => setSelectedMembers([])}
                                            variant="outline"
                                            size="sm"
                                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                        >
                                            Clear Selection
                                        </Button>
                                    )}
                                    <Button
                                        onClick={sendBulkWhatsAppMessages}
                                        disabled={selectedMembers.length === 0}
                                        size="sm"
                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Send WhatsApp ({selectedMembers.length})
                                    </Button>
                                </div>
                            </div>
                            <DataTable columns={columns} data={filteredMembers} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center">
                                <Clock className="w-8 h-8 text-amber-600" />
                            </div>
                            <p className="text-stone-600 font-medium">No memberships expiring soon! 🎉</p>
                        </div>
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
                            {isExtension ? 'Extend Membership' : 'Renew Membership'}
                        </DialogTitle>
                        <DialogDescription className="text-stone-500">
                            {isActiveMemberExtension
                                ? `Extend membership for ${selectedMember?.full_name} (will be added to current membership end date)`
                                : isExtension
                                ? `Extend membership for ${selectedMember?.full_name} (remaining days will be added to new subscription)`
                                : `Renew membership for ${selectedMember?.full_name}`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRenewal} className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="renewalPlan" className="text-stone-700 font-medium">Membership Plan</Label>
                            <select
                                id="renewalPlan"
                                value={selectedPlan}
                                onChange={(e) => {
                                    const planId = e.target.value
                                    setSelectedPlan(planId)
                                    // Auto-fill amount received with final payable amount
                                    if (planId) {
                                        const plan = membershipPlans.find(p => p.id === planId)
                                        if (plan) {
                                            const discount = plan.discount_amount || 0
                                            const basePrice = plan.price || 0
                                            const finalAmount = Math.max(0, basePrice - discount)
                                            setAmountReceived(finalAmount.toString())
                                        }
                                    } else {
                                        setAmountReceived('')
                                    }
                                }}
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
                        {selectedPlan && (() => {
                            const plan = membershipPlans.find(p => p.id === selectedPlan)
                            if (!plan) return null
                            const discount = plan.discount_amount || 0
                            const basePrice = plan.price || 0
                            const finalAmount = Math.max(0, basePrice - discount)
                            
                            return (
                                <>
                                    {discount > 0 && (
                                        <div className="grid gap-2">
                                            <Label className="text-stone-700 font-medium">Discount</Label>
                                            <div className="h-11 rounded-xl border border-stone-200 px-3 bg-stone-50 flex items-center">
                                                <span className="text-stone-900 font-semibold">₹{discount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label className="text-stone-700 font-medium">Final Payable Amount</Label>
                                        <div className="h-11 rounded-xl px-3 bg-emerald-50 border border-emerald-200 flex items-center">
                                            <span className="text-emerald-800 font-bold text-lg">₹{finalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </>
                            )
                        })()}
                        <div className="grid gap-2">
                            <Label htmlFor="renewalAmount" className="text-stone-700 font-medium">Amount Received</Label>
                            <Input
                                id="renewalAmount"
                                type="number"
                                placeholder="Enter amount received"
                                value={amountReceived}
                                onChange={(e) => {
                                    const raw = e.target.value
                                    const entered = parseFloat(raw || '0')
                                    if (Number.isNaN(entered)) {
                                        setAmountReceived('')
                                        return
                                    }
                                    const plan = membershipPlans.find(p => p.id === selectedPlan)
                                    const basePrice = plan?.price || 0
                                    const discount = plan?.discount_amount || 0
                                    const finalAmount = Math.max(0, basePrice - discount)
                                    if (entered > finalAmount) {
                                        setAlertMsg('Amount cannot exceed final payable amount')
                                        setAlertOpen(true)
                                        setAmountReceived(finalAmount.toString())
                                        return
                                    }
                                    if (entered < 0) {
                                        setAmountReceived('0')
                                        return
                                    }
                                    setAmountReceived(raw)
                                }}
                                required
                                className="h-11 rounded-xl border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>
                        {selectedPlan && amountReceived && (() => {
                            const plan = membershipPlans.find(p => p.id === selectedPlan)
                            if (!plan) return null
                            
                            const basePrice = plan.price || 0
                            const discount = plan.discount_amount || 0
                            const finalAmount = Math.max(0, basePrice - discount)
                            const receivedAmount = parseFloat(amountReceived || '0')
                            const difference = receivedAmount - finalAmount
                            
                            if (Math.abs(difference) < 0.01) return null
                            
                            return (
                                <div className="grid gap-2">
                                    <Label className="text-stone-700 font-medium">
                                        {difference < 0 ? 'Remaining Amount' : 'Extra Amount'} (₹{Math.abs(difference).toFixed(2)})
                                    </Label>
                                    <select
                                        value={differenceAction}
                                        onChange={(e) => setDifferenceAction(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-stone-200 px-3 bg-white focus:border-emerald-500 focus:ring-emerald-500"
                                        required
                                    >
                                        <option value="">Select how to handle</option>
                                        {difference < 0 ? (
                                            <>
                                                <option value="discount">Treat remaining as additional discount</option>
                                                <option value="due">Mark remaining as amount due (to be paid later)</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="extra_keep">Keep extra as received</option>
                                                <option value="extra_adjust">Adjust/credit extra amount</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            )
                        })()}
                        <DialogFooter className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowRenewalModal(false)
                                    setSelectedPlan('')
                                    setAmountReceived('')
                                    setDifferenceAction('')
                                }}
                                className="border-stone-200 text-stone-700 hover:bg-stone-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isRenewing || alertOpen}
                                className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg"
                            >
                                {isRenewing ? (isExtension ? 'Extending...' : 'Renewing...') : (isExtension ? 'Extend Membership' : 'Renew Membership')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Amount Alert Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent className="bg-white rounded-xl border-green-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Invalid Amount</AlertDialogTitle>
                        <AlertDialogDescription>{alertMsg}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertOpen(false)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Profile Modal - Using Reusable Component */}
            <MemberProfileModal 
                isOpen={showViewModal} 
                onClose={() => setShowViewModal(false)} 
                member={selectedMember} 
            />

            {/* Edit Details Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl border-none shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                            Edit Member Details
                        </DialogTitle>
                        <DialogDescription className="text-stone-500">
                            Update information for {selectedMember?.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditMember} className="grid gap-6 py-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="editFullName" className="text-stone-700 font-medium">Full Name</Label>
                                <Input
                                    id="editFullName"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                                    className="h-11 rounded-xl border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editPhone" className="text-stone-700 font-medium">Phone</Label>
                                <Input
                                    id="editPhone"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="h-11 rounded-xl border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editEmail" className="text-stone-700 font-medium">Email</Label>
                                <Input
                                    id="editEmail"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="h-11 rounded-xl border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editGender" className="text-stone-700 font-medium">Gender</Label>
                                <select
                                    id="editGender"
                                    value={editForm.gender}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                                    className="w-full h-11 rounded-xl border border-stone-200 px-3 bg-white focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editAddress" className="text-stone-700 font-medium">Address</Label>
                                <textarea
                                    id="editAddress"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full h-20 rounded-xl border border-stone-200 px-3 py-2 bg-white focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                                    placeholder="Enter address"
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowEditModal(false)}
                                className="border-stone-200 text-stone-700 hover:bg-stone-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isRenewing}
                                className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg"
                            >
                                {isRenewing ? 'Updating...' : 'Update Member'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
