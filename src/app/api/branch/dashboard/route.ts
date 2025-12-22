import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getBranchDashboardData } from '@/app/actions/branch'

export async function GET(request: Request) {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
            console.error('Error fetching user in API:', userError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const branchId = user?.user_metadata?.branch_id
        if (!branchId) {
            return NextResponse.json({ error: 'No branch id found' }, { status: 400 })
        }

        const url = new URL(request.url)
        const debug = url.searchParams.get('debug') === '1'

        const data = await getBranchDashboardData(branchId)
        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch branch dashboard data' }, { status: 500 })
        }

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

            return NextResponse.json({
                ...data,
                debug: {
                    membersSample: membersSample || [],
                    membersError: membersError ? String(membersError.message || membersError) : null,
                    paymentsSample: paymentsSample || [],
                    paymentsError: paymentsError ? String(paymentsError.message || paymentsError) : null,
                },
            })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Unexpected error in /api/branch/dashboard:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


