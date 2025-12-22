'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    message?: string
    error?: string
    success?: boolean
}

export async function createGym(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const email = formData.get('email') as string
    const gymName = formData.get('gymName') as string
    const mobile = formData.get('mobile') as string
    const address = formData.get('address') as string

    if (!email || !gymName || !mobile) {
        return { error: 'Gym Name, Email, and Mobile Number are required' }
    }

    const supabase = createAdminClient()

    try {
        // 1. Create the Gym record first
        const { data: gym, error: gymError } = await supabase
            .from('gyms')
            .insert({
                name: gymName,
                email: email,
                phone: mobile,
                address: address
            })
            .select()
            .single()

        if (gymError) {
            console.error('Error creating gym:', gymError)
            return { error: 'Failed to create gym record: ' + gymError.message }
        }

        // 2. Create the Gym Admin User
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email,
            password: 'newgym123',
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                role: 'gym_admin',
                full_name: gymName + ' Admin', // Default name
                gym_id: gym.id,
                gym_name: gymName,
                force_password_change: true
            }
        })

        if (userError) {
            // Rollback: delete the gym if user creation fails
            await supabase.from('gyms').delete().eq('id', gym.id)
            console.error('Error creating user:', userError)
            return { error: userError.message }
        }

        // 3. Update Gym with Admin ID
        if (user.user) {
            const { error: updateError } = await supabase
                .from('gyms')
                .update({ admin_id: user.user.id })
                .eq('id', gym.id)

            if (updateError) {
                console.error('Error linking admin to gym:', updateError)
                // Not critical enough to fail the whole process, but good to know
            }
        }

        revalidatePath('/members')
        return { success: true, message: `Gym "${gymName}" created successfully with default password "newgym123"` }
    } catch (err) {
        console.error('Unexpected error:', err)
        return { error: 'Something went wrong' }
    }
}

export async function updateGym(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const id = formData.get('id') as string
    const email = formData.get('email') as string
    const gymName = formData.get('gymName') as string
    const mobile = formData.get('mobile') as string
    const address = formData.get('address') as string
    const subscriptionStatus = formData.get('subscriptionStatus') as string

    if (!id || !email || !gymName || !mobile) {
        return { error: 'Required fields are missing' }
    }

    const supabase = createAdminClient()

    try {
        const { error } = await supabase
            .from('gyms')
            .update({
                name: gymName,
                email: email,
                phone: mobile,
                address: address,
                subscription_status: subscriptionStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) {
            console.error('Error updating gym:', error)
            return { error: 'Failed to update gym: ' + error.message }
        }

        revalidatePath('/listed-gym')
        return { success: true, message: `Gym "${gymName}" updated successfully` }
    } catch (err) {
        console.error('Unexpected error:', err)
        return { error: 'Something went wrong' }
    }
}

export interface BranchDashboardData {
    id: string
    name: string
    address?: string
    phone?: string
    manager_name?: string
    status: 'active' | 'inactive'
    total_income: number
    total_expenses: number
    net_profit: number
    member_count: number
    active_members: number
}

export async function getGymDashboardData(gymId: string): Promise<{
    branches: BranchDashboardData[]
    summary: {
        total_branches: number
        total_income: number
        total_expenses: number
        total_profit: number
        total_members: number
        active_members: number
    }
} | null> {
    if (!gymId) return null

    const supabase = createAdminClient()

    try {
        // Get all branches for this gym
        const { data: branches, error: branchesError } = await supabase
            .from('branches')
            .select('id, name, address, phone, manager_name, status')
            .eq('gym_id', gymId)
            .eq('status', 'active')
            .order('name')

        if (branchesError) {
            console.error('Error fetching branches:', branchesError)
            return null
        }

        if (!branches || branches.length === 0) {
            return {
                branches: [],
                summary: {
                    total_branches: 0,
                    total_income: 0,
                    total_expenses: 0,
                    total_profit: 0,
                    total_members: 0,
                    active_members: 0
                }
            }
        }

        // Load all members for the gym once and group by branch to avoid per-branch queries
        const { data: allMembers, error: allMembersError } = await supabase
            .from('members')
            .select('id, membership_start_date, membership_end_date, branch_id, gym_id')
            .eq('gym_id', gymId)

        if (allMembersError) {
            console.error('Error fetching members for gym dashboard:', allMembersError)
        }

        const membersByBranch: Record<string, { id: string; membership_start_date?: string | null; membership_end_date?: string | null }[]> = {}
        if (allMembers && Array.isArray(allMembers)) {
            for (const m of allMembers as any[]) {
                const bId = m.branch_id || '_unassigned'
                if (!membersByBranch[bId]) membersByBranch[bId] = []
                membersByBranch[bId].push({ id: m.id, membership_start_date: m.membership_start_date, membership_end_date: m.membership_end_date })
            }
        }

        // Get financial data and member counts for each branch
        const branchDataPromises = branches.map(async (branch) => {
            // Get financial data using the existing P&L function
            const { data: pnlData, error: pnlError } = await supabase.rpc('get_branch_pnl', {
                p_branch: branch.id,
                p_start: null, // Get all time data
                p_end: null
            })
            // Get member counts from preloaded membersByBranch map
            const members = membersByBranch[branch.id] || []

            let total_income = 0
            let total_expenses = 0
            let member_count = 0
            let active_members = 0

            // Calculate financial totals
            if (!pnlError && pnlData) {
                const normalizedData = (pnlData as any[]).map((r: any) => ({
                    total_income: Number(r.total_income || 0),
                    total_expense: Number(r.total_expense || 0)
                }))

                total_income = normalizedData.reduce((sum, r) => sum + r.total_income, 0)
                total_expenses = normalizedData.reduce((sum, r) => sum + r.total_expense, 0)
            }

            // Calculate member stats
            if (members) {
                member_count = members.length
                // Determine active members based on membership_end_date (if present)
                const now = new Date()
                active_members = members.filter(m => {
                    const end = m.membership_end_date ? new Date(m.membership_end_date) : null
                    // if no end date, assume active; otherwise end date in future => active
                    return !end || end >= now
                }).length
            }

            const net_profit = total_income - total_expenses

            return {
                ...branch,
                total_income,
                total_expenses,
                net_profit,
                member_count,
                active_members
            } as BranchDashboardData
        })

        const branchData = await Promise.all(branchDataPromises)

        // Calculate summary
        const summary = {
            total_branches: branchData.length,
            total_income: branchData.reduce((sum, b) => sum + b.total_income, 0),
            total_expenses: branchData.reduce((sum, b) => sum + b.total_expenses, 0),
            total_profit: branchData.reduce((sum, b) => sum + b.net_profit, 0),
            // use allMembers for gym-wide totals (includes unassigned members)
            total_members: (allMembers && Array.isArray(allMembers)) ? allMembers.length : branchData.reduce((sum, b) => sum + b.member_count, 0),
            active_members: (allMembers && Array.isArray(allMembers)) ? (() => {
                const now = new Date()
                return (allMembers as any[]).filter(m => {
                    const start = m.membership_start_date ? new Date(m.membership_start_date) : null
                    const end = m.membership_end_date ? new Date(m.membership_end_date) : null
                    const started = !start || start <= now
                    const notEnded = !end || end >= now
                    return started && notEnded
                }).length
            })() : branchData.reduce((sum, b) => sum + b.active_members, 0)
        }

        return {
            branches: branchData,
            summary
        }
    } catch (err) {
        console.error('Unexpected error fetching gym dashboard data:', err)
        return null
    }
}