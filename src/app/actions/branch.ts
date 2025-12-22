'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    message?: string
    error?: string
    success?: boolean
}

export async function createBranch(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const email = formData.get('email') as string
    const branchName = formData.get('branchName') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const gymId = formData.get('gymId') as string
    
    // Manager name only - email and phone will be branch's
    const managerName = formData.get('managerName') as string

    if (!email || !branchName || !phone || !gymId || !managerName) {
        return { error: 'All fields including Manager Name are required' }
    }

    const supabase = createAdminClient()

    try {
        // 1. Create the Branch record with manager name
        const { data: branch, error: branchError } = await supabase
            .from('branches')
            .insert({
                name: branchName,
                email: email,
                phone: phone,
                address: address,
                gym_id: gymId,
                manager_name: managerName,
                status: 'active'
            })
            .select()
            .single()

        if (branchError) {
            console.error('Error creating branch:', branchError)
            return { error: 'Failed to create branch record: ' + branchError.message }
        }

        // Fetch Gym Name to include in metadata
        const { data: gym } = await supabase.from('gyms').select('name').eq('id', gymId).single()
        const gymName = gym?.name || 'My Gym'

        // 2. Create the Branch Manager User in Auth using branch email
        const { data: authData, error: userError } = await supabase.auth.admin.createUser({
            email: email, // Using branch email for manager login
            password: 'gymbranch123',
            email_confirm: true,
            user_metadata: {
                role: 'branch_admin',
                full_name: managerName,
                gym_id: gymId,
                branch_id: branch.id,
                branch_name: branchName,
                gym_name: gymName,
                force_password_change: true
            }
        })

        if (userError) {
            // Rollback: delete the branch if user creation fails
            await supabase.from('branches').delete().eq('id', branch.id)
            console.error('Error creating branch manager user:', userError)
            return { error: userError.message }
        }

        // 3. Create/Update Profile entry for the manager
        if (authData?.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: email, // Branch email
                    full_name: managerName,
                    phone: phone, // Branch phone
                    role: 'branch_admin',
                    gym_id: gymId,
                    branch_id: branch.id,
                    updated_at: new Date().toISOString()
                })

            if (profileError) {
                console.error('Error creating manager profile:', profileError)
                // Continue anyway - profile might be created by trigger
            }
        }

        revalidatePath('/gym/listed-branches')
        return {
            success: true,
            message: `Branch "${branchName}" created successfully with manager "${managerName}". Login: ${email}, Password: "gymbranch123"`
        }
    } catch (err) {
        console.error('Unexpected error:', err)
        return { error: 'Something went wrong' }
    }
}

export async function deleteBranch(branchId: string): Promise<ActionState> {
    if (!branchId) return { error: 'Branch ID is required' }

    const supabase = createAdminClient()

    try {
        // 1. Get all profiles associated with this branch to delete their auth accounts
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('branch_id', branchId)

        if (profileError) {
            console.error('Error fetching branch profiles:', profileError)
            return { error: 'Failed to fetch branch staff details' }
        }

        // 2. Delete each auth user
        if (profiles && profiles.length > 0) {
            for (const profile of profiles) {
                await supabase.auth.admin.deleteUser(profile.id)
            }
        }

        // 3. Delete the branch record (this will automatically clean up remaining profile entries via trigger/cascade if set)
        const { error: branchError } = await supabase
            .from('branches')
            .delete()
            .eq('id', branchId)

        if (branchError) {
            console.error('Error deleting branch record:', branchError)
            return { error: branchError.message }
        }

        revalidatePath('/gym/listed-branches')
        return { success: true, message: 'Branch and all associated staff deleted successfully' }
    } catch (err) {
        console.error('Unexpected error during branch deletion:', err)
        return { error: 'Failed to delete branch' }
    }
}

