'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    CreditCard,
    Search,
    Loader2,
    IndianRupee,
    Calendar,
    ArrowRight,
    MoreHorizontal,
    CheckCircle,
    Clock,
    XCircle,
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
import { Label } from '@/components/ui/label'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
    Eye,
    Printer,
    MessageSquare,
    Download,
    FileText,
    Receipt,
    Building,
    Phone,
    Mail,
} from 'lucide-react'
// reading search params from window in effect to avoid prerender/client-hook issues
import MemberLedger from '@/components/MemberLedger'
import { useRouter } from 'next/navigation'
import CollectDuesDialog from '@/components/CollectDuesDialog'

type Payment = {
    id: string
    member_id: string
    amount: number
    payable_amount: number
    discount_amount: number
    due_amount: number
    extra_amount: number
    payment_method: string
    extra_discount: number | string
    status: string
    description: string
    created_at: string
    member?: {
        full_name: string
        phone: string
        email: string
        membership_start_date?: string
        membership_end_date?: string
    }
    net_balance?: number
    remaining_on_date?: number
}

export default function ReceptionPaymentsPage() {
    
    const [payments, setPayments] = useState<Payment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterMemberId, setFilterMemberId] = useState<string | null>(null)
    const [filterStartDate, setFilterStartDate] = useState<string | null>(null)
    const [filterEndDate, setFilterEndDate] = useState<string | null>(null)
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const supabase = createClient()
    const router = useRouter()
    const [ledgerMemberId, setLedgerMemberId] = useState<string | null>(null)
    const [ledgerMemberName, setLedgerMemberName] = useState<string | null>(null)
    const [currentGymId, setCurrentGymId] = useState<string | null>(null)
    const [currentBranchId, setCurrentBranchId] = useState<string | null>(null)
    const [isCollectOpenPayments, setIsCollectOpenPayments] = useState(false)
    const [collectMemberIdPayments, setCollectMemberIdPayments] = useState<string | null>(null)
    const [collectMemberNamePayments, setCollectMemberNamePayments] = useState<string | null>(null)

    useEffect(() => {
        // read URL search params on client only
        if (typeof window === 'undefined') return
        const params = new URLSearchParams(window.location.search)
        const id = params.get('memberId')
        setLedgerMemberId(id)
    }, [])

    // update ledgerMemberId when user navigates with browser back/forward
    useEffect(() => {
        const onPop = () => {
            const params = new URLSearchParams(window.location.search)
            setLedgerMemberId(params.get('memberId'))
        }
        window.addEventListener('popstate', onPop)
        return () => window.removeEventListener('popstate', onPop)
    }, [])

    useEffect(() => {
        if (!ledgerMemberId) return
        const fetchMember = async () => {
            try {
                const { data: member, error } = await supabase
                    .from('members')
                    .select('full_name')
                    .eq('id', ledgerMemberId)
                    .single()

                if (!error && member) {
                    setLedgerMemberName(member.full_name)
                } else {
                    setLedgerMemberName('Member')
                }
            } catch (err) {
                setLedgerMemberName('Member')
            }
        }
        fetchMember()
    }, [ledgerMemberId, supabase])

    const formatDate = (input?: string | Date | null) => {
        if (!input) return 'N/A'
        const date = new Date(input)
        const dd = String(date.getDate()).padStart(2, '0')
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const yyyy = date.getFullYear()
        return `${dd}/${mm}/${yyyy}`
    }

    const formatDateTime = (input?: string | Date | null) => {
        if (!input) return 'N/A'
        const date = new Date(input)
        const time = date.toLocaleTimeString()
        return `${formatDate(date)} ${time}`
    }

    const fetchPayments = useCallback(async () => {
        setIsLoading(true)
        try {
            // Get user profile to get gym_id and branch_id
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError) throw userError

            let gymId = user?.user_metadata?.gym_id
            let branchId = user?.user_metadata?.branch_id

            if (!gymId || !branchId) {
                if (user?.id) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('gym_id, branch_id')
                        .eq('id', user.id)
                        .single()
                    gymId = gymId || profile?.gym_id
                    branchId = branchId || profile?.branch_id
                }
            }

            if (!gymId) {
                toast.error('No gym associated with your account')
                return
            }

            if (!branchId) {
                toast.error('No branch associated with your account')
                return
            }

            // Fetch payments with member details - filtered by both gym_id AND branch_id
            const query = supabase
                .from('payments')
                .select(`
                    id,
                    member_id,
                    amount,
                    payable_amount,
                    discount_amount,
                    due_amount,
                    extra_amount,
                    payment_method,
                    extra_discount,
                    status,
                    description,
                    created_at,
                    member:members!member_id (
                        full_name,
                        phone,
                        email,
                        membership_start_date,
                        membership_end_date
                    )
                `)
                .eq('gym_id', gymId)
                .eq('branch_id', branchId)
                .order('created_at', { ascending: false })

            const { data, error } = await query

            // store gym/branch for passing to ledger/collect dialog
            setCurrentGymId(gymId || null)
            setCurrentBranchId(branchId || null)

            if (error) throw error

            // supabase returns related rows as arrays; normalize member to single object
            const normalized = (data || []).map((row: unknown) => {
                // Convert to plain object safely (avoids 'any' lint) and normalize member relation
                const obj = JSON.parse(JSON.stringify(row))
                return {
                    ...obj,
                    member: Array.isArray(obj.member) ? obj.member[0] ?? null : obj.member ?? null,
                }
            })

            // Compute running balance (remaining_on_date) per member (ledger-style)
            try {
                const memberIds = Array.from(new Set(normalized.map((p: Payment) => p.member_id).filter(Boolean)))
                for (const mId of memberIds) {
                    const rows = normalized
                        .filter((r: Payment) => r.member_id === mId)
                        .sort((a: Payment, b: Payment) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

                    let cumDebit = 0
                    let cumCredit = 0
                    for (const row of rows) {
                        const debit = row.payable_amount && Number(row.payable_amount) > 0 ? Number(row.payable_amount) : 0
                        const creditAmount = row.amount && Number(row.amount) > 0 ? Number(row.amount) : 0
                        const extraDisc = typeof row.extra_discount === 'number' ? Number(row.extra_discount) : (Number(row.extra_discount) || 0)
                        const credit = creditAmount + (extraDisc > 0 ? extraDisc : 0)

                        cumDebit += debit
                        cumCredit += credit

                        // remaining_on_date after this row (ledger-style)
                        row.remaining_on_date = cumDebit - cumCredit
                    }
                }

                // Also attach overall net_balance from view for quick reference (optional)
                const { data: balances, error: balancesError } = await supabase
                    .from('member_balances')
                    .select('member_id, net_balance')
                    .in('member_id', Array.from(new Set(normalized.map((p: Payment) => p.member_id).filter(Boolean))))

                if (!balancesError && balances) {
                    const balanceByMember = new Map((balances || []).map((b: { member_id: string, net_balance: number }) => [b.member_id, Number(b.net_balance)]))
                    const enriched = normalized.map((p: Payment) => ({
                        ...p,
                        net_balance: balanceByMember.get(p.member_id) ?? 0,
                        remaining_on_date: p.remaining_on_date ?? 0
                    }))
                    setPayments(enriched)
                } else {
                    setPayments(normalized)
                }
            } catch (err) {
                console.error('Error computing running balances or fetching member balances:', err)
                setPayments(normalized)
            }
        } catch (error) {
            console.error('Error fetching payments:', error)
            toast.error('Failed to fetch payments')
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchPayments()
        setMounted(true)
    }, [fetchPayments])

    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            // basic text search
            const matchesSearch =
                payment.member?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.member?.phone?.includes(searchQuery) ||
                payment.member?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.payment_method?.toLowerCase().includes(searchQuery.toLowerCase())

            if (!matchesSearch) return false

            // member filter
            if (filterMemberId && payment.member_id !== filterMemberId) return false

            // date filters (compare only date part)
            const created = payment.created_at ? new Date(payment.created_at) : null
            if (filterStartDate && created) {
                const start = new Date(filterStartDate + 'T00:00:00')
                if (created < start) return false
            }
            if (filterEndDate && created) {
                const end = new Date(filterEndDate + 'T23:59:59')
                if (created > end) return false
            }

            return true
        })
    }, [payments, searchQuery, filterMemberId, filterStartDate, filterEndDate])

    // derive unique members for filter dropdown
    const uniqueMembers = useMemo(() => {
        const map = new Map<string, { id: string, name: string }>()
        payments.forEach(p => {
            if (p.member && p.member_id) {
                map.set(p.member_id, { id: p.member_id, name: p.member.full_name })
            }
        })
        return Array.from(map.values())
    }, [payments])

    // totals for filtered view: sum of received and sum of charges (DR)
    const filteredTotals = useMemo(() => {
        return filteredPayments.reduce((acc, p) => {
            acc.totalReceived += Number(p.amount || 0)
            acc.totalDue += Number(p.payable_amount || 0)
            return acc
        }, { totalReceived: 0, totalDue: 0 })
    }, [filteredPayments])

    // latest remaining_on_date across filtered rows (most recent date)
    const latestRemaining = useMemo(() => {
        if (!filteredPayments || filteredPayments.length === 0) return 0
        const sorted = [...filteredPayments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return Number(sorted[0].remaining_on_date ?? 0)
    }, [filteredPayments])

    const getPaymentMethodIcon = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'cash': return '💵'
            case 'card': return '💳'
            case 'upi': return '📱'
            case 'bank_transfer': return '🏦'
            default: return '💰'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
            case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
            case 'refunded': return <RefreshCw className="w-4 h-4 text-blue-600" />
            default: return <Clock className="w-4 h-4 text-gray-600" />
        }
    }

    const handleViewReceipt = async (payment: Payment) => {
        try {
            // Try to get authoritative remaining_on_date via RPC
            const rpc = await supabase.rpc('get_member_balance_at', { p_member: payment.member_id, p_as_of: payment.created_at })
            let remaining = payment.remaining_on_date ?? payment.net_balance ?? 0
            if (!rpc.error && rpc.data) {
                if (Array.isArray(rpc.data) && rpc.data.length > 0) {
                    remaining = Number(rpc.data[0].net_balance || remaining)
                } else if (typeof rpc.data === 'object' && 'net_balance' in rpc.data) {
                    remaining = Number((rpc.data as any).net_balance || remaining)
                } else if (typeof rpc.data === 'number') {
                    remaining = Number(rpc.data)
                }
            }
            setSelectedPayment({ ...payment, remaining_on_date: remaining })
        } catch (err) {
            console.error('Error fetching remaining for receipt view', err)
            setSelectedPayment(payment)
        } finally {
            setShowReceiptModal(true)
        }
    }

    const handlePrintReceipt = async (payment: Payment) => {
        setSelectedPayment(payment)
        await generateAndPrintReceipt(payment)
    }

    const handleSendWhatsAppReceipt = async (payment: Payment) => {
        if (!payment.member?.phone) {
            toast.error('Member phone number not available')
            return
        }

        setIsGeneratingPDF(true)
        try {
            await generateAndDownloadPDF(payment)
            toast.success('PDF downloaded! Please send it manually via WhatsApp.')
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.error('Failed to generate PDF')
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    const handleSendWhatsAppText = async (payment: Payment) => {
        if (!payment.member?.phone) {
            toast.error('Member phone number not available')
            return
        }

        try {
            await sendReceiptViaWhatsApp(payment)
            toast.success('WhatsApp opened with receipt message!')
        } catch (error) {
            console.error('Error sending WhatsApp message:', error)
            toast.error('Failed to open WhatsApp')
        }
    }

    const sendReceiptViaWhatsApp = async (payment: Payment) => {
        // Get gym information
        const { data: { user } } = await supabase.auth.getUser()
        const gymName = user?.user_metadata?.gym_name || 'Your Gym'
        const gymAddress = user?.user_metadata?.gym_address || ''

        // fetch remaining dues as of payment.created_at for authoritative value
        try {
            const rpc = await supabase.rpc('get_member_balance_at', { p_member: payment.member_id, p_as_of: payment.created_at })
            if (!rpc.error && rpc.data) {
                if (Array.isArray(rpc.data) && rpc.data.length > 0) {
                    payment = { ...payment, remaining_on_date: Number(rpc.data[0].net_balance || 0) }
                } else if (typeof rpc.data === 'object' && 'net_balance' in rpc.data) {
                    payment = { ...payment, remaining_on_date: Number((rpc.data as any).net_balance || 0) }
                } else if (typeof rpc.data === 'number') {
                    payment = { ...payment, remaining_on_date: Number(rpc.data) }
                }
            }
        } catch (err) {
            console.error('Error fetching remaining dues for WhatsApp', err)
        }

        // Format phone number for WhatsApp
        const phoneNumber = await formatPhoneForWa(payment.member?.phone)
        if (!phoneNumber) {
            throw new Error('Invalid phone number')
        }

        // Generate receipt content
        const receiptContent = generateReceiptText(payment, gymName, gymAddress)

        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(receiptContent)}`

        // Open WhatsApp
        window.open(whatsappUrl, '_blank')
    }

    const generateAndPrintReceipt = async (payment: Payment) => {
        try {
            // Create a new window for printing
            const printWindow = window.open('', '_blank', 'width=800,height=600')
            if (!printWindow) {
                toast.error('Please allow popups for printing')
                return
            }

            // Generate receipt HTML
            const receiptHTML = await generateReceiptHTML(payment)

            printWindow.document.write(receiptHTML)
            printWindow.document.close()

            // Wait for content to load then print
            printWindow.onload = () => {
                printWindow.print()
                printWindow.close()
            }
        } catch (error) {
            console.error('Print error:', error)
            toast.error('Failed to print receipt')
        }
    }

    const generateAndDownloadPDF = async (payment: Payment) => {
        // Get gym information
        const { data: { user } } = await supabase.auth.getUser()
        const gymName = user?.user_metadata?.gym_name || 'Your Gym'
        const gymAddress = user?.user_metadata?.gym_address || ''

        // get remaining dues as of payment.created_at via RPC for PDF
        let remainingDuesDisplay = '₹0'
        try {
            const rpc = await supabase.rpc('get_member_balance_at', { p_member: payment.member_id, p_as_of: payment.created_at })
            if (!rpc.error && rpc.data && Array.isArray(rpc.data) && rpc.data.length > 0) {
                remainingDuesDisplay = `₹${Number(rpc.data[0].net_balance || 0).toLocaleString('en-IN')}`
            } else if (!rpc.error && rpc.data && typeof rpc.data === 'object' && 'net_balance' in rpc.data) {
                const obj = rpc.data as { net_balance?: number }
                remainingDuesDisplay = `₹${Number(obj.net_balance || 0).toLocaleString('en-IN')}`
            }
        } catch (err) {
            console.error('Error fetching remaining dues for PDF', err)
        }

        // Create a temporary div with the receipt HTML
        const receiptElement = document.createElement('div')
        receiptElement.innerHTML = `
            <div style="width: 600px; margin: 0 auto; background: white; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 20px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px;">${gymName}</h1>
                    ${gymAddress ? `<p style="margin: 5px 0; color: #6b7280;">${gymAddress}</p>` : ''}
                    <h2 style="color: #111827; margin: 20px 0 10px 0; font-size: 24px;">Payment Receipt</h2>
                    <p style="color: #6b7280; font-size: 14px;">Receipt ID: ${generateReceiptID(payment)}</p>
                </div>

                <!-- Member Details -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Member Details</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0;">MEMBER NAME</p>
                            <p style="font-size: 16px; font-weight: 500; color: #111827; margin: 5px 0;">${payment.member?.full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0;">PHONE NUMBER</p>
                            <p style="font-size: 16px; font-weight: 500; color: #111827; margin: 5px 0;">${payment.member?.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0;">ENROLLED ON</p>
                            <p style="font-size: 16px; font-weight: 500; color: #111827; margin: 5px 0;">${formatDate(payment.member?.membership_start_date)}</p>
                        </div>
                        <div>
                            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0;">VALID TILL</p>
                            <p style="font-size: 16px; font-weight: 500; color: #111827; margin: 5px 0;">${formatDate(payment.member?.membership_end_date)}</p>
                        </div>
                    </div>
                </div>

                <!-- Payment Details -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Payment Details</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0;">PAYMENT METHOD</p>
                            <p style="font-size: 16px; font-weight: 500; color: #111827; margin: 5px 0;">${payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}</p>
                        </div>
                        <div style="grid-column: span 2;">
                            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0;">SUMMARY</p>
                            <p style="font-size: 14px; font-weight: 500; color: #111827; margin: 5px 0; word-break: break-word;">${payment.description || 'General Payment'}</p>
                        </div>
                        <div>
                            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0;">DATE & TIME</p>
                            <p style="font-size: 16px; font-weight: 500; color: #111827; margin: 5px 0;">${formatDateTime(payment.created_at)}</p>
                        </div>
                    </div>
                </div>

                <!-- Amount -->
                <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; border: 2px solid #a7f3d0;">
                    <p style="font-size: 14px; color: #065f46; font-weight: 600; margin: 0 0 10px 0;">Amount Paid</p>
                    <p style="font-size: 32px; font-weight: 700; color: #047857; margin: 0;">₹${payment.amount.toLocaleString('en-IN')}</p>
                </div>

                ${payment.description ? `
                <div style="margin-bottom: 20px;">
                    <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0;">DESCRIPTION</p>
                    <p style="font-size: 16px; font-weight: 500; color: #111827; margin: 5px 0;">${payment.description}</p>
                </div>
                ` : ''}

                <!-- Remaining Dues (always shown) -->
                <div style="margin-bottom: 20px;">
                    <p style="font-size:12px;color:#6b7280;margin:6px 0 0 0;">Remaining Dues (as of ${formatDateTime(payment.created_at)}): <strong style="color:#b91c1c">${remainingDuesDisplay}</strong></p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; margin: 0; font-size: 14px;">Thank you for your payment! 🎉</p>
                    <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `

        // Hide the element initially
        receiptElement.style.position = 'absolute'
        receiptElement.style.left = '-9999px'
        receiptElement.style.top = '-9999px'
        document.body.appendChild(receiptElement)

        try {
            // Generate canvas from HTML
            const canvas = await html2canvas(receiptElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 600,
                height: receiptElement.offsetHeight
            })

            // Create PDF (fit to single A4 page)
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')

            // Page dimensions in mm
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 10 // mm margins

            // Calculate image size to fit within page (respect aspect ratio)
            let imgWidth = pageWidth - margin * 2
            let imgHeight = (canvas.height * imgWidth) / canvas.width

            // If image height exceeds printable area, scale down
            const printableHeight = pageHeight - margin * 2
            if (imgHeight > printableHeight) {
                const scale = printableHeight / imgHeight
                imgHeight = imgHeight * scale
                imgWidth = imgWidth * scale
            }

            // Center image on the page
            const x = (pageWidth - imgWidth) / 2
            const y = margin

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)

            // Download PDF
            const fileName = `receipt_${generateReceiptID(payment)}.pdf`
            pdf.save(fileName)

        } finally {
            // Clean up
            document.body.removeChild(receiptElement)
        }
    }

    const generateReceiptID = (payment: Payment) => {
        const phone = payment.member?.phone || '0000000000'
        // Remove all non-digit characters and take last 10 digits
        const cleanPhone = phone.replace(/\D/g, '').slice(-10)
        // Get date in DDMMYYYY format
        const date = new Date(payment.created_at)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const dateStr = `${day}${month}${year}`

        return `${cleanPhone}${dateStr}`
    }

    const generateReceiptHTML = async (payment: Payment) => {
        const { data: { user } } = await supabase.auth.getUser()
        const gymName = user?.user_metadata?.gym_name || 'Your Gym'
        const gymAddress = user?.user_metadata?.gym_address || ''
        const receiptId = generateReceiptID(payment)

        // get remaining dues as of payment.created_at via RPC
        let remainingDuesDisplay = '₹0'
        try {
            const rpc = await supabase.rpc('get_member_balance_at', { p_member: payment.member_id, p_as_of: payment.created_at })
            if (!rpc.error && rpc.data && Array.isArray(rpc.data) && rpc.data.length > 0) {
                remainingDuesDisplay = `₹${Number(rpc.data[0].net_balance || 0).toLocaleString('en-IN')}`
            } else if (!rpc.error && rpc.data && typeof rpc.data === 'object' && 'net_balance' in rpc.data) {
                const obj = rpc.data as { net_balance?: number }
                remainingDuesDisplay = `₹${Number(obj.net_balance || 0).toLocaleString('en-IN')}`
            }
        } catch (err) {
            console.error('Error fetching remaining dues via RPC', err)
        }

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Receipt - ${payment.id}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
                    .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
                    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
                    .header p { margin: 5px 0 0 0; opacity: 0.9; }
                    .content { padding: 30px; }
                    .member-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .member-info h3 { margin: 0 0 15px 0; color: #374151; font-size: 18px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    .info-item { display: flex; flex-direction: column; }
                    .info-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                    .info-value { font-size: 16px; font-weight: 500; color: #111827; }
                    .payment-details { margin-bottom: 20px; }
                    .payment-details h3 { margin: 0 0 15px 0; color: #374151; font-size: 18px; }
                    .amount { text-align: center; margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; border: 2px solid #a7f3d0; }
                    .amount .label { font-size: 14px; color: #065f46; font-weight: 600; margin-bottom: 8px; }
                    .amount .value { font-size: 32px; font-weight: 700; color: #047857; }
                    .footer { background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center; }
                    .footer p { margin: 0; color: #6b7280; font-size: 14px; }
                    .receipt-id { background: #f3f4f6; padding: 8px 16px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #374151; display: inline-block; margin-top: 10px; }
                    @media print { body { background: white; } .receipt { box-shadow: none; } }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h1>💰 Payment Receipt</h1>
                        <p>${gymName}</p>
                        ${gymAddress ? `<p style="font-size: 14px;">${gymAddress}</p>` : ''}
                    </div>
                    <div class="content">
                        <div class="member-info">
                            <h3>👤 Member Details</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">Member Name</div>
                                    <div class="info-value">${payment.member?.full_name || 'N/A'}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Phone Number</div>
                                    <div class="info-value">${payment.member?.phone || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div class="payment-details">
                            <h3>💳 Payment Information</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">Payment Method</div>
                                    <div class="info-value">${payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}</div>
                                </div>
                                <div class="info-item" style="grid-column: span 2;">
                                    <div class="info-label">Summary</div>
                                    <div class="info-value" style="font-size: 14px; line-height: 1.4;">${payment.description || 'General Payment'}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Date & Time</div>
                                    <div class="info-value">${formatDateTime(payment.created_at)}</div>
                                </div>
                            </div>
                        </div>

                        <div class="amount">
                            <div class="label">Amount Paid</div>
                            <div class="value">₹${payment.amount.toLocaleString('en-IN')}</div>
                        </div>

                        ${payment.description ? `
                        <div class="info-item" style="margin-bottom: 20px;">
                            <div class="info-label">Description</div>
                            <div class="info-value">${payment.description}</div>
                            <p style="font-size:12px;color:#6b7280;margin:6px 0 0 0;">Remaining Dues (as of ${formatDateTime(payment.created_at)}): <strong style="color:#b91c1c">${remainingDuesDisplay}</strong></p>
                        </div>
                        ` : ''}

                        <div class="receipt-id">
                            Receipt ID: ${receiptId}
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for your payment! 🎉</p>
                        <p style="margin-top: 5px; font-size: 12px;">Generated on ${formatDateTime(new Date())}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    const generateReceiptText = (payment: Payment, gymName: string, gymAddress: string) => {
        const paymentDate = formatDateTime(payment.created_at)
        const receiptId = generateReceiptID(payment)

        const enrolled = formatDate(payment.member?.membership_start_date)
        const validTill = formatDate(payment.member?.membership_end_date)

        // Use plain ASCII / minimal symbols to avoid unsupported emoji rendering (prevents �)
        return `*${gymName} - Payment Receipt* 

Receipt ID: ${receiptId}

Member Details:
Name: ${payment.member?.full_name || 'N/A'}
Phone: ${payment.member?.phone || 'N/A'}
Enrolled On: ${enrolled}
Valid Till: ${validTill}

Payment Information:
Method: ${payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
Summary: ${payment.description || 'General Payment'}
Date: ${paymentDate}

Amount Paid: ₹${payment.amount.toLocaleString('en-IN')}

${payment.description ? `Description: ${payment.description}` : ''}

Remaining Dues (as of ${formatDateTime(payment.created_at)}): ₹${String(payment.remaining_on_date ?? '')}

${gymAddress ? `Address: ${gymAddress}` : ''}

Thank you for your payment!
Generated on: ${formatDateTime(new Date())}`
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

    const columns = useMemo<ColumnDef<Payment>[]>(() => [
        {
            header: 'Sr.No.',
            size: 80,
            cell: ({ row }) => <span className="font-medium text-stone-500">{row.index + 1}</span>,
        },
        {
            accessorKey: 'member',
            header: 'Member',
            size: 250,
            cell: ({ row }) => {
                const member = row.original.member
                if (!member) return <span className="text-stone-500">-</span>

                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-emerald-800 font-black text-sm shadow-sm">
                            {(member.full_name || 'M').substring(0, 1).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-stone-900 leading-none">{member.full_name}</span>
                            <span className="text-[10px] text-stone-500 uppercase mt-1 font-bold tracking-tighter">
                                {member.phone}
                            </span>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: 'amount',
            header: 'Amount Received',
            size: 120,
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-stone-900 font-bold">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span>{row.getValue('amount')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'due_amount',
            header: 'Due Amount',
            size: 120,
            cell: ({ row }) => {
                const dueAmount = row.getValue('due_amount') as number || 0
                return (
                    <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-red-600" />
                        <span className={`font-bold ${dueAmount > 0 ? 'text-red-700' : 'text-stone-500'}`}>
                            {dueAmount > 0 ? dueAmount : '0'}
                        </span>
                    </div>
                )
            },
        },
        // Advance Amount column removed as per request
        {
            accessorKey: 'extra_discount',
            header: 'Extra Discount',
            size: 120,
            cell: ({ row }) => {
                const extraDiscount = row.getValue('extra_discount') as number || 0
                return (
                    <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-amber-600" />
                        <span className={`font-bold ${extraDiscount > 0 ? 'text-amber-700' : 'text-stone-500'}`}>
                            {extraDiscount > 0 ? extraDiscount : '0'}
                        </span>
                    </div>
                )
            },
        },
        {
            accessorKey: 'remaining_on_date',
            header: 'Remaining Dues on Date',
            size: 160,
            cell: ({ row }) => {
                const balance = (row.getValue('remaining_on_date') as number) ?? 0
                const isReceivable = balance > 0
                return (
                    <div className={`font-bold ${isReceivable ? 'text-red-600' : 'text-emerald-600'}`}>
                        ₹{Math.abs(balance).toLocaleString('en-IN')}
                    </div>
                )
            },
        },
        {
            accessorKey: 'description',
            header: 'Description',
            size: 200,
            cell: ({ row }) => (
                <span className="text-stone-700 font-medium">{row.getValue('description') || '-'}</span>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Date',
            size: 140,
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-stone-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{formatDate(row.getValue('created_at'))}</span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const payment = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4 text-stone-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-48 p-1">
                            <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold uppercase">Receipt Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700"
                                onClick={() => handleViewReceipt(payment)}
                            >
                                <Eye className="w-4 h-4" />
                                View Receipt
                            </DropdownMenuItem>
                            {/* 'Show Ledger' action removed from Payments page (kept in Accounts only) */}
                            <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-blue-50 text-blue-700 font-medium"
                                onClick={() => handlePrintReceipt(payment)}
                            >
                                <Printer className="w-4 h-4" />
                                Print Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-emerald-700 font-medium"
                                onClick={() => {
                                    const memberId = payment.member_id
                                    const memberName = payment.member?.full_name || ''
                                    if (memberId) {
                                        setCollectMemberIdPayments(memberId)
                                        setCollectMemberNamePayments(memberName)
                                        setIsCollectOpenPayments(true)
                                    } else {
                                        toast.error('Member id not available')
                                    }
                                }}
                            >
                                <IndianRupee className="w-4 h-4" />
                                Collect Dues
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-green-50 text-green-700 font-medium"
                                onClick={() => handleSendWhatsAppReceipt(payment)}
                            >
                                <Download className="w-4 h-4" />
                                Download PDF for WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-blue-50 text-blue-700 font-medium"
                                onClick={() => handleSendWhatsAppText(payment)}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Send Text Message
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [])

    const totalAmount = useMemo(() => {
        return filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    }, [filteredPayments])

    if (!mounted) return null

    return (
        <div className="space-y-6 -mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        {ledgerMemberId && (
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/reception/payments')}
                                className="text-stone-600 -ml-2"
                            >
                                ← Back
                            </Button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent underline decoration-emerald-200 decoration-4 underline-offset-8">
                                Payment Records
                            </h1>
                            <p className="text-stone-500 mt-4 font-medium flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                Track all payments and transactions in your gym.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-xl border border-emerald-200">
                        <div className="text-sm text-stone-600 font-medium">Total Amount</div>
                        <div className="text-lg font-bold text-emerald-800 flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            {totalAmount.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div className="flex-1 flex items-center justify-center">
                    <h3 className="text-lg font-bold text-center text-stone-900">Payment History</h3>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                        placeholder="Search payments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 rounded-xl border-green-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 bg-white"
                    />
                </div>
                <div className="flex items-center gap-3 ml-4">
                    <select
                        value={filterMemberId ?? ''}
                        onChange={(e) => setFilterMemberId(e.target.value || null)}
                        className="h-10 rounded-xl border-2 border-stone-100 bg-white px-3 text-sm"
                    >
                        <option value="">All Members</option>
                        {uniqueMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>

                    <Input
                        type="date"
                        value={filterStartDate ?? ''}
                        onChange={(e) => setFilterStartDate(e.target.value || null)}
                        className="h-10 rounded-xl border-2 border-stone-100 bg-white px-3 text-sm"
                    />
                    <Input
                        type="date"
                        value={filterEndDate ?? ''}
                        onChange={(e) => setFilterEndDate(e.target.value || null)}
                        className="h-10 rounded-xl border-2 border-stone-100 bg-white px-3 text-sm"
                    />
                    <Button variant="outline" className="h-10" onClick={() => { setFilterMemberId(null); setFilterStartDate(null); setFilterEndDate(null); setSearchQuery('') }}>
                        Reset
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-800 animate-spin" />
                    <p className="text-stone-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Payments...</p>
                </div>
                ) : ledgerMemberId ? (
                // When ?memberId is present in the URL, hide the payments table and show the member ledger
                <MemberLedger
                    memberId={ledgerMemberId}
                    memberName={ledgerMemberName ?? 'Member'}
                    branchId={currentBranchId}
                    gymId={currentGymId}
                    onTransactionSuccess={fetchPayments}
                    onClose={() => {
                        setLedgerMemberId(null)
                        router.push('/reception/payments')
                    }}
                />
            ) : (
                <>
                    <DataTable columns={columns} data={filteredPayments} />

                    {/* Totals for filtered data */}
                    <div className="mt-6 flex gap-4 items-center justify-end">
                        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-sm">
                            <div className="text-xs text-stone-500">Total Received</div>
                            <div className="font-bold text-emerald-700">₹{filteredTotals.totalReceived.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-sm">
                            <div className="text-xs text-stone-500">Total Charges (DR)</div>
                            <div className="font-bold text-red-600">₹{filteredTotals.totalDue.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-sm">
                            <div className="text-xs text-stone-500">Remaining (latest)</div>
                            <div className="font-bold text-red-600">₹{latestRemaining.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </>
            )}

            {/* Receipt Modal */}
            <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
                <DialogContent className="sm:max-w-[600px] max-h-[92vh] overflow-y-auto bg-white rounded-2xl border-none shadow-2xl p-0 scrollbar-hide">
                    <DialogHeader className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 sticky top-0 z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Receipt className="w-6 h-6" />
                            Payment Receipt
                        </DialogTitle>
                        <DialogDescription className="text-emerald-100">
                            Receipt ID: {selectedPayment ? generateReceiptID(selectedPayment) : ''}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPayment && (
                        <div className="p-6">
                            {/* Receipt Content */}
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Receipt</h2>
                                    <p className="text-gray-600">Receipt ID: {generateReceiptID(selectedPayment)}</p>
                                </div>

                                {/* Member Details */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Member Name</Label>
                                        <p className="text-lg font-medium text-gray-900">{selectedPayment.member?.full_name || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
                                        <p className="text-lg font-medium text-gray-900">{selectedPayment.member?.phone || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Enrolled On</Label>
                                        <p className="text-lg font-medium text-gray-900">{selectedPayment.member?.membership_start_date ? formatDate(selectedPayment.member.membership_start_date) : 'N/A'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Valid Till</Label>
                                        <p className="text-lg font-medium text-gray-900">{selectedPayment.member?.membership_end_date ? formatDate(selectedPayment.member.membership_end_date) : 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Payment Method</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getPaymentMethodIcon(selectedPayment.payment_method)}</span>
                                            <span className="font-medium capitalize">{selectedPayment.payment_method}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Summary</Label>
                                        <div className="flex flex-wrap">
                                            <Badge variant="outline" className="capitalize font-bold rounded-lg border-2 border-purple-200 bg-purple-50 text-purple-800 whitespace-normal h-auto py-1 px-3 text-left">
                                                {selectedPayment.description || 'General Payment'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border-2 border-emerald-200 mb-6">
                                    <div className="text-center">
                                        <p className="text-sm text-emerald-700 font-semibold mb-2">Amount Paid</p>
                                        <p className="text-3xl font-bold text-emerald-800 flex items-center justify-center gap-1">
                                            <IndianRupee className="w-6 h-6" />
                                            {selectedPayment.amount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Date & Time</Label>
                                    <p className="font-medium text-gray-900">{formatDateTime(selectedPayment.created_at)}</p>
                                </div>

                                {/* Remaining dues as of this payment */}
                                <div className="mb-4">
                                    <Label className="text-sm font-semibold text-gray-700">Remaining Dues (as of this payment)</Label>
                                    <p className="text-red-600 font-bold mt-1">₹{Number(selectedPayment.remaining_on_date ?? selectedPayment.net_balance ?? 0).toLocaleString('en-IN')}</p>
                                </div>

                                {selectedPayment.description && (
                                    <div className="mb-6">
                                        <Label className="text-sm font-semibold text-gray-700">Description</Label>
                                        <p className="text-gray-900 mt-1">{selectedPayment.description}</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex justify-between gap-3 pt-6 border-t">
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => handlePrintReceipt(selectedPayment)}
                                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        Print
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSendWhatsAppReceipt(selectedPayment)}
                                        disabled={isGeneratingPDF}
                                        className="border-green-200 text-green-700 hover:bg-green-50"
                                    >
                                        {isGeneratingPDF ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4 mr-2" />
                                        )}
                                        Download PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSendWhatsAppText(selectedPayment)}
                                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Send Text
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReceiptModal(false)}
                                    className="border-stone-200 text-stone-700 hover:bg-stone-50"
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <CollectDuesDialog
                open={isCollectOpenPayments}
                onOpenChange={setIsCollectOpenPayments}
                memberId={collectMemberIdPayments ?? ''}
                memberName={collectMemberNamePayments ?? ''}
                totalDues={Number(payments.find(p => p.member_id === collectMemberIdPayments)?.net_balance ?? 0)}
                branchId={currentBranchId}
                gymId={currentGymId}
                onSuccess={() => {
                    fetchPayments()
                    setIsCollectOpenPayments(false)
                }}
            />
        </div>
    )
}
