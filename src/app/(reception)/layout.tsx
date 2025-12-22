'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
    LayoutDashboard,
    Users,
    IndianRupee,
    Settings,
    LogOut,
    Menu,
    X,
    UserPlus,
    ShieldCheck,
    Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

const navigation = [
    { name: 'Dashboard', href: '/reception/dashboard', icon: LayoutDashboard },
    { name: 'New Enquiry', href: '/reception/enquiry', icon: UserPlus },
    { name: 'Members List', href: '/reception/members', icon: Users },
    { name: 'Payments', href: '/reception/payments', icon: IndianRupee },
    { name: 'Accounts', href: '/reception/accounts', icon: Wallet },
    { name: 'Settings', href: '/reception/settings', icon: Settings },
]

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userName, setUserName] = useState('Receptionist')
    const [branchName, setBranchName] = useState('My Branch')
    const [userRole, setUserRole] = useState<string | null>(null)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserName(user.user_metadata.full_name || 'Receptionist')
                setBranchName(user.user_metadata.branch_name || 'My Branch')

                // Fetch user role from profiles table
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    setUserRole(profile.role)
                }
            }
        }
        getUser()
    }, [supabase])

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
            toast.success('Signed out successfully')
            router.push('/signin')
            router.refresh()
        } catch (error) {
            toast.error('Failed to sign out')
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Mobile sidebar backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                <motion.aside
                    initial={{ x: -300 }}
                    animate={{ x: sidebarOpen ? 0 : -300 }}
                    className="fixed top-0 left-0 z-50 h-full w-72 bg-white/95 backdrop-blur-xl border-r border-green-200 lg:transform-none! transition-transform duration-300 flex flex-col"
                >
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                                <Image src="/images/Gymzi logo App.png" alt="Gymzi" width={40} height={40} className="object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold bg-linear-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent leading-none">
                                    Gymzi
                                </span>
                                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Reception Portal</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-stone-500 hover:text-emerald-900 hover:bg-emerald-50/50"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)}>
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-linear-to-r from-emerald-800/10 to-teal-800/10 text-emerald-900 border border-emerald-800/20'
                                            : 'text-stone-500 hover:text-emerald-900 hover:bg-emerald-50/50'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </motion.div>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Admin Desk Link - Separate section above user profile (Only visible to branch_admin) */}
                    {userRole === 'branch_admin' && (
                        <div className="mt-auto px-4 pb-3">
                            <Link href="/branch/dashboard" onClick={() => setSidebarOpen(false)}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border border-blue-200 hover:from-blue-100 hover:to-indigo-100"
                                >
                                    <ShieldCheck className="w-5 h-5" />
                                    <span className="font-medium">Admin Desk</span>
                                </motion.div>
                            </Link>
                        </div>
                    )}

                    {/* User profile at very bottom */}
                    <div className={`p-4 border-t border-green-200 space-y-3 ${userRole !== 'branch_admin' ? 'mt-auto' : ''}`}>
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-linear-to-br from-emerald-800 to-teal-800 text-white font-bold">
                                    {userName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-900 truncate">{userName}</p>
                                <p className="text-xs text-stone-500 truncate uppercase">{branchName}</p>
                            </div>
                        </div>

                        {/* Sign Out Button */}
                        <Button
                            variant="outline"
                            className="w-full border-emerald-100 text-emerald-800 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all rounded-xl font-medium bg-white"
                            onClick={handleSignOut}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </motion.aside>
            </AnimatePresence>

            {/* Main content */}
            <div className="lg:ml-72 min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 border-b border-green-200 bg-white/80 backdrop-blur-xl">
                    <div className="h-full px-4 lg:px-8 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-stone-500 hover:text-emerald-900 hover:bg-emerald-50/50"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        <div className="flex-1" />

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-sm font-medium text-stone-900">{userName}</p>
                                <p className="text-xs text-stone-500 uppercase tracking-tighter">{branchName}</p>
                            </div>
                            <Avatar className="w-9 h-9 border-2 border-green-200 shadow-sm">
                                <AvatarFallback className="bg-linear-to-br from-emerald-800 to-teal-800 text-white font-bold text-sm">
                                    {userName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    )
}
