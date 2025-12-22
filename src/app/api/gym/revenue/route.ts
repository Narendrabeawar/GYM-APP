import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Error fetching user in API:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gymId = user?.user_metadata?.gym_id
    if (!gymId) {
      return NextResponse.json({ error: 'No gym id found' }, { status: 400 })
    }

    // fetch branches for gym
    const { data: branches } = await supabase.from('branches').select('id').eq('gym_id', gymId)
    const branchIds = (branches || []).map((b: any) => b.id)

    // build last 12 months labels (YYYY-MM)
    const now = new Date()
    const months: { key: string; start: string; end: string; label: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const key = start.toISOString().slice(0, 7)
      const label = start.toLocaleString('default', { month: 'short', year: 'numeric' })
      months.push({ key, start: start.toISOString(), end: end.toISOString(), label })
    }

    const incomeSeries: number[] = []
    const expenseSeries: number[] = []

    // For each month, aggregate across branches using RPC per branch (get_branch_pnl) and payments fallback
    for (const m of months) {
      let monthIncome = 0
      let monthExpense = 0

      // Try to use RPC per branch
      for (const branchId of branchIds) {
        try {
          const { data: pnl, error: pnlErr } = await supabase.rpc('get_branch_pnl', {
            p_branch: branchId,
            p_start: m.start,
            p_end: m.end,
          })
          if (!pnlErr && pnl && Array.isArray(pnl)) {
            for (const r of pnl as any[]) {
              monthIncome += Number(r.total_income || 0)
              monthExpense += Number(r.total_expense || 0)
            }
            continue
          }
        } catch (e) {
          // ignore and fallback to payments
        }

        // fallback: sum payments for branch in month
        try {
          const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('branch_id', branchId)
            .gte('created_at', m.start)
            .lte('created_at', m.end)
          if (payments) {
            monthIncome += (payments as any[]).reduce((s, p) => s + Number(p.amount || 0), 0)
          }
        } catch (e) {
          console.error('payments fallback failed', e)
        }
      }

      incomeSeries.push(Math.round(monthIncome))
      expenseSeries.push(Math.round(monthExpense))
    }

    return NextResponse.json({ labels: months.map(m => m.label), income: incomeSeries, expense: expenseSeries })
  } catch (err) {
    console.error('Unexpected error in /api/gym/revenue:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


