'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { resetPassword } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const router = useRouter()

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await resetPassword(email)

            if (result.success) {
                setIsSubmitted(true)
                toast.success('Reset email sent!', {
                    description: 'Check your inbox for password reset instructions.',
                })
            } else {
                toast.error('Failed to send reset email', {
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
                                {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
                            </h1>
                            <p className="mt-2 text-stone-500">
                                {isSubmitted
                                    ? 'We sent a password reset link to your email address.'
                                    : 'No worries! Enter your email and we\'ll send you reset instructions.'
                                }
                            </p>
                        </div>

                        {!isSubmitted ? (
                            /* Form */
                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-stone-700 font-medium">Email Address</Label>
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

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-900/20 text-md"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending Reset Email...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Send Reset Email
                                        </>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            /* Success Message */
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <p className="text-sm text-stone-500">
                                        Didn&apos;t receive the email? Check your spam folder or{' '}
                                        <button
                                            onClick={() => setIsSubmitted(false)}
                                            className="text-emerald-800 font-medium hover:text-emerald-950 transition-colors"
                                        >
                                            try again
                                        </button>
                                    </p>
                                </div>

                                <Button
                                    onClick={() => router.push('/signin')}
                                    className="w-full h-12 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-900/20 text-md"
                                >
                                    Back to Sign In
                                </Button>
                            </div>
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
                                Stay Strong,<br />
                                Stay Fit.
                            </h2>
                            <p className="text-emerald-100/80 text-lg">
                                Your fitness journey continues. Reset your password and get back to achieving your goals.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
