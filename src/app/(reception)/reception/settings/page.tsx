 'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Settings, Users, Grid as GridIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
    const router = useRouter()
    const handleOpenMembers = () => router.push('/reception/settings/members')

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold">Reception Settings</h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, idx) => {
                    if (idx !== 0) {
                        // All cards except first - Coming Soon
                        return (
                            <motion.div
                                key={idx}
                                className="rounded-xl p-6 bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200 flex flex-col items-center justify-center min-h-64"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.32, ease: 'easeOut' }}
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
                                        <GridIcon className="text-slate-600 w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-lg text-stone-700">Coming Soon</h3>
                                    <p className="text-sm text-stone-500 mt-2">This feature is under development</p>
                                </div>
                            </motion.div>
                        )
                    }

                    const title = idx === 0 ? 'Edit Gym Member' : `Card ${idx + 1}`
                    const variants = [
                        { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', icon: 'text-emerald-700' },
                        { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200', icon: 'text-amber-700' },
                        { bg: 'from-sky-50 to-indigo-50', border: 'border-sky-200', icon: 'text-sky-700' },
                    ]
                    const variant = variants[idx % variants.length]
                    const Icon = idx === 0 ? Users : idx % 3 === 1 ? Settings : GridIcon

                    return (
                        <motion.div
                            key={idx}
                            className={`rounded-xl p-6 cursor-pointer flex flex-col justify-between bg-linear-to-br ${variant.bg} border ${variant.border}`}
                            onClick={idx === 0 ? handleOpenMembers : undefined}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -8, boxShadow: '0px 18px 40px rgba(2,6,23,0.12)' }}
                            whileTap={{ scale: 0.995 }}
                            transition={{ duration: 0.32, ease: 'easeOut' }}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-white/40 flex items-center justify-center shadow-sm`}>
                                    <Icon className={`${variant.icon} w-6 h-6`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-stone-800">{title}</h3>
                                    {idx === 0 && <p className="text-sm text-stone-600 mt-1">View and edit all members (active / non-active)</p>}
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-stone-500">Manage settings</div>
                                <Button size="sm" className="bg-white/90 text-stone-800 shadow-sm">Open</Button>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Member management moved to dedicated page */}
        </div>
    )
}
