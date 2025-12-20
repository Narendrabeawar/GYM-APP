export const APP_CONFIG = {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Gymzi',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    description: 'Modern Gym Management System',
} as const

export const ROUTES = {
    home: '/',
    signin: '/signin',
    signup: '/signup',
    dashboard: '/dashboard',
    members: '/members',
    trainers: '/trainers',
    plans: '/plans',
    attendance: '/attendance',
    payments: '/payments',
    settings: '/settings',
} as const

export const MEMBERSHIP_PLANS = [
    {
        id: '1',
        name: 'Basic',
        duration: 1,
        price: 999,
        features: ['Gym Access', 'Locker Facility', 'Basic Equipment'],
    },
    {
        id: '2',
        name: 'Premium',
        duration: 3,
        price: 2499,
        features: ['Gym Access', 'Locker Facility', 'All Equipment', 'Group Classes'],
    },
    {
        id: '3',
        name: 'Elite',
        duration: 6,
        price: 4499,
        features: [
            'Gym Access',
            'Locker Facility',
            'All Equipment',
            'Group Classes',
            'Personal Trainer',
            'Diet Plan',
        ],
    },
    {
        id: '4',
        name: 'Annual',
        duration: 12,
        price: 7999,
        features: [
            'Gym Access',
            'Locker Facility',
            'All Equipment',
            'Group Classes',
            'Personal Trainer',
            'Diet Plan',
            'Spa Access',
        ],
    },
] as const

export const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
] as const

export const MEMBER_STATUS = [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'inactive', label: 'Inactive', color: 'gray' },
    { value: 'suspended', label: 'Suspended', color: 'red' },
] as const

export const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
] as const
