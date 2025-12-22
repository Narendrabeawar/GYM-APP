"use client"

import { useState, useEffect } from "react"
import LinkCard from "@/components/ui/link-card"
import { UserPlus, Users, IndianRupee, Settings, Wallet } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ReceptionDashboardPage() {
    const [pendingCount, setPendingCount] = useState<number>(0)
    const [activeMembers, setActiveMembers] = useState<number>(0)
    const [expiringSoon, setExpiringSoon] = useState<number>(0)
    const [expiredMembers, setExpiredMembers] = useState<number>(0)
    const supabase = createClient()

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('branch_id')
                    .eq('id', user.id)
                    .single()

                if (!profile?.branch_id) return

                // Fetch pending enquiries
                const { data: enquiriesData } = await supabase
                    .from('enquiries')
                    .select('id', { count: 'exact' })
                    .eq('branch_id', profile.branch_id)
                    .eq('status', 'pending')

                if (enquiriesData) {
                    setPendingCount(enquiriesData.length)
                }

                // Fetch member stats
                const today = new Date().toISOString().split('T')[0]
                const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

                // Active members (membership_end_date > today)
                const { data: activeData } = await supabase
                    .from('members')
                    .select('id', { count: 'exact' })
                    .eq('branch_id', profile.branch_id)
                    .eq('status', 'active')
                    .gt('membership_end_date', today)

                if (activeData) {
                    setActiveMembers(activeData.length)
                }

                // Expiring soon (membership_end_date between today and 30 days)
                const { data: expiringData } = await supabase
                    .from('members')
                    .select('id', { count: 'exact' })
                    .eq('branch_id', profile.branch_id)
                    .eq('status', 'active')
                    .lte('membership_end_date', thirtyDaysLater)
                    .gt('membership_end_date', today)

                if (expiringData) {
                    setExpiringSoon(expiringData.length)
                }

                // Expired members (membership_end_date <= today)
                const { data: expiredData } = await supabase
                    .from('members')
                    .select('id', { count: 'exact' })
                    .eq('branch_id', profile.branch_id)
                    .lte('membership_end_date', today)

                if (expiredData) {
                    setExpiredMembers(expiredData.length)
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err)
            }
        }

        fetchDashboardData()
    }, [supabase])

    return (
        <div className="max-w-6xl mx-auto py-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <LinkCard
                    href="/reception/enquiry"
                    title={`New Enquiry (${pendingCount})`}
                    description="Start a new visitor enquiry and capture details."
                    icon={UserPlus}
                    variant="emerald"
                />

                <LinkCard
                    href="/reception/members"
                    title={`Members • ${activeMembers} Active`}
                    description={`${expiringSoon} expiring soon • ${expiredMembers} expired`}
                    icon={Users}
                    variant="teal"
                />

                <LinkCard
                    href="/reception/payments"
                    title="Payments"
                    description="Collect fees and review recent payment activity."
                    icon={IndianRupee}
                    variant="green"
                />

                <LinkCard
                    href="/reception/accounts"
                    title="Accounts"
                    description="View income, expenses and financial statements."
                    icon={Wallet}
                    variant="emerald"
                />

                <LinkCard
                    href="/reception/settings"
                    title="Settings"
                    description="Configure reception preferences and branch options."
                    icon={Settings}
                    variant="emerald"
                />
            </div>

            {/* Placeholder banner removed per request */}
        </div>
    )
}
