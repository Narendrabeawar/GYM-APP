'use client'

import { useState, useEffect, useActionState } from 'react'
import { registerMember, type MemberActionState } from '@/app/actions/member'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { MemberRegistrationForm } from '@/components/MemberRegistrationForm'

const initialState: MemberActionState = {
    message: '',
    error: '',
    success: false
}

export default function MemberRegistrationPage() {
    const [gymId, setGymId] = useState<string | null>(null)
    const [branchId, setBranchId] = useState<string | null>(null)
    const router = useRouter()

    const [state, formAction] = useActionState(registerMember, initialState)
    const supabase = createClient()

    useEffect(() => {
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata) {
                const gid = user.user_metadata.gym_id
                const bid = user.user_metadata.branch_id
                setGymId(gid)
                setBranchId(bid)
            }
        }
        getSession()
    }, [supabase])

    useEffect(() => {
        if (state?.success) {
            toast.success(state.message || 'Member registered successfully')
            router.push('/reception/members')
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state, router])

    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
            <MemberRegistrationForm
                onSubmit={formAction}
                gymId={gymId}
                branchId={branchId}
            />
        </div>
    )
}
