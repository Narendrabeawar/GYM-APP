'use client'

import React, { useActionState, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, UserPlus, X, User, Phone, Mail, MapPin, Calendar, Heart, Shield, Plus } from 'lucide-react'
import { createEmployee, updateEmployee, type EmployeeActionState } from '@/app/actions/employee'
import { createClient } from '@/lib/supabase/client'

const initialState: EmployeeActionState = {
    message: '',
    error: '',
    success: false
}

interface AddEmployeeFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    gymId?: string | null
    branchId?: string | null
    onSuccess?: () => void
    editMode?: boolean
    employeeData?: {
        id: string
        full_name: string
        email?: string
        phone: string
        designation?: string
        address?: string
        date_of_birth?: string
        gender?: 'male' | 'female' | 'other' | string
        emergency_contact?: string
        emergency_phone?: string
    } | null
}

export default function AddEmployeeForm({
    open,
    onOpenChange,
    gymId,
    branchId,
    onSuccess,
    editMode = false,
    employeeData = null
}: AddEmployeeFormProps) {
    const [state, formAction, isPending] = useActionState(createEmployee, initialState)
    const [showCustomDesignation, setShowCustomDesignation] = useState(false)
    const [customDesignation, setCustomDesignation] = useState('')
    const [savingDesignation, setSavingDesignation] = useState(false)
    const [selectedDesignation, setSelectedDesignation] = useState<string | undefined>(editMode ? employeeData?.designation || undefined : undefined)
    const [designationsList, setDesignationsList] = useState<string[]>([])

    // Load designations for this branch to populate dropdown
    React.useEffect(() => {
        if (!branchId) return
        const load = async () => {
            try {
                const client = createClient()
                const { data, error } = await client
                    .from('designations')
                    .select('name')
                    .eq('branch_id', branchId)
                    .order('name', { ascending: true })

                if (error) {
                    console.error('Error fetching designations:', error)
                    return
                }
                if (data) {
                    setDesignationsList(data.map((d: any) => d.name))
                } else {
                    setDesignationsList([])
                }
            } catch (err) {
                console.error('Fatal error loading designations:', err)
            }
        }
        load()
    }, [branchId])

    // Handle success state (guard so onSuccess runs only once per successful submit)
    const successHandledRef = useRef(false)
    React.useEffect(() => {
        if (state.success && !successHandledRef.current) {
            successHandledRef.current = true
            console.log('Form success:', state.message, 'Edit mode:', editMode)
            // If a custom designation was created, add it to local list so dropdown can reuse immediately
            if (showCustomDesignation && customDesignation) {
                setDesignationsList((prev) => {
                    if (!prev.includes(customDesignation)) return [...prev, customDesignation]
                    return prev
                })
            }
            onSuccess?.()
            // close the modal locally as well to avoid race where parent takes longer
            onOpenChange(false)
        }
        if (!state.success) {
            // reset guard when not in success state
            successHandledRef.current = false
        }
    }, [state.success, state.message, onSuccess, editMode, onOpenChange])

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Clean Background */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
                        onClick={() => onOpenChange(false)}
                    >
                        {/* Simple green accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-green-900/20"></div>
                    </motion.div>

                    {/* Main Modal Container */}
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 200 }}
                            className="w-full max-w-5xl"
                        >
                            {/* Clean Card Container */}
                            {/* Header Section - Moved Outside Card */}
                        <div className="relative bg-gradient-to-r from-emerald-600 to-green-700 p-8 rounded-t-2xl overflow-hidden mb-0">
                            {/* Simple pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                            </div>

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                                        <UserPlus className="w-8 h-8 text-emerald-600" />
                                    </div>

                                    <div>
                                                    <motion.h1
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.4 }}
                                                        className="text-3xl font-bold text-white mb-2"
                                                    >
                                                        {editMode ? 'Edit Employee' : 'Add New Employee'}
                                                    </motion.h1>
                                                    <motion.p
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.5 }}
                                                        className="text-emerald-100 text-lg"
                                                    >
                                                        {editMode ? 'Update employee information and details' : 'Create a comprehensive employee profile with modern design'}
                                                    </motion.p>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onOpenChange(false)}
                                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </motion.button>
                            </div>
                        </div>

                        <Card className="relative bg-white shadow-2xl border-0 overflow-hidden rounded-t-none">
                            {/* Form Content */}
                            <CardContent className="p-8 max-h-[70vh] overflow-y-auto">
                                        <form action={formAction} onSubmit={editMode ? async (e) => {
                                            e.preventDefault()
                                            const formData = new FormData(e.currentTarget)
                                            if (employeeData?.id) {
                                                const result = await updateEmployee(employeeData.id, formData)
                                                if (result.success) {
                                                    onSuccess?.()
                                                }
                                            }
                                        } : undefined} className="space-y-8">
                                            {/* Hidden Fields */}
                                            <input type="hidden" name="gymId" value={gymId || ''} />
                                            <input type="hidden" name="branchId" value={branchId || ''} />
                                            {editMode && employeeData?.id && (
                                                <input type="hidden" name="employeeId" value={employeeData.id} />
                                            )}
                                            {/* Hidden designation value (selected or custom) */}
                                            <input type="hidden" name="designation" value={showCustomDesignation ? customDesignation : (selectedDesignation || '')} />

                                            {/* Personal Information Section */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="group"
                                            >
                                                <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-200/50 shadow-sm group-hover:shadow-md transition-all duration-300">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg">
                                                            <User className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
                                                            <p className="text-gray-600">Basic employee details and contact information</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                <User className="w-4 h-4 text-emerald-600" />
                                                                Full Name <span className="text-red-500">*</span>
                                                            </Label>
                                                            <motion.div
                                                                whileFocus={{ scale: 1.02 }}
                                                                className="relative"
                                                            >
                                                                <Input
                                                                    name="fullName"
                                                                    placeholder="Enter full name"
                                                                    required
                                                                    defaultValue={editMode ? employeeData?.full_name || '' : ''}
                                                                    className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-200"
                                                                />
                                                            </motion.div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                <Phone className="w-4 h-4 text-blue-600" />
                                                                Phone Number <span className="text-red-500">*</span>
                                                            </Label>
                                                            <motion.div
                                                                whileFocus={{ scale: 1.02 }}
                                                                className="relative"
                                                            >
                                                                <Input
                                                                    name="phone"
                                                                    placeholder="Enter phone number"
                                                                    required
                                                                    defaultValue={editMode ? employeeData?.phone || '' : ''}
                                                                    className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-200"
                                                                />
                                                            </motion.div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                <Mail className="w-4 h-4 text-purple-600" />
                                                                Email Address
                                                            </Label>
                                                            <motion.div
                                                                whileFocus={{ scale: 1.02 }}
                                                                className="relative"
                                                            >
                                                                <Input
                                                                    name="email"
                                                                    type="email"
                                                                    placeholder="Enter email address"
                                                                    defaultValue={editMode ? employeeData?.email || '' : ''}
                                                                    className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-200"
                                                                />
                                                            </motion.div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                <Shield className="w-4 h-4 text-orange-600" />
                                                                Designation
                                                            </Label>
                                                            <motion.div whileFocus={{ scale: 1.02 }}>
                                                                <div className="flex items-center gap-3">
                                                                    <Select
                                                                        name="designationSelect"
                                                                        value={selectedDesignation ?? (editMode ? employeeData?.designation || undefined : undefined)}
                                                                        onValueChange={(value) => {
                                                                            setShowCustomDesignation(false)
                                                                            setCustomDesignation('')
                                                                            setSelectedDesignation(value)
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800 h-auto min-w-[200px]">
                                                                            <SelectValue placeholder="Select designation" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="z-[90] bg-white/95 backdrop-blur-xl border-2 border-gray-200">
                                                                            {designationsList.length > 0 ? (
                                                                                designationsList.map((d) => (
                                                                                    <SelectItem key={d} value={d} className="hover:bg-emerald-50 focus:bg-emerald-50">{d}</SelectItem>
                                                                                ))
                                                                            ) : (
                                                                            <SelectItem value="no-designations" disabled className="text-muted-foreground">
                                                                                No saved designations — create one
                                                                            </SelectItem>
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>

                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setShowCustomDesignation(true)
                                                                            setCustomDesignation(editMode ? employeeData?.designation || '' : '')
                                                                            setSelectedDesignation(undefined)
                                                                        }}
                                                                        className="px-3 py-2 h-auto flex items-center gap-2 rounded-xl"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                        Create New
                                                                    </Button>
                                                                </div>
                                                            </motion.div>

                                                            {/* Custom Designation Input */}
                                                            <AnimatePresence>
                                                                {showCustomDesignation && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: "auto" }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <motion.div
                                                                            initial={{ y: -10 }}
                                                                            animate={{ y: 0 }}
                                                                            exit={{ y: -10 }}
                                                                            className="space-y-2"
                                                                        >
                                                                            <Label className="text-sm font-medium text-slate-700">
                                                                                Custom Designation
                                                                            </Label>
                                                                            <div className="flex items-center gap-3">
                                                                                <Input
                                                                                    value={customDesignation}
                                                                                    onChange={(e) => setCustomDesignation(e.target.value)}
                                                                                    placeholder="Enter custom designation"
                                                                                    className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800 max-w-[420px]"
                                                                                />
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    onClick={async () => {
                                                                                        if (!customDesignation.trim() || savingDesignation) return
                                                                                        try {
                                                                                            setSavingDesignation(true)
                                                                                            const client = createClient()
                                                                                            const insertPayload: any = {
                                                                                                name: customDesignation.trim()
                                                                                            }
                                                                                            if (gymId) insertPayload.gym_id = gymId
                                                                                            if (branchId) insertPayload.branch_id = branchId
                                                                                            const { data: inserted, error: insertErr } = await client
                                                                                                .from('designations')
                                                                                                .insert(insertPayload)
                                                                                                .select()
                                                                                                .limit(1)
                                                                                                .maybeSingle()

                                                                                            if (insertErr) {
                                                                                                console.error('Error inserting designation:', insertErr)
                                                                                            } else if (inserted) {
                                                                                                // update local list and select the new designation
                                                                                                setDesignationsList((prev) => {
                                                                                                    if (!prev.includes(inserted.name)) return [...prev, inserted.name]
                                                                                                    return prev
                                                                                                })
                                                                                                setSelectedDesignation(inserted.name)
                                                                                                setShowCustomDesignation(false)
                                                                                                setCustomDesignation('')
                                                                                            }
                                                                                        } catch (err) {
                                                                                            console.error('Fatal error saving designation:', err)
                                                                                        } finally {
                                                                                            setSavingDesignation(false)
                                                                                        }
                                                                                    }}
                                                                                    className="px-4 py-2 h-auto flex items-center gap-2 rounded-xl"
                                                                                    disabled={savingDesignation}
                                                                                >
                                                                                    {savingDesignation ? 'Saving...' : 'Save'}
                                                                                </Button>
                                                                            </div>
                                                                        </motion.div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Additional Information Section */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="group"
                                            >
                                                <div className="bg-green-50/50 p-6 rounded-xl border border-green-200/50 shadow-sm group-hover:shadow-md transition-all duration-300">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
                                                            <Calendar className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-800">Additional Information</h3>
                                                            <p className="text-gray-600">Optional details for comprehensive profile</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                                Date of Birth
                                                            </Label>
                                                            <motion.div
                                                                whileFocus={{ scale: 1.02 }}
                                                                className="relative"
                                                            >
                                                                <Input
                                                                    name="dateOfBirth"
                                                                    type="date"
                                                                    defaultValue={editMode ? employeeData?.date_of_birth || '' : ''}
                                                                    className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800"
                                                                />
                                                            </motion.div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700">
                                                                Gender
                                                            </Label>
                                                            <motion.div whileFocus={{ scale: 1.02 }}>
                                                                <Select name="gender" defaultValue={editMode ? employeeData?.gender || '' : ''}>
                                                                    <SelectTrigger className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800 h-auto">
                                                                        <SelectValue placeholder="Select gender" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="z-[90] bg-white/95 backdrop-blur-xl border-2 border-gray-200">
                                                                        <SelectItem value="male" className="hover:bg-emerald-50 focus:bg-emerald-50">Male</SelectItem>
                                                                        <SelectItem value="female" className="hover:bg-emerald-50 focus:bg-emerald-50">Female</SelectItem>
                                                                        <SelectItem value="other" className="hover:bg-emerald-50 focus:bg-emerald-50">Other</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </motion.div>
                                                        </div>

                                                        <div className="space-y-3 lg:col-span-1">
                                                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-green-600" />
                                                                Address
                                                            </Label>
                                                            <motion.div whileFocus={{ scale: 1.02 }}>
                                                                <Textarea
                                                                    name="address"
                                                                    placeholder="Enter complete address"
                                                                    rows={3}
                                                                    defaultValue={editMode ? employeeData?.address || '' : ''}
                                                                    className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800 placeholder-gray-400 resize-none"
                                                                />
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Emergency Contact Section */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="group"
                                            >
                                                <div className="bg-green-50/50 p-6 rounded-xl border border-green-200/50 shadow-sm group-hover:shadow-md transition-all duration-300">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center shadow-lg">
                                                            <Heart className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-800">Emergency Contact</h3>
                                                            <p className="text-gray-600">Important contact information for emergencies</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700">
                                                                Emergency Contact Name
                                                            </Label>
                                                            <motion.div
                                                                whileFocus={{ scale: 1.02 }}
                                                                className="relative"
                                                            >
                                                                <Input
                                                                    name="emergencyContact"
                                                                    placeholder="Contact person name"
                                                                    defaultValue={editMode ? employeeData?.emergency_contact || '' : ''}
                                                                    className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-200"
                                                                />
                                                            </motion.div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700">
                                                                Emergency Phone Number
                                                            </Label>
                                                            <motion.div
                                                                whileFocus={{ scale: 1.02 }}
                                                                className="relative"
                                                            >
                                                                <Input
                                                                    name="emergencyPhone"
                                                                    placeholder="Emergency contact number"
                                                                    defaultValue={editMode ? employeeData?.emergency_phone || '' : ''}
                                                                    className="pl-4 pr-4 py-3 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-200"
                                                                />
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Action Buttons */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                                className="flex justify-end gap-4 pt-8 border-t border-gray-200"
                                            >
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => onOpenChange(false)}
                                                        className="px-8 py-4 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                                                        disabled={isPending}
                                                    >
                                                        <X className="w-5 h-5 mr-2" />
                                                        Cancel
                                                    </Button>
                                                </motion.div>

                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Button
                                                        type="submit"
                                                        disabled={isPending}
                                                        className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 flex items-center"
                                                    >
                                                        {isPending ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                                {editMode ? 'Updating Employee...' : 'Creating Employee...'}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserPlus className="w-5 h-5 mr-2" />
                                                                {editMode ? 'Update Employee' : 'Create Employee'}
                                                            </>
                                                        )}
                                                    </Button>
                                                </motion.div>
                                            </motion.div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
