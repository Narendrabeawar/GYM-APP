import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getBranchDashboardData } from '@/app/actions/branch'

export async function GET(request: Request) {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            console.error('Error fetching user in API:', userError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const branchId = user?.user_metadata?.branch_id
        if (!branchId) {
            console.error('No branch ID in user metadata:', { metadata: user.user_metadata })
            return NextResponse.json({ error: 'No branch id found' }, { status: 400 })
        }

        const url = new URL(request.url)
        const debug = url.searchParams.get('debug') === '1'

        const data = await getBranchDashboardData(branchId)

        if (debug) {
            const { data: membersSample, error: membersError } = await supabase
                .from('members')
                .select('id, full_name, membership_start_date, membership_end_date, created_at')
                .eq('branch_id', branchId)
                .order('created_at', { ascending: false })
                .limit(20)

            const { data: paymentsSample, error: paymentsError } = await supabase
                .from('payments')
                .select('id, amount, status, created_at')
                .eq('branch_id', branchId)
                .order('created_at', { ascending: false })
                .limit(20)

            // If main aggregation failed, run diagnostics to find root cause
            if (!data) {
                const diagnostics: Record<string, unknown> = {}
                try {
                    const { data: branchRow, error: branchErr } = await supabase
                        .from('branches')
                        .select('id, name, member_capacity')
                        .eq('id', branchId)
                        .single()
                    diagnostics.branch = branchRow || null
                    diagnostics.branchError = branchErr ? String(branchErr.message || branchErr) : null
                } catch (e) {
                    diagnostics.branchError = String(e)
                }

                try {
                    const { data: pnlTest, error: pnlTestErr } = await supabase.rpc('get_branch_pnl', {
                        p_branch: branchId,
                        p_start: null,
                        p_end: null
                    })
                    diagnostics.pnlSample = pnlTest || null
                    diagnostics.pnlError = pnlTestErr ? String(pnlTestErr.message || pnlTestErr) : null
                } catch (e) {
                    diagnostics.pnlError = String(e)
                }

                try {
                    const { data: paymentsDiag, error: paymentsDiagErr } = await supabase
                        .from('payments')
                        .select('id, amount, status, created_at')
                        .eq('branch_id', branchId)
                        .limit(10)
                    diagnostics.paymentsSample = paymentsDiag || []
                    diagnostics.paymentsError = paymentsDiagErr ? String(paymentsDiagErr.message || paymentsDiagErr) : null
                } catch (e) {
                    diagnostics.paymentsError = String(e)
                }

                try {
                    const { data: membersDiag, error: membersDiagErr } = await supabase
                        .from('members')
                        .select('id, full_name, membership_start_date, membership_end_date, created_at')
                        .eq('branch_id', branchId)
                        .limit(10)
                    diagnostics.membersSample = membersDiag || []
                    diagnostics.membersError = membersDiagErr ? String(membersDiagErr.message || membersDiagErr) : null
                } catch (e) {
                    diagnostics.membersError = String(e)
                }

                return NextResponse.json({
                    data: null,
                    debug: {
                        membersSample: membersSample || [],
                        membersError: membersError ? String(membersError.message || membersError) : null,
                        paymentsSample: paymentsSample || [],
                        paymentsError: paymentsError ? String(paymentsError.message || paymentsError) : null,
                    },
                    diagnostics,
                    error: 'Failed to fetch branch dashboard data - see debug and diagnostics'
                })
            }

            return NextResponse.json({
                data: data || null,
                debug: {
                    membersSample: membersSample || [],
                    membersError: membersError ? String(membersError.message || membersError) : null,
                    paymentsSample: paymentsSample || [],
                    paymentsError: paymentsError ? String(paymentsError.message || paymentsError) : null,
                },
                error: null
            })
        }

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch branch dashboard data' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Unexpected error in /api/branch/dashboard:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


