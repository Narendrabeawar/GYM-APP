'use client'

import { useState, useEffect, Suspense } from 'react'

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updatePassword } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordContent() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        // Check if we have valid session for password reset
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error || !session) {
                setIsValidToken(false)
                toast.error('Invalid or expired reset link', {
                    description: 'Please request a new password reset.',
                })
            } else {
                setIsValidToken(true)
            }
        }

        checkSession()
    }, [supabase.auth])

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long'
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return 'Password must contain at least one lowercase letter'
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return 'Password must contain at least one uppercase letter'
        }
        if (!/(?=.*\d)/.test(password)) {
            return 'Password must contain at least one number'
        }
        return null
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate password
        const passwordError = validatePassword(password)
        if (passwordError) {
            toast.error('Invalid password', {
                description: passwordError,
            })
            return
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            toast.error('Passwords do not match', {
                description: 'Please make sure both passwords are the same.',
            })
            return
        }

        setIsLoading(true)

        try {
            const result = await updatePassword(password)

            if (result.success) {
                setIsSuccess(true)
                toast.success('Password updated successfully!', {
                    description: 'You can now sign in with your new password.',
                })

                // Redirect to signin after 3 seconds
                setTimeout(() => {
                    router.push('/signin')
                }, 3000)
            } else {
                toast.error('Failed to update password', {
                    description: result.error,
                })
            }
        } catch (error) {
            toast.error('Something went wrong', {
                description: 'Please try again later.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isValidToken === null) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
                    <p className="text-stone-600">Verifying reset link...</p>
                </div>
            </div>
        )
    }

    if (isValidToken === false) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto text-center space-y-6"
                >
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 mb-2">Invalid Reset Link</h1>
                        <p className="text-stone-600">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/forgot-password')}
                        className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-xl"
                    >
                        Request New Reset
                    </Button>
                </motion.div>
            </div>
        )
    }

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
                        {/* Back Button */}
                        <Link
                            href="/signin"
                            className="inline-flex items-center text-sm text-stone-600 hover:text-stone-800 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Sign In
                        </Link>

                        {/* Header */}
                        <div>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 overflow-hidden">
                                <Image src="/images/Gymzi logo App.png" alt="Gymzi" width={48} height={48} className="object-contain" />
                            </div>
                            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
                                {isSuccess ? 'Password Updated!' : 'Set New Password'}
                            </h1>
                            <p className="mt-2 text-stone-500">
                                {isSuccess
                                    ? 'Your password has been successfully updated. You can now sign in with your new password.'
                                    : 'Enter your new password below. Make sure it\'s strong and secure.'
                                }
                            </p>
                        </div>

                        {isSuccess ? (
                            /* Success Message */
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <p className="text-sm text-stone-500">
                                        Redirecting to sign in page in a few seconds...
                                    </p>
                                </div>

                                <Button
                                    onClick={() => router.push('/signin')}
                                    className="w-full h-12 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-900/20 text-md"
                                >
                                    Sign In Now
                                </Button>
                            </div>
                        ) : (
                            /* Form */
                            <form onSubmit={handleResetPassword} className="space-y-6">
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
                                    <p className="text-xs text-stone-500">
                                        Password must be at least 8 characters with uppercase, lowercase, and numbers.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-stone-700 font-medium">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="h-12 rounded-xl bg-white! border-2 border-emerald-600 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-emerald-800 focus-visible:ring-emerald-800 focus-visible:border-emerald-800 transition-all pr-12 font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
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
                                            Updating Password...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Footer */}
                        <div className="text-center text-sm text-stone-500">
                            Remember your password?{' '}
                            <Link href="/signin" className="text-emerald-800 font-bold hover:text-emerald-950 transition-colors">
                                Sign in
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
                                Strength in<br />
                                Recovery.
                            </h2>
                            <p className="text-emerald-100/80 text-lg">
                                Set a strong password and continue your fitness journey with renewed energy.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
                    <p className="text-stone-600">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
