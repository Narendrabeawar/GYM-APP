'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PnlFilters from '@/components/FinalAccounts/PnlFilters'
import PnlCard from '@/components/FinalAccounts/PnlCard'
import PnlTable from '@/components/FinalAccounts/PnlTable'
import { Button } from '@/components/ui/button'
import { BarChart } from 'lucide-react'

export default function FinalAccountsPage() {
  const supabase = createClient()
  const [branches, setBranches] = useState<{id:string,name:string}[]>([])
  interface PnlRow { branch_id?: string, day: string, total_income: number, total_expense: number, net_profit: number }
  const [rows, setRows] = useState<PnlRow[]>([])
  const [branchId, setBranchId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBranches = async () => {
      const { data } = await supabase.from('branches').select('id, name').order('name')
      setBranches((data || []).map((b: { id: string, name: string }) => ({ id: b.id, name: b.name })))
    }
    fetchBranches()
  }, [supabase])

    const fetchPnl = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_branch_pnl', { p_branch: branchId, p_start: startDate, p_end: endDate })
      if (error) throw error
      // normalize rows
      const normalized = (data || []).map((r: { branch_id?: string, day: string, total_income: string|number, total_expense: string|number, net_profit: string|number }) => ({
        branch_id: r.branch_id,
        day: r.day,
        total_income: Number(r.total_income || 0),
        total_expense: Number(r.total_expense || 0),
        net_profit: Number(r.net_profit || 0)
      })) as PnlRow[]
      setRows(normalized)
    } catch (err) {
      console.error('Error fetching PnL', err)
    } finally {
      setLoading(false)
    }
  }

  const totals = rows.reduce((acc, r) => {
    acc.income += r.total_income
    acc.expense += r.total_expense
    acc.net += r.net_profit
    return acc
  }, { income: 0, expense: 0, net: 0 })

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Final Accounts (P&L)</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchPnl}
            disabled={loading}
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center gap-2"
          >
            {loading ? 'Loading...' : (<><BarChart className="w-4 h-4" />Show Profit & Loss</>)}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <PnlFilters branches={branches} onChange={(b,s,e) => { setBranchId(b); setStartDate(s); setEndDate(e) }} />
      </div>
      <p className="text-sm text-stone-500">Tip: choose a branch and date range, then click <strong>Show Profit & Loss</strong> to generate the report. Use Reset to clear filters.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PnlCard title="Total Income" value={`₹${totals.income.toLocaleString('en-IN')}`} variant="green" />
        <PnlCard title="Total Expense" value={`₹${totals.expense.toLocaleString('en-IN')}`} variant="red" />
        <PnlCard title="Net Profit" value={`₹${totals.net.toLocaleString('en-IN')}`} variant={totals.net >= 0 ? 'green' : 'red'} />
      </div>

      <PnlTable rows={rows.map(r => ({ day: (r.day || '').toString(), total_income: r.total_income, total_expense: r.total_expense, net_profit: r.net_profit }))} />
    </div>
  )
}


