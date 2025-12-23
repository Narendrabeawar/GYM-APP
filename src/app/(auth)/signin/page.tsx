'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import WelcomePopup from '@/components/WelcomePopup'

export default function SignInPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showWelcome, setShowWelcome] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error('Sign in failed', {
                    description: error.message,
                })
                return
            }

            if (data?.user) {
                const { role, force_password_change } = data.user.user_metadata

                // Show welcome popup instead of toast
                setShowWelcome(true)
                sessionStorage.setItem('welcomed', 'true')

                // Redirect after popup closes (2 seconds)
                setTimeout(() => {
                    if (force_password_change) {
                        router.push('/change-password')
                    } else if (role === 'admin') {
                        router.push('/dashboard')
                    } else if (role === 'gym_admin') {
                        router.push('/gym/dashboard')
                    } else if (role === 'branch_admin') {
                        router.push('/branch/dashboard')
                    } else {
                        router.push('/dashboard')
                    }

                    router.refresh()
                }, 2100) // 2 seconds for popup + 100ms buffer
            }
        } catch {
            toast.error('Something went wrong', {
                description: 'Please try again later.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <WelcomePopup isOpen={showWelcome} />
            <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
            {/* Main Floating Card Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: showWelcome ? 0 : 1, scale: showWelcome ? 0.9 : 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-[1200px] h-[800px] bg-white rounded-[32px] shadow-2xl overflow-hidden flex"
                style={{ pointerEvents: showWelcome ? 'none' : 'auto' }}
            >
                {/* Left Side - Form */}
                <div className="w-full lg:w-[45%] h-full p-8 lg:p-16 flex flex-col justify-center relative">
                    <div className="max-w-md mx-auto w-full space-y-8">
                        {/* Header */}
                        <div>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 overflow-hidden">
                                <Image src="/images/Gymzi logo App.png" alt="Gymzi" width={48} height={48} className="object-contain" />
                            </div>
                            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
                                Welcome Back to Gymzi
                            </h1>
                            <p className="mt-2 text-stone-500">
                                Enter your details to access your account.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSignIn} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-stone-700 font-medium">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@Gymzi.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 rounded-xl bg-white! border-2 border-emerald-600 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-emerald-800 focus-visible:ring-emerald-800 focus-visible:border-emerald-800 transition-all pr-12 font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-stone-700 font-medium">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 rounded-xl bg-white! border-2 border-emerald-600 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-emerald-800 focus-visible:ring-emerald-800 focus-visible:border-emerald-800 transition-all pr-12 font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm font-semibold text-emerald-800 hover:text-emerald-900 transition-colors"
                                    >
                                        Forgot Password
                                    </Link>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-900/20 text-md"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="text-center text-sm text-stone-500">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-emerald-800 font-bold hover:text-emerald-950 transition-colors">
                                Sign up
                            </Link>
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
                        <div className="absolute inset-0 bg-linear-to-t from-emerald-950/90 via-emerald-900/40 to-transparent" />

                        {/* Text Overlay on Image */}
                        <div className="absolute bottom-12 left-12 right-12 text-white z-10">
                            <h2 className="text-4xl font-bold mb-4 leading-tight">
                                Transform your body,<br />
                                Transform your life.
                            </h2>
                            <p className="text-emerald-100/80 text-lg">
                                Join the community of elite fitness enthusiasts and manage your progress seamlessly.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
            </div>
        </>
    )
}
