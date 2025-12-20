'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
    LayoutDashboard,
    Users,
    UserCog,
    CreditCard,
    Calendar,
    IndianRupee,
    Settings,
    LogOut,
    Menu,
    X,
    Dumbbell,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Listed GYM', href: '/listed-gym', icon: Users },
    { name: 'Trainers', href: '/trainers', icon: UserCog },
    { name: 'Plans', href: '/plans', icon: CreditCard },
    { name: 'Attendance', href: '/attendance', icon: Calendar },
    { name: 'Payments', href: '/payments', icon: IndianRupee },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

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
                    className="fixed top-0 left-0 z-50 h-full w-72 bg-white/95 backdrop-blur-xl border-r border-green-200 lg:!transform-none transition-transform duration-300"
                >
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                                <Image src="/images/Gymzi logo App.png" alt="Gymzi" width={40} height={40} className="object-contain" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                                Gymzi
                            </span>
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
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)}>
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-gradient-to-r from-emerald-800/10 to-teal-800/10 text-emerald-900 border border-emerald-800/20'
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

                    {/* User profile */}
                    <div className="p-4 border-t border-green-200">
                        <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-800 to-teal-800 text-white">
                                    AD
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-900 truncate">Admin User</p>
                                <p className="text-xs text-stone-500 truncate">admin@gymflow.com</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full border-emerald-100 text-emerald-800 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all rounded-xl font-medium"
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
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-stone-900">Admin User</p>
                                <p className="text-xs text-stone-500">Super Administrator</p>
                            </div>
                            <Avatar className="w-9 h-9">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-800 to-teal-800 text-white text-sm">
                                    AD
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
