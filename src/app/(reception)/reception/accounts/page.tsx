'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Wallet,
    Search,
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Calendar,
    Download,
    Filter,
    Plus,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownLeft,
    PieChart,
    CreditCard,
    Check,
    ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
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
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import MemberLedger from '@/components/MemberLedger'
import CollectDuesDialog from '@/components/CollectDuesDialog'

type Transaction = {
    id: string
    date: string
    type: 'income' | 'expense'
    category: string
    amount: number
    payment_method: string
    status: 'completed' | 'pending' | 'failed'
    description: string
    reference_name: string // Member Name or Vendor Name
}

// No mock data needed for DB-wired version

export default function AccountsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense' | 'dues' | 'member-ledger'>('all')
    const [mounted, setMounted] = useState(false)
    const [branchId, setBranchId] = useState<string | null>(null)
    const [gymId, setGymId] = useState<string | null>(null)
    const [membersList, setMembersList] = useState<{ id: string, full_name: string, phone?: string }[]>([])
    const [filterMemberId, setFilterMemberId] = useState<string | null>(null)
    const [filterStartDate, setFilterStartDate] = useState<string | null>(null)
    const [filterEndDate, setFilterEndDate] = useState<string | null>(null)
    const [memberFilterInput, setMemberFilterInput] = useState('')
    const [memberFilterFocused, setMemberFilterFocused] = useState(false)
    const [pendingMembers, setPendingMembers] = useState<{ member_id: string, full_name: string, phone: string, net_balance: number }[]>([])
    const [isCollectOpen, setIsCollectOpen] = useState(false)
    const [collectMemberId, setCollectMemberId] = useState<string | null>(null)
    const [collectMemberName, setCollectMemberName] = useState<string | null>(null)

    // Columns for pending members table (Sr.No, Name of Member, Remaining Amount as on Date)
    const pendingColumns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'Sr.No.',
            size: 80,
            cell: ({ row }) => <span className="font-medium text-stone-500">{row.index + 1}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Name of Member',
            cell: ({ row }) => <span className="font-bold text-stone-900">{row.getValue('name')}</span>,
        },
        {
            accessorKey: 'remaining',
            header: 'Remaining Amount as on Date',
            cell: ({ row }) => <span className="font-bold text-red-600">₹{Number(row.getValue('remaining') || 0).toLocaleString('en-IN')}</span>,
        },
    ], [])

    // Member Ledger States
    const [memberSearchQuery, setMemberSearchQuery] = useState('')
    const [foundMembers, setFoundMembers] = useState<any[]>([])
    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [isSearchingMembers, setIsSearchingMembers] = useState(false)
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isSavingTransaction, setIsSavingTransaction] = useState(false)
    const [transactionForm, setTransactionForm] = useState({
        type: 'income' as 'income' | 'expense',
        amount: '',
        category: '',
        reference_name: '',
        description: ''
    })
    const [categories, setCategories] = useState<string[]>([])
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
        fetchInitialData()
    }, [])

    const filteredMembers = useMemo(() => {
        const q = memberFilterInput.trim().toLowerCase()
        if (!q) return membersList
        return membersList.filter(m =>
            (m.full_name || '').toLowerCase().includes(q) ||
            (m.phone || '').toLowerCase().includes(q)
        )
    }, [memberFilterInput, membersList])

    const fetchInitialData = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('branch_id, gym_id')
                .eq('id', user.id)
                .single()

                if (profile) {
                setBranchId(profile.branch_id)
                setGymId(profile.gym_id)
                    // fetch members for filters
                    try {
                        const { data: mems } = await supabase
                            .from('members')
                            .select('id, full_name, phone')
                            .eq('branch_id', profile.branch_id)
                            .order('full_name')
                        if (mems) setMembersList(mems.map((m: any) => ({ id: m.id, full_name: m.full_name, phone: m.phone || '' })))
                    } catch (err) {
                        console.error('Error fetching members list', err)
                    }

                // 1. Fetch Member Payments (Income)
                const { data: payments, error: pError } = await supabase
                    .from('payments')
                    .select('*, members(full_name)')
                    .eq('branch_id', profile.branch_id)
                    .order('created_at', { ascending: false })

                // 2. Fetch Other Transactions (Income/Expense)
                const { data: transDB, error: tError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('branch_id', profile.branch_id)
                    .order('created_at', { ascending: false })

                const allTrans: Transaction[] = []

                if (!pError && payments) {
                    payments.forEach(p => {
                        allTrans.push({
                            id: p.id,
                            date: p.created_at,
                            type: 'income',
                            category: p.description || 'Member Payment',
                            amount: p.amount,
                            payment_method: p.payment_method || 'Unknown',
                            status: p.status as any,
                            description: p.description || '',
                            reference_name: p.members?.full_name || 'Anonymous Member'
                        })
                    })
                }

                if (!tError && transDB) {
                    transDB.forEach(t => {
                        allTrans.push({
                            id: t.id,
                            date: t.date || t.created_at,
                            type: t.type as any,
                            category: t.category,
                            amount: t.amount,
                            payment_method: t.payment_method || 'cash',
                            status: t.status as any,
                            description: t.description || '',
                            reference_name: t.reference_name || 'General'
                        })
                    })
                }

                // Sort combined list by date
                setTransactions(allTrans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
                // fetch pending members for this branch (net_balance > 0)
                try {
                    const { data: balances } = await supabase
                        .from('member_balances')
                        .select('member_id, net_balance, member:members!member_id (id, full_name, phone, branch_id)')
                        .gt('net_balance', 0)
                        .eq('member.branch_id', profile.branch_id)
                    if (balances) {
                        const list = balances.map((b: any) => ({
                            member_id: b.member_id,
                            full_name: b.member?.full_name || 'N/A',
                            phone: b.member?.phone || '',
                            net_balance: Number(b.net_balance || 0)
                        }))
                        setPendingMembers(list)
                    }
                } catch (err) {
                    console.error('Error fetching pending members:', err)
                }
            }
        } catch (error) {
            console.error('Error fetching initial data:', error)
        }
        setIsLoading(false)
    }

    const fetchCategories = async () => {
        if (!gymId) return
        try {
            // 1. Fetch from master categories table
            const { data: catData, error: catError } = await supabase
                .from('transaction_categories')
                .select('name')
                .eq('gym_id', gymId)

            // 2. Fetch unique categories already used in transactions (as fallback/supplement)
            const { data: transData, error: transError } = await supabase
                .from('transactions')
                .select('category')
                .eq('gym_id', gymId)

            if (catError) console.error('Error fetching master categories:', catError)
            if (transError) console.error('Error fetching terminal categories:', transError)

            let allCats: string[] = []
            if (catData) allCats = [...allCats, ...catData.map(c => c.name)]
            if (transData) allCats = [...allCats, ...transData.map(t => t.category)]

            // Remove duplicates and empty values
            const uniqueCats = Array.from(new Set(allCats.filter(Boolean)))
            setCategories(uniqueCats)
        } catch (err) {
            console.error('Unexpected error in fetchCategories:', err)
        }
    }

    useEffect(() => {
        if (isAddDialogOpen) {
            fetchCategories()
        }
    }, [isAddDialogOpen, transactionForm.type, gymId])

    const handleSaveTransaction = async () => {
        if (!gymId || !branchId || !transactionForm.amount || !transactionForm.category) {
            toast.error('Please fill all required fields')
            return
        }

        setIsSavingTransaction(true)
        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    gym_id: gymId,
                    branch_id: branchId,
                    type: transactionForm.type,
                    amount: parseFloat(transactionForm.amount),
                    category: transactionForm.category,
                    reference_name: transactionForm.reference_name,
                    description: transactionForm.description,
                    status: 'completed'
                })

            if (error) throw error

            // Also try to add the category to the categories table for future suggestions
            await supabase.from('transaction_categories').upsert({
                gym_id: gymId,
                name: transactionForm.category,
                type: transactionForm.type
            }, { onConflict: 'gym_id, name, type' })

            toast.success('Transaction saved successfully!')
            setIsAddDialogOpen(false)
            setTransactionForm({
                type: 'income',
                amount: '',
                category: '',
                reference_name: '',
                description: ''
            })
            fetchInitialData()
            fetchCategories()
        } catch (error: any) {
            toast.error(error.message || 'Failed to save transaction')
        } finally {
            setIsSavingTransaction(false)
        }
    }

    // Search members specifically for this branch
    useEffect(() => {
        const searchMembers = async () => {
            if (!branchId) return

            setIsSearchingMembers(true)
            let query = supabase
                .from('members')
                .select('id, full_name, phone')
                .eq('branch_id', branchId)

            if (memberSearchQuery.length > 0) {
                query = query.or(`full_name.ilike.%${memberSearchQuery}%,phone.ilike.%${memberSearchQuery}%`)
            } else {
                // If empty, just show recent 10 members
                query = query.order('created_at', { ascending: false })
            }

            const { data, error } = await query.limit(10)

            if (!error && data) {
                setFoundMembers(data)
            }
            setIsSearchingMembers(false)
        }

        const timer = setTimeout(searchMembers, 300)
        return () => clearTimeout(timer)
    }, [memberSearchQuery, branchId, supabase])



    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const filteredTransactions = useMemo(() => {
        let list = transactions
        if (activeTab === 'income') {
            list = transactions.filter(t => t.type === 'income')
        } else if (activeTab === 'expense') {
            list = transactions.filter(t => t.type === 'expense')
        } else if (activeTab === 'dues') {
            // show only members with pending balances (we map transactions list but filter by member selection)
            // We'll include transactions that belong to members whose net_balance > 0
            const pendingIds = new Set(pendingMembers.map(p => p.member_id))
            list = transactions.filter(t => pendingIds.has((t as any).member_id || ''))
        }

        // basic text search
        list = list.filter(t =>
            t.reference_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
        )

        // member filter: match member id -> compare with member full name in reference_name if needed
        if (filterMemberId) {
            const mem = membersList.find(m => m.id === filterMemberId)
            const memName = mem?.full_name || ''
            list = list.filter(t => {
                // payments rows may have member relation in reference_name; match either
                return (t as any).member_id === filterMemberId || t.reference_name === memName
            })
        }

        // date filters
        if (filterStartDate) {
            const start = new Date(filterStartDate + 'T00:00:00')
            list = list.filter(t => new Date(t.date) >= start)
        }
        if (filterEndDate) {
            const end = new Date(filterEndDate + 'T23:59:59')
            list = list.filter(t => new Date(t.date) <= end)
        }

        return list
    }, [transactions, searchQuery, activeTab, filterMemberId, filterStartDate, filterEndDate, pendingMembers, membersList])

    const stats = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense
        }
    }, [transactions])


    const columns: ColumnDef<Transaction>[] = [
        {
            header: 'Sr.No.',
            size: 80,
            cell: ({ row }) => <span className="font-medium text-stone-500">{row.index + 1}</span>,
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-stone-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{formatDate(row.original.date)}</span>
                </div>
            ),
        },
        {
            accessorKey: 'reference_name',
            header: 'Particulars',
            size: 250,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-stone-900 leading-none">{row.original.reference_name}</span>
                    <span className="text-[10px] text-stone-500 uppercase mt-1 font-bold tracking-tighter">
                        {row.original.category}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className={`capitalize font-bold rounded-lg border-2 ${row.original.type === 'income'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-red-200 bg-red-50 text-red-800'
                        }`}
                >
                    {row.original.type === 'income' ? (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                        <ArrowDownLeft className="w-3 h-3 mr-1" />
                    )}
                    {row.original.type}
                </Badge>
            ),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <div className={`flex items-center gap-1 font-bold ${row.original.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>{row.original.amount.toLocaleString('en-IN')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'payment_method',
            header: 'Method',
            cell: ({ row }) => (
                <span className="text-stone-600 font-medium">{row.original.payment_method}</span>
            ),
        },
    ]

    if (!mounted) return null

    return (
        <div className="space-y-6 -mt-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent underline decoration-emerald-200 decoration-4 underline-offset-8">
                        Accounts Ledger
                    </h1>
                    <p className="text-stone-500 mt-4 font-medium flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        Manage your gym's finances, tracking income and expenses.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/reception/accounts/final-accounts" className="inline-block">
                        <Button variant="outline" className="rounded-xl border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-bold border-2">
                            P&L (Final Accounts)
                        </Button>
                    </Link>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 px-6">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md bg-white rounded-2xl border-emerald-100">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-stone-900">Add New Transaction</DialogTitle>
                                <DialogDescription>Enter the details of the new income or expense.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type" className="font-bold text-stone-700">Transaction Type</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setTransactionForm({ ...transactionForm, type: 'income' })}
                                            className={`flex-1 rounded-xl border-2 font-bold transition-all ${transactionForm.type === 'income'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                                : 'border-stone-100 text-stone-400'
                                                }`}
                                        >
                                            Income
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setTransactionForm({ ...transactionForm, type: 'expense' })}
                                            className={`flex-1 rounded-xl border-2 font-bold transition-all ${transactionForm.type === 'expense'
                                                ? 'border-red-500 bg-red-50 text-red-800'
                                                : 'border-stone-100 text-stone-400'
                                                }`}
                                        >
                                            Expense
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="amount" className="font-bold text-stone-700">Amount (₹)</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="0.00"
                                            className="rounded-xl border-stone-200 pl-10"
                                            value={transactionForm.amount}
                                            onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2 relative">
                                    <Label htmlFor="category" className="font-bold text-stone-700">Category</Label>
                                    <div className="relative">
                                        <Input
                                            id="category"
                                            placeholder="e.g. Rent, Salary, Bill"
                                            className="rounded-xl border-stone-200"
                                            value={transactionForm.category}
                                            onChange={(e) => {
                                                setTransactionForm({ ...transactionForm, category: e.target.value })
                                                setIsCategoryDropdownOpen(true)
                                            }}
                                            onFocus={() => setIsCategoryDropdownOpen(true)}
                                            autoComplete="off"
                                        />
                                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {isCategoryDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-[60]"
                                                onClick={() => setIsCategoryDropdownOpen(false)}
                                            />
                                            <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white rounded-xl border-2 border-emerald-100 shadow-xl z-[70] max-h-48 overflow-y-auto overflow-x-hidden p-1">
                                                {categories
                                                    .filter(c => c.toLowerCase().includes(transactionForm.category.toLowerCase()))
                                                    .map((cat, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                setTransactionForm({ ...transactionForm, category: cat })
                                                                setIsCategoryDropdownOpen(false)
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-emerald-50 text-stone-700 font-bold text-sm transition-colors flex items-center justify-between group"
                                                        >
                                                            {cat}
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </button>
                                                    ))}

                                                {transactionForm.category && !categories.some(c => c.toLowerCase() === transactionForm.category.toLowerCase()) && (
                                                    <button
                                                        onClick={() => setIsCategoryDropdownOpen(false)}
                                                        className="w-full text-left px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Create "{transactionForm.category}"
                                                    </button>
                                                )}

                                                {categories.length === 0 && !transactionForm.category && (
                                                    <div className="px-4 py-3 text-stone-400 text-xs italic text-center">
                                                        No categories yet. Type to create one.
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="particulars" className="font-bold text-stone-700">Particulars (Optional)</Label>
                                    <Input
                                        id="particulars"
                                        placeholder="e.g. Member Name or Vendor"
                                        className="rounded-xl border-stone-200"
                                        value={transactionForm.reference_name}
                                        onChange={(e) => setTransactionForm({ ...transactionForm, reference_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="font-bold text-stone-700">Description (Optional)</Label>
                                    <Input
                                        id="description"
                                        placeholder="Add a note..."
                                        className="rounded-xl border-stone-200"
                                        value={transactionForm.description}
                                        onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    className={`w-full rounded-xl font-bold ${transactionForm.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                                        } text-white`}
                                    onClick={handleSaveTransaction}
                                    disabled={isSavingTransaction}
                                >
                                    {isSavingTransaction ? 'Saving...' : 'Save Transaction'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
                    {!(activeTab === 'member-ledger' && selectedMember) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab('income') }}
                        onClick={() => setActiveTab('income')}
                        className="bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-sm">+12%</Badge>
                        </div>
                        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Income</div>
                        <div className="text-2xl font-extrabold text-stone-900 mt-1 flex items-center">
                            <IndianRupee className="w-5 h-5 mr-1 text-emerald-600" />
                            {stats.totalIncome.toLocaleString('en-IN')}
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab('expense') }}
                        onClick={() => setActiveTab('expense')}
                        className="bg-white p-4 rounded-2xl border-2 border-red-50 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <Badge className="bg-red-100 text-red-800 border-none font-bold text-sm">+5%</Badge>
                        </div>
                        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Expenses</div>
                        <div className="text-2xl font-extrabold text-stone-900 mt-1 flex items-center">
                            <IndianRupee className="w-5 h-5 mr-1 text-red-600" />
                            {stats.totalExpense.toLocaleString('en-IN')}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border-2 border-blue-50 shadow-sm transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <PieChart className="w-5 h-5 text-blue-600" />
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 border-none font-bold text-sm">Good</Badge>
                        </div>
                        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Net Balance</div>
                        <div className="text-2xl font-extrabold text-stone-900 mt-1 flex items-center">
                            <IndianRupee className="w-5 h-5 mr-1 text-blue-600" />
                            {stats.balance.toLocaleString('en-IN')}
                        </div>
                    </div>
                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab('dues') }}
                        onClick={() => setActiveTab('dues')}
                        className="bg-white p-4 rounded-2xl border-2 border-amber-50 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                <IndianRupee className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Dues / Pending</div>
                        <div className="text-2xl font-extrabold text-stone-900 mt-1 flex items-center">
                            <IndianRupee className="w-5 h-5 mr-1 text-amber-600" />
                            {pendingMembers.reduce((s, m) => s + m.net_balance, 0).toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters for all tabs */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                        placeholder="Member name or phone"
                        value={memberFilterInput}
                        onChange={(e) => { setMemberFilterInput(e.target.value); setFilterMemberId(null); setMemberFilterFocused(true) }}
                        onFocus={() => setMemberFilterFocused(true)}
                        onBlur={() => setTimeout(() => setMemberFilterFocused(false), 150)}
                        className="pl-10 h-9 rounded-xl border-2 border-stone-100 bg-white text-sm w-64"
                    />
                    {memberFilterFocused && filteredMembers.length > 0 && (
                        <div className="absolute z-50 mt-2 w-64 bg-white rounded-xl border-2 border-stone-100 shadow-xl max-h-48 overflow-y-auto">
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm"
                                onClick={() => { setFilterMemberId(null); setMemberFilterInput(''); setMemberFilterFocused(false) }}
                            >
                                <span className="font-medium">All Members</span>
                            </button>
                            {filteredMembers.map(m => (
                                <button
                                    key={m.id}
                                    onMouseDown={(ev) => ev.preventDefault()}
                                    onClick={() => {
                                        setFilterMemberId(m.id)
                                        setMemberFilterInput(`${m.full_name} • ${m.phone || ''}`)
                                        setMemberFilterFocused(false)
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-emerald-50 border-t last:border-0"
                                >
                                    <div className="font-bold text-sm">{m.full_name}</div>
                                    <div className="text-xs text-stone-500">{m.phone}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Input type="date" value={filterStartDate ?? ''} onChange={(e) => setFilterStartDate(e.target.value || null)} className="h-9 w-36" />
                <Input type="date" value={filterEndDate ?? ''} onChange={(e) => setFilterEndDate(e.target.value || null)} className="h-9 w-36" />
                <Button variant="outline" className="h-9" onClick={() => { setFilterMemberId(null); setFilterStartDate(null); setFilterEndDate(null); setSearchQuery(''); setMemberFilterInput('') }}>Reset</Button>
            </div>

            {/* Tabs and Data Table Section */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <TabsList className="bg-white border-2 border-emerald-50 p-1 rounded-xl h-auto self-start">
                        <TabsTrigger value="all" className="rounded-lg font-bold px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            All Transactions
                        </TabsTrigger>
                        <TabsTrigger value="income" className="rounded-lg font-bold px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            Income
                        </TabsTrigger>
                        <TabsTrigger value="expense" className="rounded-lg font-bold px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            Expenses
                        </TabsTrigger>
                        <TabsTrigger value="dues" className="rounded-lg font-bold px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            Dues / Pending
                        </TabsTrigger>
                        <TabsTrigger value="member-ledger" className="rounded-lg font-bold px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            Member Ledger
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="mt-2">
                    <TabsContent value="all" className="m-0 bg-white rounded-2xl border-2 border-stone-100 overflow-hidden shadow-sm">
                        <DataTable columns={columns} data={filteredTransactions} />
                    </TabsContent>
                    <TabsContent value="income" className="m-0 bg-white rounded-2xl border-2 border-stone-100 overflow-hidden shadow-sm">
                        <DataTable columns={columns} data={filteredTransactions} />
                    </TabsContent>
                    <TabsContent value="expense" className="m-0 bg-white rounded-2xl border-2 border-stone-100 overflow-hidden shadow-sm">
                        <DataTable columns={columns} data={filteredTransactions} />
                    </TabsContent>
                    <TabsContent value="dues" className="m-0">
                        <div className="max-w-6xl mx-auto">
                            <DataTable
                                columns={pendingColumns}
                                data={pendingMembers.map(m => ({ id: m.member_id, name: m.full_name, remaining: m.net_balance }))}
                            />
                        </div>
                        <CollectDuesDialog
                            open={isCollectOpen}
                            onOpenChange={setIsCollectOpen}
                            memberId={collectMemberId ?? ''}
                            memberName={collectMemberName ?? ''}
                            totalDues={Number(pendingMembers.find(pm => pm.member_id === collectMemberId)?.net_balance ?? 0)}
                            branchId={branchId}
                            gymId={gymId}
                            onSuccess={() => {
                                fetchInitialData()
                                setIsCollectOpen(false)
                            }}
                        />
                    </TabsContent>
                    <TabsContent value="member-ledger" className="m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                                <h2 className="text-base font-bold text-stone-900 uppercase tracking-tight">
                                    Search Member Ledger
                                </h2>
                            </div>

                            <div className="relative max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <Input
                                    placeholder="Member Name or Phone..."
                                    className="pl-10 h-10 rounded-xl border-stone-200 border-2 focus:ring-emerald-500 bg-white text-sm shadow-md hover:border-emerald-200 transition-all font-medium"
                                    value={memberSearchQuery}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                    onChange={(e) => {
                                        setMemberSearchQuery(e.target.value)
                                        if (selectedMember) setSelectedMember(null)
                                    }}
                                />
                                {foundMembers.length > 0 && isSearchFocused && !selectedMember && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-stone-100 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        {foundMembers.map((m) => (
                                            <button
                                                key={m.id}
                                                className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-all border-b last:border-0 border-stone-50 flex items-center justify-between group"
                                                onClick={() => {
                                                    setSelectedMember(m)
                                                    setMemberSearchQuery(m.full_name)
                                                    setFoundMembers([])
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-800 font-bold text-xs group-hover:scale-105 transition-transform">
                                                        {m.full_name.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight text-xs">{m.full_name}</p>
                                                        <p className="text-[9px] text-stone-500 font-bold">Contact: {m.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-stone-50 p-1.5 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-all text-stone-300">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedMember && (
                                <MemberLedger
                                    memberId={selectedMember.id}
                                    memberName={selectedMember.full_name}
                                    branchId={branchId}
                                    gymId={gymId}
                                    onTransactionSuccess={fetchInitialData}
                                />
                            )}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
