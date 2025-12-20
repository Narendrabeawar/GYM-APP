'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type Member = {
    id: string
    full_name?: string
    father_name?: string
    email?: string
    phone?: string
    emergency_contact?: string
    status?: string
    membership_start_date?: string
    membership_end_date?: string
    membership_plan_id?: string
    blood_group?: string
    height?: number
    weight?: number
    medical_conditions?: string
    fitness_goal?: string
}

interface MemberProfileModalProps {
    isOpen: boolean
    onClose: () => void
    member: Member | null
}

export default function MemberProfileModal({ isOpen, onClose, member }: MemberProfileModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-2xl border border-emerald-200 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <DialogTitle className="text-2xl font-bold text-emerald-900">Member Profile</DialogTitle>
                        <DialogDescription className="text-sm text-stone-600 mt-1">View detailed information for this member</DialogDescription>
                    </div>
                </div>

                {member && (
                    <div className="space-y-6">
                        {/* Header with Avatar */}
                        <div className="flex items-center gap-4 pb-4 border-b border-emerald-200">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                                {member.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-emerald-900">{member.full_name}</h2>
                                <p className="text-sm text-stone-600">Member ID: {member.id?.slice(0, 8)}</p>
                                <Badge className={`mt-2 capitalize ${member.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : member.status === 'inactive' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                                    {member.status || 'Unknown'}
                                </Badge>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">👤</span>
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-emerald-100">
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Full Name</p>
                                    <p className="text-sm font-medium text-stone-900">{member.full_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Father's Name</p>
                                    <p className="text-sm font-medium text-stone-900">{member.father_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Phone</p>
                                    <p className="text-sm font-medium text-stone-900">{member.phone || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Email</p>
                                    <p className="text-sm font-medium text-stone-900">{member.email || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Membership Information */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs">💳</span>
                                Membership Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-teal-100">
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Start Date</p>
                                    <p className="text-sm font-medium text-stone-900">{member.membership_start_date ? new Date(member.membership_start_date).toLocaleDateString() : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">End Date</p>
                                    <p className="text-sm font-medium text-stone-900">{member.membership_end_date ? new Date(member.membership_end_date).toLocaleDateString() : '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Plan</p>
                                    <p className="text-sm font-medium text-stone-900">Monthly Basic</p>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">🚨</span>
                                Emergency Contact
                            </h3>
                            <div className="bg-white/50 p-4 rounded-lg border border-red-100">
                                <p className="text-xs text-stone-600 uppercase font-semibold mb-2">Contact Number</p>
                                <p className="text-sm font-medium text-stone-900">{member.emergency_contact || '-'}</p>
                            </div>
                        </div>

                        {/* Health Information */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">❤️</span>
                                Health Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-red-100">
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Blood Group</p>
                                    <p className="text-sm font-medium text-stone-900">{member.blood_group || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Height (cm)</p>
                                    <p className="text-sm font-medium text-stone-900">{member.height || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Weight (kg)</p>
                                    <p className="text-sm font-medium text-stone-900">{member.weight || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Fitness Goal</p>
                                    <p className="text-sm font-medium text-stone-900">{member.fitness_goal || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-stone-600 uppercase font-semibold">Medical Conditions</p>
                                    <p className="text-sm font-medium text-stone-900">{member.medical_conditions || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-emerald-200">
                            <Link href={`/reception/settings/members/${member.id}/edit`} className="flex-1">
                                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700">
                                    Edit Member
                                </Button>
                            </Link>
                            <Button variant="outline" className="flex-1" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
