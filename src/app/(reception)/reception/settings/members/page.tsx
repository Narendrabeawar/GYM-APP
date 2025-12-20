 'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import Link from 'next/link'
import MemberProfileModal from '@/components/MemberProfileModal'

type Member = {
    id: string
    full_name: string
    father_name?: string
    email?: string
    phone?: string
    emergency_contact?: string
    status?: string
    membership_start_date?: string
    membership_end_date?: string
    membership_plan_id?: string
}

export default function EditMembersPage() {
    const supabase = createClient()
    const router = useRouter()
    const [members, setMembers] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(15)
    const [total, setTotal] = useState(0)
    const [statusFilter, setStatusFilter] = useState<string | ''>('')
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [showProfileModal, setShowProfileModal] = useState(false)

    const fetchMembers = useCallback(async (opts?: { page?: number, size?: number }) => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const branch = user?.user_metadata?.branch_id
            const currentPage = opts?.page || page
            const size = opts?.size || pageSize
            const from = (currentPage - 1) * size
            const to = from + size - 1

            let query = supabase.from('members').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to)
            if (branch) query = query.eq('branch_id', branch)
            if (statusFilter) query = query.eq('status', statusFilter)
            if (searchQuery) {
                const q = `%${searchQuery}%`
                query = query.or(`full_name.ilike.${q},phone.ilike.${q},email.ilike.${q},father_name.ilike.${q}`)
            }

            const { data, error, count } = await query
            if (error) throw error
            setMembers(data || [])
            setTotal(count || 0)
        } catch (err) {
            console.error('Failed to fetch members:', err)
            toast.error('Failed to load members')
        } finally {
            setIsLoading(false)
        }
    }, [supabase, page, pageSize, searchQuery, statusFilter])

    useEffect(() => {
        let mountedFlag = true
        const init = async () => {
            await fetchMembers({ page, size: pageSize })
            if (mountedFlag) setMounted(true)
        }
        init()
        return () => { mountedFlag = false }
    }, [fetchMembers, page, pageSize])

    // client-side filtered is no longer used; server-side filters are applied in fetchMembers

    const handleDelete = useCallback(async (m: Member) => {
        if (!confirm(`Delete member ${m.full_name}? This will remove them from the database.`)) return
        try {
            const { error } = await supabase.from('members').delete().eq('id', m.id)
            if (error) throw error
            toast.success('Member deleted')
            // refetch current page
            await fetchMembers({ page, size: pageSize })
        } catch (err) {
            console.error('Delete failed', err)
            toast.error('Failed to delete member')
        }
    }, [supabase, fetchMembers, page, pageSize])

    const columns = useMemo<ColumnDef<Member>[]>(() => [
        { header: 'Sr.No.', size: 60, cell: ({ row }) => <span className="font-medium text-stone-500">{(page - 1) * pageSize + row.index + 1}</span> },
        { accessorKey: 'full_name', header: 'Name', size: 220, cell: ({ row }) => <span className="font-bold">{row.getValue('full_name')}</span> },
        { accessorKey: 'father_name', header: "Father's Name", size: 200, cell: ({ row }) => <span>{row.getValue('father_name') || '-'}</span> },
        { accessorKey: 'phone', header: 'Contact No.', size: 140, cell: ({ row }) => <span>{row.getValue('phone') || '-'}</span> },
        { accessorKey: 'emergency_contact', header: 'Emergency Contact', size: 160, cell: ({ row }) => <span>{row.getValue('emergency_contact') || '-'}</span> },
        { accessorKey: 'membership_start_date', header: 'Enrolled On', size: 140, cell: ({ row }) => <span>{row.getValue('membership_start_date') ? new Date(row.getValue('membership_start_date')).toLocaleDateString() : '-'}</span> },
        { accessorKey: 'status', header: 'Status', size: 120, cell: ({ row }) => {
            const st = (row.getValue('status') as string) || '-'
            const cls = st === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : st === 'inactive' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'
            return <Badge variant="outline" className={`capitalize font-bold rounded-lg border-2 ${cls}`}>{st}</Badge>
        } },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const m = row.original
                return (
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedMember(m); setShowProfileModal(true) }}>View</Button>
                        <Link href={`/reception/settings/members/${m.id}/edit`}>
                            <Button size="sm" variant="outline">Edit</Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(m)}>Delete</Button>
                    </div>
                )
            }
        }
    ], [page, pageSize, handleDelete])

    if (!mounted) return null

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Edit Gym Members</h1>
            <div className="flex items-center gap-4">
                <Input placeholder="Search by name, phone or father name" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }} className="max-w-sm" />
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="border rounded px-2 h-10">
                    <option value=''>All status</option>
                    <option value='active'>Active</option>
                    <option value='inactive'>Inactive</option>
                </select>
                <Button variant="outline" onClick={() => fetchMembers({ page: 1, size: pageSize })}>Refresh</Button>
                <Button variant="ghost" onClick={async () => {
                    // export CSV for current filters (fetch all)
                    try {
                        const { data: { user } } = await supabase.auth.getUser()
                        const branch = user?.user_metadata?.branch_id
                        let q = supabase.from('members').select('*').order('created_at', { ascending: false })
                        if (branch) q = q.eq('branch_id', branch)
                        if (statusFilter) q = q.eq('status', statusFilter)
                        if (searchQuery) {
                            const s = `%${searchQuery}%`
                            q = q.or(`full_name.ilike.${s},phone.ilike.${s},email.ilike.${s},father_name.ilike.${s}`)
                        }
                        const { data, error } = await q
                        if (error) throw error
                        const rows = (data || []) as Member[]
                        const header = ['Name','Father Name','Phone','Emergency Contact','Enrolled On','Status','Email']
                        const csv = [header.join(',')].concat(rows.map((r: Member) => {
                            return [
                                `"${(r.full_name || '').replace(/"/g,'""')}"`,
                                `"${(r.father_name || '').replace(/"/g,'""')}"`,
                                `"${(r.phone || '').replace(/"/g,'""')}"`,
                                `"${(r.emergency_contact || '').replace(/"/g,'""')}"`,
                                `"${r.membership_start_date || ''}"`,
                                `"${r.status || ''}"`,
                                `"${(r.email || '').replace(/"/g,'""')}"`,
                            ].join(',')
                        })).join('\n')
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `members-${Date.now()}.csv`
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                        URL.revokeObjectURL(url)
                    } catch (err) {
                        console.error('CSV export failed', err)
                        toast.error('Failed to export CSV')
                    }
                }}>Export CSV</Button>
            </div>
            {isLoading ? (
                <div className="py-10 text-center">Loading...</div>
            ) : (
                <DataTable columns={columns} data={members} />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-stone-600">Showing {(page-1)*pageSize + 1} - {Math.min(page*pageSize, total)} of {total}</div>
                <div className="flex items-center gap-2">
                    <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1) }} className="border rounded px-2 h-9">
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</Button>
                    <span className="px-2">{page}</span>
                    <Button variant="outline" size="sm" disabled={page*pageSize >= total} onClick={() => setPage(p => p+1)}>Next</Button>
                </div>
            </div>

            {/* Member Profile Modal */}
            <MemberProfileModal 
                isOpen={showProfileModal} 
                onClose={() => setShowProfileModal(false)} 
                member={selectedMember} 
            />
        </div>
    )
}