export type BranchSettings = {
    // Basic Information
    branchName: string
    branchCode: string
    description: string
    established_year: string
    member_capacity: string
    address: string
    email: string
    phone: string
    whatsapp: string
    website: string
    social_media: string

    // Operating Hours
    operating_hours: Record<string, { open: string; close: string; closed: boolean }>

    // Facilities & Amenities
    facilities: string[]
    amenities: string[]
    special_features: string

    // Gallery (handled separately for file uploads)
    // images: string[]

    // Additional Information
    rules: string
    policies: string
    emergency_contact: string
    manager_name: string
    certifications: string
    nearby_landmarks: string
}

export async function saveBranchSettings(branchId: string, formData: FormData, uploadedImages: string[] = []): Promise<ActionState> {
    if (!branchId) return { error: 'Branch ID is required' }

    const supabase = createAdminClient()

    try {
        const getString = (key: string, def = '') => {
            const v = formData.get(key)
            return v === null ? def : String(v)
        }
        const getBool = (key: string) => {
            const v = formData.get(key)
            return v === 'on' || v === 'true'
        }
        const parseJSON = (key: string) => {
            const v = formData.get(key)
            if (!v) return []
            try {
                return JSON.parse(String(v))
            } catch {
                return []
            }
        }

        const branchData: Partial<BranchSettings> = {
            // Basic Information
            branchName: getString('branchName'),
            branchCode: getString('branchCode'),
            description: getString('description'),
            established_year: getString('established'),
            member_capacity: getString('capacity'),
            address: getString('address'),
            email: getString('email'),
            phone: getString('phone'),
            whatsapp: getString('whatsapp'),
            website: getString('website'),
            social_media: getString('socialMedia'),

            // Operating Hours - build JSON object from form data
            operating_hours: (() => {
                const mondayOpen = getString('mondayOpen');
                const mondayClose = getString('mondayClose');

                const hours = {
                monday: {
                    open: getString('mondayOpen'),
                    close: getString('mondayClose'),
                    closed: getBool('mondayClosed')
                },
                tuesday: {
                    open: getString('tuesdayOpen'),
                    close: getString('tuesdayClose'),
                    closed: getBool('tuesdayClosed')
                },
                wednesday: {
                    open: getString('wednesdayOpen'),
                    close: getString('wednesdayClose'),
                    closed: getBool('wednesdayClosed')
                },
                thursday: {
                    open: getString('thursdayOpen'),
                    close: getString('thursdayClose'),
                    closed: getBool('thursdayClosed')
                },
                friday: {
                    open: getString('fridayOpen'),
                    close: getString('fridayClose'),
                    closed: getBool('fridayClosed')
                },
                saturday: {
                    open: getString('saturdayOpen'),
                    close: getString('saturdayClose'),
                    closed: getBool('saturdayClosed')
                },
                sunday: {
                    open: getString('sundayOpen'),
                    close: getString('sundayClose'),
                    closed: getBool('sundayClosed')
                }
            };
            return hours;
            })(),

            // Facilities & Amenities
            facilities: parseJSON('facilities'),
            amenities: parseJSON('amenities'),

            // Additional Information
            rules: getString('rules'),
            policies: getString('policies'),
            emergency_contact: getString('emergency'),
            manager_name: getString('manager'),
            certifications: getString('certifications'),
            nearby_landmarks: getString('nearby'),
        }

        // Handle special fields that need processing
        const holidayHours = formData.get('holidayHours') as string
        const peakHours = formData.get('peakHours') as string
        const specialFeatures = formData.get('specialFeatures') as string

        // Build payload for update
        const updatePayload: Record<string, unknown> = {
            name: branchData.branchName,
            branch_code: branchData.branchCode,
            description: branchData.description,
            established_year: branchData.established_year ? parseInt(branchData.established_year) : null,
            member_capacity: branchData.member_capacity ? parseInt(branchData.member_capacity) : null,
            address: branchData.address,
            phone: branchData.phone,
            email: branchData.email,
            website: branchData.website,
            social_media: branchData.social_media,
            whatsapp: branchData.whatsapp,
            operating_hours: branchData.operating_hours,
            holiday_hours: holidayHours,
            peak_hours: peakHours,
            facilities: branchData.facilities,
            amenities: branchData.amenities,
            special_features: specialFeatures,
            images: uploadedImages,
            rules: branchData.rules,
            policies: branchData.policies,
            emergency_contact: branchData.emergency_contact,
            manager_name: branchData.manager_name,
            certifications: branchData.certifications,
            nearby_landmarks: branchData.nearby_landmarks,
            updated_at: new Date().toISOString()
        }

        // Try to update; if the database schema is missing columns we will remove them and retry.
        const maxRetries = 5
        let attempt = 0
        let lastError: unknown = null

        while (attempt < maxRetries) {
            const { error } = await supabase
                .from('branches')
                .update(updatePayload)
                .eq('id', branchId)

            if (!error) {
                lastError = null
                break
            }

            lastError = error

            // Detect missing column name from common Postgres / Supabase messages
            const msg = String(error.message || '')
            const singleQuoteMatch = msg.match(/Could not find the '([^']+)' column/i)
            const doubleQuoteMatch = msg.match(/column \"([^\"]+)\" does not exist/i)
            const missingCol = singleQuoteMatch ? singleQuoteMatch[1] : doubleQuoteMatch ? doubleQuoteMatch[1] : null

            if (missingCol && Object.prototype.hasOwnProperty.call(updatePayload, missingCol)) {
                // Remove the problematic column and retry
                delete updatePayload[missingCol]
                attempt++
                continue
            }

            // If we couldn't parse a missing column or payload doesn't contain it, stop retrying
            break
        }

        if (lastError) {
            console.error('Error updating branch settings after retries:', lastError)
            const lastErrorMessage =
                lastError && typeof lastError === 'object' && 'message' in lastError
                    ? String((lastError as { message?: unknown }).message)
                    : String(lastError)
            return { error: 'Failed to save branch settings: ' + lastErrorMessage }
        }

        revalidatePath('/branch/settings')
        return { success: true, message: 'Branch information saved successfully' }
    } catch (err) {
        console.error('Unexpected error saving branch settings:', err)
        return { error: 'Something went wrong while saving' }
    }
}

