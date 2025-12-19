'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User,
    Phone,
    HeartPulse,
    CreditCard,
    Plus,
    ArrowRight,
    Droplets,
    Users,
    Shield,
    CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface MemberRegistrationFormProps {
    onSubmit: (formData: FormData) => void
    gymId: string | null
    branchId: string | null
}

const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
]

export function MemberRegistrationForm({
    onSubmit,
    gymId,
    branchId,
}: MemberRegistrationFormProps) {
    const [plans, setPlans] = useState<Array<{id: string; name: string; price: number}>>([])
    const [formData, setFormData] = useState({
        fullName: '',
        fatherName: '',
        phone: '',
        email: '',
        dob: '',
        gender: 'male',
        address: '',
        bloodGroup: '',
        height: '',
        weight: '',
        medicalConditions: '',
        fitnessGoal: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        membershipPlanId: '',
        startDate: new Date().toISOString().split('T')[0],
    })
    const [activeStep, setActiveStep] = useState(0)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const getPlans = async () => {
            if (gymId) {
                const { data: plansData } = await supabase
                    .from('membership_plans')
                    .select('*')
                    .eq('gym_id', gymId)
                    .eq('status', 'active')
                setPlans(plansData || [])
            }
        }
        getPlans()
    }, [gymId, supabase])

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formDataObj = new FormData(form)
        await onSubmit(formDataObj)
    }

    const steps = [
        { title: 'Personal Info', icon: User },
        { title: 'Health Details', icon: HeartPulse },
        { title: 'Emergency Contact', icon: Phone },
        { title: 'Membership', icon: CreditCard },
    ]

    const stepVariants = {
        hidden: { opacity: 0, x: 100 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -100 }
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold text-primary">
                        Member Registration
                    </h1>
                    <p className="text-muted-foreground mt-3 font-medium flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Enroll a new member into your branch.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/reception/members')}
                    className="border-primary text-primary hover:bg-accent/20 rounded-lg h-10"
                >
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    Back to Directory
                </Button>
            </motion.div>

            {/* Step Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between"
            >
                {steps.map((step, idx) => {
                    const Icon = step.icon
                    const isActive = idx === activeStep
                    const isCompleted = idx < activeStep

                    return (
                        <div key={idx} className="flex items-center flex-1">
                            <motion.div
                                onClick={() => idx <= activeStep && setActiveStep(idx)}
                                className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-sm cursor-pointer transition-all ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                                        : isCompleted
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                    <Icon className="w-5 h-5" />
                                )}
                            </motion.div>

                            {idx < steps.length - 1 && (
                                <div
                                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                                        isCompleted ? 'bg-primary' : 'bg-muted'
                                    }`}
                                />
                            )}
                        </div>
                    )
                })}
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Personal Information */}
                        {activeStep === 0 && (
                            <motion.div
                                key="step-1"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="border border-border shadow-xs overflow-hidden bg-white">
                                    <CardHeader className="bg-white border-b border-border">
                                        <CardTitle className="text-xl font-semibold flex items-center gap-3 text-foreground">
                                            <div className="p-2 bg-primary rounded-lg">
                                                <User className="w-6 h-6 text-primary-foreground" />
                                            </div>
                                            Personal Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <input type="hidden" name="gymId" value={gymId || ''} />
                                        <input type="hidden" name="branchId" value={branchId || ''} />

                                        {/* Full Name */}
                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Label htmlFor="fullName" className="text-gray-900 font-bold text-sm">
                                                Full Name *
                                            </Label>
                                            <Input
                                                id="fullName"
                                                name="fullName"
                                                placeholder="Enter full name"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                required
                                                className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            />
                                        </motion.div>

                                        {/* Father's Name */}
                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <Label htmlFor="fatherName" className="text-gray-900 font-bold text-sm">
                                                Father&apos;s Name
                                            </Label>
                                            <Input
                                                id="fatherName"
                                                name="fatherName"
                                                placeholder="Enter father's name"
                                                value={formData.fatherName}
                                                onChange={handleInputChange}
                                                className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            />
                                        </motion.div>

                                        {/* Phone and Email */}
                                        <motion.div
                                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-gray-900 font-bold text-sm">
                                                    Phone Number *
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    placeholder="+91 00000 00000"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-gray-900 font-bold text-sm">
                                                    Email Address
                                                </Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="member@email.com"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* Address */}
                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <Label htmlFor="address" className="text-gray-900 font-bold text-sm">
                                                Residential Address *
                                            </Label>
                                            <Textarea
                                                id="address"
                                                name="address"
                                                placeholder="Enter your complete residential address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                required
                                                className="min-h-28 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                                            />
                                        </motion.div>

                                        {/* DOB and Gender */}
                                        <motion.div
                                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="dob" className="text-gray-900 font-bold text-sm">
                                                    Date of Birth *
                                                </Label>
                                                <Input
                                                    id="dob"
                                                    name="dob"
                                                    type="date"
                                                    value={formData.dob}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender" className="text-gray-900 font-bold text-sm">
                                                    Gender *
                                                </Label>
                                                <select
                                                    id="gender"
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-11 rounded-md border-2 border-input bg-white text-foreground px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                                                >
                                                    {genders.map(g => (
                                                        <option key={g.value} value={g.value}>{g.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </motion.div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 2: Health Details */}
                        {activeStep === 1 && (
                            <motion.div
                                key="step-2"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="border border-border shadow-xs overflow-hidden bg-white">
                                    <CardHeader className="bg-white border-b border-border">
                                        <CardTitle className="text-xl font-semibold flex items-center gap-3 text-foreground">
                                            <div className="p-2 bg-primary rounded-lg">
                                                <HeartPulse className="w-6 h-6 text-primary-foreground" />
                                            </div>
                                            Health Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Label htmlFor="bloodGroup" className="text-foreground font-medium text-sm flex items-center gap-2">
                                                <Droplets className="w-4 h-4 text-primary" />
                                                Blood Group
                                            </Label>
                                            <select
                                                id="bloodGroup"
                                                name="bloodGroup"
                                                value={formData.bloodGroup}
                                                onChange={handleInputChange}
                                                className="w-full h-11 rounded-md border-2 border-input bg-white text-foreground px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                                            >
                                                <option value="">Select blood group</option>
                                                {bloodGroups.map(bg => (
                                                    <option key={bg} value={bg}>{bg}</option>
                                                ))}
                                            </select>
                                        </motion.div>

                                        {/* Height and Weight */}
                                        <motion.div
                                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="height" className="text-gray-900 font-bold text-sm">
                                                    Height (cm)
                                                </Label>
                                                <Input
                                                    id="height"
                                                    name="height"
                                                    type="number"
                                                    placeholder="170"
                                                    value={formData.height}
                                                    onChange={handleInputChange}
                                                    className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="weight" className="text-gray-900 font-bold text-sm">
                                                    Weight (kg)
                                                </Label>
                                                <Input
                                                    id="weight"
                                                    name="weight"
                                                    type="number"
                                                    placeholder="70"
                                                    value={formData.weight}
                                                    onChange={handleInputChange}
                                                    className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* Medical Conditions */}
                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <Label htmlFor="medicalConditions" className="text-gray-900 font-bold text-sm">
                                                Medical Conditions / Allergies (if any)
                                            </Label>
                                            <Textarea
                                                id="medicalConditions"
                                                name="medicalConditions"
                                                placeholder="Asthma, diabetes, heart conditions, allergies, etc."
                                                value={formData.medicalConditions}
                                                onChange={handleInputChange}
                                                className="min-h-24 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                                            />
                                        </motion.div>

                                        {/* Fitness Goal */}
                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <Label htmlFor="fitnessGoal" className="text-gray-900 font-bold text-sm">
                                                Fitness Goal
                                            </Label>
                                            <select
                                                id="fitnessGoal"
                                                name="fitnessGoal"
                                                value={formData.fitnessGoal}
                                                onChange={handleInputChange}
                                                className="w-full h-11 rounded-md border-2 border-input bg-white text-foreground px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                                            >
                                                <option value="">Select your fitness goal</option>
                                                <option value="weight_loss">Weight Loss</option>
                                                <option value="muscle_gain">Muscle Gain</option>
                                                <option value="strength">Build Strength</option>
                                                <option value="endurance">Improve Endurance</option>
                                                <option value="flexibility">Increase Flexibility</option>
                                                <option value="general_fitness">General Fitness</option>
                                                <option value="sports_training">Sports Training</option>
                                            </select>
                                        </motion.div>

                                        <motion.div
                                            className="p-5 bg-white border border-border rounded-lg"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm">Health Information</p>
                                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                                        Your health details help us provide personalized training programs and ensure your safety. All information is kept confidential and secure.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 3: Emergency Contact */}
                        {activeStep === 2 && (
                            <motion.div
                                key="step-3"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="border border-border shadow-xs overflow-hidden bg-white">
                                    <CardHeader className="bg-white border-b border-border">
                                        <CardTitle className="text-xl font-semibold flex items-center gap-3 text-foreground">
                                            <div className="p-2 bg-primary rounded-lg">
                                                <Phone className="w-6 h-6 text-primary-foreground" />
                                            </div>
                                            Emergency Contact
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Label htmlFor="emergencyContactName" className="text-gray-900 font-bold text-sm">
                                                Contact Name *
                                            </Label>
                                            <Input
                                                id="emergencyContactName"
                                                name="emergencyContactName"
                                                placeholder="Relative or friend's name"
                                                value={formData.emergencyContactName}
                                                onChange={handleInputChange}
                                                required
                                                className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            />
                                        </motion.div>

                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <Label htmlFor="emergencyContactPhone" className="text-gray-900 font-bold text-sm">
                                                Contact Phone Number *
                                            </Label>
                                            <Input
                                                id="emergencyContactPhone"
                                                name="emergencyContactPhone"
                                                placeholder="+91 00000 00000"
                                                value={formData.emergencyContactPhone}
                                                onChange={handleInputChange}
                                                required
                                                className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            />
                                        </motion.div>

                                        <motion.div
                                            className="p-5 bg-white border border-border rounded-lg"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm">Important Information</p>
                                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                                        Your emergency contact will be notified in case of any medical emergency or serious incidents. Keep this information accurate and up-to-date.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 4: Membership */}
                        {activeStep === 3 && (
                            <motion.div
                                key="step-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="border border-border shadow-xs overflow-hidden bg-white">
                                    <CardHeader className="bg-white border-b border-border">
                                        <CardTitle className="text-xl font-semibold flex items-center gap-3 text-foreground">
                                            <div className="p-2 bg-primary rounded-lg">
                                                <CreditCard className="w-6 h-6 text-primary-foreground" />
                                            </div>
                                            Membership Plan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Label htmlFor="membershipPlanId" className="text-gray-900 font-bold text-sm">
                                                Select Plan *
                                            </Label>
                                            <select
                                                id="membershipPlanId"
                                                name="membershipPlanId"
                                                value={formData.membershipPlanId}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-11 rounded-md border-2 border-input bg-white text-foreground px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                                            >
                                                <option value="">Select a membership plan</option>
                                                {plans.map((plan) => (
                                                    <option key={plan.id} value={plan.id}>
                                                        {plan.name} - â‚¹{plan.price}/month
                                                    </option>
                                                ))}
                                            </select>
                                            {plans.length === 0 && (
                                                <p className="text-xs text-amber-600 font-medium">No active plans found for this gym.</p>
                                            )}
                                        </motion.div>

                                        <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <Label htmlFor="startDate" className="text-gray-900 font-bold text-sm">
                                                Membership Start Date *
                                            </Label>
                                            <Input
                                                id="startDate"
                                                name="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                required
                                                className="h-11 border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            />
                                        </motion.div>

                                        <motion.div
                                            className="p-5 bg-white border border-border rounded-lg"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm">Registration Summary</p>
                                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                                        Member will be added to the directory and marked as active from the selected start date. They will have access to all gym facilities.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation and Submit - Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-4">
                        {/* Step Summary */}
                        <Card className="border border-border shadow-xs overflow-hidden bg-white">
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-foreground">Step {activeStep + 1} of {steps.length}</p>
                                    <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary"
                                            layoutId="progress"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                        disabled={activeStep === 0}
                                        variant="outline"
                                        className="flex-1 h-10"
                                    >
                                        ← Previous
                                    </Button>

                                    {activeStep < steps.length - 1 ? (
                                        <Button
                                            type="button"
                                            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                                        className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                    >
                                        Next →
                                    </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
                                        >
                                            Submit
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Card */}
                        <Card className="border border-border shadow-xs overflow-hidden bg-white">
                            <CardHeader className="bg-white border-b border-border pb-3">
                                <CardTitle className="text-sm font-semibold text-foreground">Quick Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 text-xs space-y-2 text-muted-foreground">
                                {formData.fullName && <p>👤 <span className="font-medium text-foreground">{formData.fullName}</span></p>}
                                {formData.phone && <p>📱 <span className="font-medium text-foreground">{formData.phone}</span></p>}
                                {formData.bloodGroup && <p>🩸 <span className="font-medium text-foreground">{formData.bloodGroup}</span></p>}
                                {formData.membershipPlanId && formData.membershipPlanId !== '' && <p>✓ Plan selected</p>}
                                {!formData.fullName && <p className="text-muted-foreground">Fill in your details...</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    )
}
