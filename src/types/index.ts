export interface User {
    id: string
    email: string
    role: 'admin' | 'trainer' | 'member' | 'gym_admin'
    full_name?: string
    avatar_url?: string
    created_at: string
    updated_at: string
}

export interface Member {
    id: string
    user_id: string
    full_name: string
    email: string
    phone: string
    date_of_birth?: string
    gender?: 'male' | 'female' | 'other'
    address?: string
    emergency_contact?: string
    emergency_phone?: string
    membership_plan_id?: string
    membership_start_date?: string
    membership_end_date?: string
    status: 'active' | 'inactive' | 'suspended'
    avatar_url?: string
    created_at: string
    updated_at: string
}

export interface Trainer {
    id: string
    user_id: string
    full_name: string
    email: string
    phone: string
    specialization?: string[]
    experience_years?: number
    certifications?: string[]
    avatar_url?: string
    status: 'active' | 'inactive'
    created_at: string
    updated_at: string
}

export interface MembershipPlan {
    id: string
    name: string
    description?: string
    duration_months: number
    price: number
    features?: string[]
    status: 'active' | 'inactive'
    created_at: string
    updated_at: string
}

export interface Attendance {
    id: string
    member_id: string
    check_in_time: string
    check_out_time?: string
    created_at: string
}

export interface Employee {
    id: string
    gym_id: string
    branch_id: string
    full_name: string
    email?: string
    phone: string
    designation?: string
    address?: string
    date_of_birth?: string
    gender?: 'male' | 'female' | 'other'
    emergency_contact?: string
    emergency_phone?: string
    joining_date: string
    status: 'active' | 'inactive' | 'terminated'
    created_at: string
    updated_at: string
}

export interface EmployeeAttendance {
    id: string
    employee_id: string
    check_in_time?: string | null
    check_out_time?: string | null
    date: string
    status: 'present' | 'absent' | 'late' | 'leave'
    created_at: string
    updated_at: string
}

export interface Payment {
    id: string
    member_id: string
    amount: number
    payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer'
    payment_type: 'membership' | 'personal_training' | 'other'
    status: 'pending' | 'completed' | 'failed' | 'refunded'
    transaction_id?: string
    description?: string
    created_at: string
    updated_at: string
}

export interface DashboardStats {
    totalMembers: number
    activeMembers: number
    totalRevenue: number
    monthlyRevenue: number
    todayAttendance: number
    pendingPayments: number
    expiringMemberships: number
}
