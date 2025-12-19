'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Dumbbell, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function SignUpPage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignUp = async (e: React.FormEvent) => {
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
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'member',
                    },
                },
            })

            if (error) {
                toast.error('Sign up failed', {
                    description: error.message,
                })
                return
            }

            if (data?.user) {
                toast.success('Account created!', {
                    description: 'Redirecting to dashboard...',
                })
                router.push('/dashboard')
            }
        } catch (error) {
            toast.error('Something went wrong', {
                description: 'Please try again later.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
            {/* Main Floating Card Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[1200px] lg:h-[900px] h-auto bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col lg:flex-row"
            >
                {/* Left Side - Form */}
                <div className="w-full lg:w-[45%] lg:h-full p-8 lg:p-12 xl:p-16 flex flex-col justify-center relative bg-white">
                    <div className="max-w-md mx-auto w-full space-y-6">
                        {/* Header */}
                        <div>
                            <div className="w-12 h-12 bg-emerald-900 rounded-xl flex items-center justify-center mb-6">
                                <Dumbbell className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
                                Get Started
                            </h1>
                            <p className="mt-2 text-stone-500">
                                Create your account now to manage your fitness journey.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSignUp} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-stone-700 font-medium">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Enter Your Name Here"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="h-12 rounded-xl !bg-white border-2 border-emerald-600 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-emerald-800 focus-visible:ring-emerald-800 focus-visible:border-emerald-800 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-stone-700 font-medium">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@gymflow.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 rounded-xl !bg-white border-2 border-emerald-600 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-emerald-800 focus-visible:ring-emerald-800 focus-visible:border-emerald-800 transition-all font-medium"
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
                                <Label htmlFor="confirmPassword" className="text-stone-700 font-medium">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="h-12 rounded-xl !bg-white border-2 border-emerald-600 text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:ring-emerald-800 focus-visible:ring-emerald-800 focus-visible:border-emerald-800 transition-all pr-12 font-medium"
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
                                className="w-full h-12 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-900/20 text-md mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="text-center text-sm text-stone-500">
                            Already have an account?{' '}
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
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-transparent" />

                        {/* Text Overlay on Image */}
                        <div className="absolute bottom-12 left-12 right-12 text-white z-10">
                            <h2 className="text-4xl font-bold mb-4 leading-tight">
                                Build your dream body.<br />
                                Start today.
                            </h2>
                            <p className="text-emerald-100/80 text-lg">
                                Experience world-class training facilities and tracking at your fingertips.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