export async function getBranchSettings(branchId: string) {
    if (!branchId) return null

    const supabase = createAdminClient()

    try {
        const { data: branch, error } = await supabase
            .from('branches')
            .select('*')
            .eq('id', branchId)
            .single()

        if (error) {
            console.error('Error fetching branch settings:', error)
            return null
        }

        return branch
    } catch (err) {
        console.error('Unexpected error fetching branch settings:', err)
        return null
    }
}

export interface BranchDashboardData {
    branch: {
        id: string
        name: string
        address?: string
        phone?: string
        manager_name?: string
        status: 'active' | 'inactive'
        member_capacity?: number
        established_year?: number
    }
    financials: {
        total_income: number
        total_expenses: number
        net_profit: number
        monthly_revenue: number
        year_revenue: number
    }
    members: {
        total_members: number
        active_members: number
        inactive_members: number
        pending_members: number
    }
    plans: {
        total_plans: number
        active_plans: number
    }
    recent_activity: {
        new_members_today: number
        new_members_this_week: number
        // monetary totals for today
        todays_income: number
        todays_expenses: number
        // legacy counts (optional)
        payments_today?: number
        payments_this_week?: number
    }
}

export async function getBranchDashboardData(branchId: string): Promise<BranchDashboardData | null> {
    if (!branchId) return null

    const supabase = createAdminClient()

    try {
        // Get branch basic info
        const { data: branch, error: branchError } = await supabase
            .from('branches')
            .select('id, name, address, phone, manager_name, status, member_capacity, established_year')
            .eq('id', branchId)
            .single()

        if (branchError) {
            console.error('Error fetching branch:', branchError)
            return null
        }

        // Get financial data using P&L function
        const { data: pnlData, error: pnlError } = await supabase.rpc('get_branch_pnl', {
            p_branch: branchId,
            p_start: null,
            p_end: null
        })

        let total_income = 0
        let total_expenses = 0
        let monthly_revenue = 0
        let year_revenue = 0

        if (!pnlError && pnlData) {
            const normalizedData = (pnlData as any[]).map((r: any) => ({
                total_income: Number(r.total_income || 0),
                total_expense: Number(r.total_expense || 0)
            }))

            total_income = normalizedData.reduce((sum, r) => sum + r.total_income, 0)
            total_expenses = normalizedData.reduce((sum, r) => sum + r.total_expense, 0)

            // Calculate monthly revenue (last 30 days)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            // Filter data for last 30 days if we have date information
            // For now, we'll approximate monthly revenue as 1/12 of total (can be improved)
            monthly_revenue = Math.round(total_income / 12)
        }

        const net_profit = total_income - total_expenses

        // Get member statistics (use start/end dates because membership_status column may not exist)
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id, membership_start_date, membership_end_date, created_at')
            .eq('branch_id', branchId)

        let total_members = 0
        let active_members = 0
        let inactive_members = 0
        let pending_members = 0
        let new_members_today = 0
        let new_members_this_week = 0

        if (!membersError && members) {
            total_members = members.length

            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)

            // active: start <= now (or no start) AND (no end OR end >= now)
            active_members = members.filter((m: any) => {
                const start = m.membership_start_date ? new Date(m.membership_start_date) : null
                const end = m.membership_end_date ? new Date(m.membership_end_date) : null
                const started = !start || start <= now
                const notEnded = !end || end >= now
                return started && notEnded
            }).length

            // pending: membership_start_date in future
            pending_members = members.filter((m: any) => {
                const start = m.membership_start_date ? new Date(m.membership_start_date) : null
                return start && start > now
            }).length

            // inactive: ended before now
            inactive_members = members.filter((m: any) => {
                const end = m.membership_end_date ? new Date(m.membership_end_date) : null
                return end && end < now
            }).length

            new_members_today = members.filter((m: any) => {
                const createdDate = new Date(m.created_at)
                return createdDate >= today
            }).length

            new_members_this_week = members.filter((m: any) => {
                const createdDate = new Date(m.created_at)
                return createdDate >= weekAgo
            }).length
        }

        // Get plans count
        const { data: plans, error: plansError } = await supabase
            .from('plans')
            .select('id, status')
            .eq('branch_id', branchId)

        let total_plans = 0
        let active_plans = 0

        if (!plansError && plans) {
            total_plans = plans.length
            active_plans = plans.filter(p => p.status === 'active').length
        }

        // Get recent payments and compute today's income (completed payments) and today's expenses via PnL RPC
        const { data: paymentsAll, error: paymentsError } = await supabase
            .from('payments')
            .select('amount, status, created_at')
            .eq('branch_id', branchId)

        let todays_income = 0
        let todays_expenses = 0

        if (!paymentsError && paymentsAll) {
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)

            // Sum completed payments for today -> income
            todays_income = (paymentsAll as any[]).reduce((sum, p) => {
                const paymentDate = new Date(p.created_at)
                if (p.status === 'completed' && paymentDate >= today) return sum + Number(p.amount || 0)
                return sum
            }, 0)
        }

        // Use P&L RPC to get today's expense total (if RPC supports date range)
        try {
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const todayStart = today.toISOString().split('T')[0]
            const todayEndDate = new Date(today)
            todayEndDate.setHours(23, 59, 59, 999)
            const todayEnd = todayEndDate.toISOString()

            const { data: pnlToday, error: pnlTodayError } = await supabase.rpc('get_branch_pnl', {
                p_branch: branchId,
                p_start: todayStart,
                p_end: todayEnd
            })

            if (!pnlTodayError && pnlToday && Array.isArray(pnlToday) && pnlToday.length > 0) {
                // normalized row may contain total_expense
                const row = pnlToday[0] as any
                todays_expenses = Number(row.total_expense || 0)
            } else if (pnlTodayError) {
                console.error('Error fetching today PnL:', pnlTodayError)
            }
        } catch (err) {
            console.error('Unexpected error fetching today PnL:', err)
        }

        // Calculate precise monthly_revenue from payments and transactions for current month
        try {
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const { data: paymentsMonth, error: paymentsMonthError } = await supabase
                .from('payments')
                .select('amount, status, created_at')
                .eq('branch_id', branchId)
                .gte('created_at', startOfMonth.toISOString())

            let monthRev = 0
            if (!paymentsMonthError && paymentsMonth) {
                // Sum all payments' amount in the current month regardless of status (completed/pending)
                monthRev += (paymentsMonth as any[]).reduce((s, p) => s + Number(p.amount || 0), 0)
            } else if (paymentsMonthError) {
                console.error('Error fetching month payments:', paymentsMonthError)
            }
            // include transaction incomes in month if transactions table exists
            try {
                const { data: transMonth, error: transMonthError } = await supabase
                    .from('transactions')
                    .select('amount, type, status, created_at')
                    .eq('branch_id', branchId)
                    .gte('created_at', startOfMonth.toISOString())
                if (!transMonthError && transMonth) {
                    monthRev += (transMonth as any[]).reduce((s, t) => {
                        if (t.type === 'income' && (!t.status || t.status === 'completed')) return s + Number(t.amount || 0)
                        return s
                    }, 0)
                } else if (transMonthError) {
                    console.error('Error fetching month transactions:', transMonthError)
                }
            } catch (e) {
                console.error('Transactions query failed:', e)
            }

            monthly_revenue = Math.round(monthRev)
        } catch (e) {
            console.error('Error computing monthly_revenue:', e)
        }

        // Calculate year-to-date revenue (current year) from payments and transactions
        try {
            const now = new Date()
            const startOfYear = new Date(now.getFullYear(), 0, 1)
            const { data: paymentsYtd, error: paymentsYtdError } = await supabase
                .from('payments')
                .select('amount, status, created_at')
                .eq('branch_id', branchId)
                .gte('created_at', startOfYear.toISOString())

            let ytdRev = 0
            if (!paymentsYtdError && paymentsYtd) {
                // include all payments amounts regardless of status as requested
                ytdRev += (paymentsYtd as any[]).reduce((s, p) => s + Number(p.amount || 0), 0)
            } else if (paymentsYtdError) {
                console.error('Error fetching YTD payments:', paymentsYtdError)
            }

            // include transactions incomes if transactions table exists
            try {
                const { data: transYtd, error: transYtdError } = await supabase
                    .from('transactions')
                    .select('amount, type, status, created_at')
                    .eq('branch_id', branchId)
                    .gte('created_at', startOfYear.toISOString())
                if (!transYtdError && transYtd) {
                    ytdRev += (transYtd as any[]).reduce((s, t) => {
                        if (t.type === 'income' && (!t.status || t.status === 'completed')) return s + Number(t.amount || 0)
                        return s
                    }, 0)
                } else if (transYtdError) {
                    console.error('Error fetching YTD transactions:', transYtdError)
                }
            } catch (e) {
                console.error('Transactions YTD query failed:', e)
            }

            year_revenue = Math.round(ytdRev)
        } catch (e) {
            console.error('Error computing year_revenue:', e)
        }

        return {
            branch,
            financials: {
                total_income,
                total_expenses,
                net_profit,
                monthly_revenue,
                year_revenue
            },
            members: {
                total_members,
                active_members,
                inactive_members,
                pending_members
            },
            plans: {
                total_plans,
                active_plans
            },
            recent_activity: {
                new_members_today,
                new_members_this_week,
                todays_income,
                todays_expenses
            }
        }
    } catch (err) {
        console.error('Unexpected error fetching branch dashboard data:', err)
        return null
    }
}