'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export default function SignUpPage() {
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full max-w-2xl"
            >
                <Card className="glass border-green-200 shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* Left Side - Message */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-emerald-900 to-teal-900 text-white"
                            >
                                <div className="space-y-4">
                                    <div className="w-32 h-32 relative">
                                        <Image
                                            src="/images/Gymzi logo App.png"
                                            alt="Gymzi Logo"
                                            width={160}
                                            height={160}
                                            className="object-contain"
                                        />
                                    </div>
                                    <h1 className="text-6xl font-bold">Gymzi</h1>
                                    <p className="text-white/80 text-lg leading-relaxed">
                                        Your complete gym management solution
                                    </p>
                                    <div className="pt-4 space-y-3 text-white/70">
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5" />
                                            <span>Support Team Available 24/7</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5" />
                                            <span>Direct Support from Admin</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Side - Contact Info */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="p-8 md:p-12 flex flex-col justify-center bg-white"
                            >
                                <div className="space-y-6 text-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                                            For Signup
                                        </h2>
                                        <p className="text-lg text-emerald-700 font-semibold">
                                            Please contact Gymzi Admin
                                        </p>
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.5 }}
                                        className="space-y-4 pt-4"
                                    >
                                        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                                            <p className="text-sm text-muted-foreground mb-3">Contact Information</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-center gap-3">
                                                    <Mail className="w-5 h-5 text-emerald-600" />
                                                    <a href="mailto:admin@gymzi.com" className="text-emerald-700 font-medium hover:underline">
                                                        admin@gymzi.com
                                                    </a>
                                                </div>
                                                <div className="flex items-center justify-center gap-3">
                                                    <Phone className="w-5 h-5 text-emerald-600" />
                                                    <a href="tel:+919999999999" className="text-emerald-700 font-medium hover:underline">
                                                        +91 9999 999 999
                                                    </a>
                                                </div>
                                                <div className="flex items-center justify-center gap-3">
                                                    <MapPin className="w-5 h-5 text-emerald-600" />
                                                    <span className="text-emerald-700 font-medium">Gymzi HQ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.7 }}
                                        className="pt-4 space-y-3"
                                    >
                                        <p className="text-xs text-muted-foreground">
                                            Our admin team will help you get started with your gym account.
                                        </p>
                                        <Link href="/signin">
                                            <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white">
                                                Back to Sign In
                                            </Button>
                                        </Link>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
