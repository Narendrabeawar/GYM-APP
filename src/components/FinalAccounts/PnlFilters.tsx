'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PnlFiltersProps {
  branches: { id: string, name: string }[]
  onChange: (branchId: string | null, startDate: string | null, endDate: string | null) => void
}

export default function PnlFilters({ branches, onChange }: PnlFiltersProps) {
  const [branch, setBranch] = useState<string | null>(null)
  const [start, setStart] = useState<string | null>(null)
  const [end, setEnd] = useState<string | null>(null)

  useEffect(() => {
    onChange(branch, start, end)
  }, [branch, start, end])

  return (
    <div className="flex items-center gap-3">
      <select value={branch ?? ''} onChange={e => setBranch(e.target.value || null)} className="h-10 rounded-xl border-2 border-stone-100 bg-white px-3 text-sm">
        <option value="">All Members</option>
        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <Input type="date" value={start ?? ''} onChange={e => setStart(e.target.value || null)} className="h-10" />
      <Input type="date" value={end ?? ''} onChange={e => setEnd(e.target.value || null)} className="h-10" />
      <Button variant="outline" onClick={() => { setBranch(null); setStart(null); setEnd(null) }}>Reset</Button>
    </div>
  )
}


