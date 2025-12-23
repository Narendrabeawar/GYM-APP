import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getGymDashboardData } from '@/app/actions/gym'

export async function GET(request: Request) {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            console.error('Error fetching user in API:', userError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const gymId = user?.user_metadata?.gym_id
        if (!gymId) {
            console.error('No gym ID in user metadata:', { metadata: user.user_metadata })
            return NextResponse.json({ error: 'No gym id found' }, { status: 400 })
        }

        // allow a debug flag to return sample member rows for troubleshooting
        const url = new URL(request.url)
        const debug = url.searchParams.get('debug') === '1'

        // Use server action to fetch aggregated dashboard data
        const data = await getGymDashboardData(gymId)

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
        }

        if (debug) {
            // fetch a small sample of members for inspection
            const { data: membersSample, error: membersError } = await supabase
                .from('members')
                .select('id, full_name, membership_start_date, membership_end_date, branch_id, created_at')
                .eq('gym_id', gymId)
                .order('created_at', { ascending: false })
                .limit(20)

            return NextResponse.json({
                ...data,
                debug: {
                    membersSample: membersSample || [],
                    membersError: membersError ? String(membersError.message || membersError) : null,
                },
            })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Unexpected error in /api/gym/dashboard:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


