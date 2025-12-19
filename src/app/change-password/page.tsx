'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/signin')
            }
        }
        checkUser()
    }, [router, supabase.auth])

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
                data: { force_password_change: false }
            })

            if (error) {
                toast.error('Failed to change password', {
                    description: error.message,
                })
                return
            }

            toast.success('Password updated!', {
                description: 'Your security is our priority. Redirecting to dashboard...',
            })

            // Wait a moment for the toast and then redirect
            setTimeout(() => {
                router.push('/gym/dashboard')
                router.refresh()
            }, 1000)

        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    if (!mounted) return null

    return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
            {/* Main Floating Card Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[1200px] h-[800px] bg-white rounded-[32px] shadow-2xl overflow-hidden flex"
            >
                {/* Left Side - Form */}
                <div className="w-full lg:w-[45%] h-full p-8 lg:p-16 flex flex-col justify-center relative">
                    <div className="max-w-md mx-auto w-full space-y-8">
                        {/* Header */}
                        <div>
                            <div className="w-12 h-12 bg-emerald-900 rounded-xl flex items-center justify-center mb-6">
                                <KeyRound className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
                                Security First
                            </h1>
                            <p className="mt-2 text-stone-500">
                                This is your first login. Please set a new secure password to continue.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-stone-700 font-medium">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 rounded-xl !bg-white border-2 border-emerald-600 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-emerald-800 focus-visible:ring-emerald-800 focus-visible:border-emerald-800 transition-all pr-12 font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-stone-700 font-medium">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-12 rounded-xl !bg-white border-2 border-emerald-600 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-emerald-800 focus-visible:ring-emerald-800 focus-visible:border-emerald-800 transition-all font-medium"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-900/20 text-md"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Password & Continue'
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="text-center text-sm text-stone-500">
                            Once updated, you'll be automatically redirected to your dashboard.
                        </div>
                    </div>
                </div>

                {/* Right Side - Image */}
                <div className="hidden lg:block w-[55%] h-full p-4 pl-0">
                    <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-emerald-900">
                        <Image
                            src="/images/gym2.jpg"
                            alt="Gym Motivation"
                            fill
                            className="object-cover opacity-80 mix-blend-overlay"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-transparent" />

                        {/* Text Overlay on Image */}
                        <div className="absolute bottom-12 left-12 right-12 text-white z-10">
                            <h2 className="text-4xl font-bold mb-4 leading-tight">
                                Secure Your Account,<br />
                                Empower Your Journey.
                            </h2>
                            <p className="text-emerald-100/80 text-lg">
                                Your privacy and security are our top priorities. Set a strong password to keep your data safe.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
