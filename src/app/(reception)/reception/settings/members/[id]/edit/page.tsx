'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { User, Heart, Phone, FileText, ArrowLeft } from 'lucide-react'

interface MemberFormData {
  full_name: string
  father_name?: string
  email?: string
  phone?: string
  address?: string
  blood_group?: string
  height?: number
  weight?: number
  medical_conditions?: string
  fitness_goal?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  date_of_birth?: string
  gender?: string
  status?: string
}

export default function EditMemberPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<MemberFormData>({
    full_name: '',
  })
  const [memberName, setMemberName] = useState('Member')

  useEffect(() => {
    const fetchMember = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .single()

        if (error) throw error
        if (data) {
          setFormData(data)
          setMemberName(data.full_name)
        }
      } catch (err) {
        console.error('Failed to fetch member:', err)
        toast.error('Failed to load member details')
      } finally {
        setIsLoading(false)
      }
    }

    if (memberId) fetchMember()
  }, [memberId, supabase])

  const handleInputChange = (key: keyof MemberFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name.trim()) {
      toast.error('Full name is required')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('members')
        .update(formData)
        .eq('id', memberId)

      if (error) throw error
      toast.success('Member updated successfully')
      router.push('/reception/settings/members')
    } catch (err) {
      console.error('Update failed:', err)
      toast.error('Failed to update member')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading member details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-stone-600 hover:text-emerald-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Member</h1>
          <p className="text-stone-500 mt-1">{memberName}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto space-y-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-0.5 bg-linear-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200/50 shadow-sm">
              <TabsTrigger
                value="personal"
                className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-800 data-[state=active]:to-teal-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-emerald-100/50 data-[state=inactive]:text-stone-600"
              >
                <User className="w-5 h-5" />
                <span className="text-center leading-tight">Personal<br/>Information</span>
              </TabsTrigger>
              <TabsTrigger
                value="health"
                className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-linear-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-red-100/50 data-[state=inactive]:text-stone-600"
              >
                <Heart className="w-5 h-5" />
                <span className="text-center leading-tight">Health<br/>Info</span>
              </TabsTrigger>
              <TabsTrigger
                value="emergency"
                className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-100/50 data-[state=inactive]:text-stone-600"
              >
                <Phone className="w-5 h-5" />
                <span className="text-center leading-tight">Emergency<br/>Contact</span>
              </TabsTrigger>
              <TabsTrigger
                value="additional"
                className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-100/50 data-[state=inactive]:text-stone-600"
              >
                <FileText className="w-5 h-5" />
                <span className="text-center leading-tight">Additional<br/>Info</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6 mt-8">
              <div className="bg-linear-to-br from-emerald-50/50 to-teal-50/50 p-6 rounded-xl border border-emerald-200/30 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Full Name *</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Enter full name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      required
                      className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="father_name" className="text-sm font-medium">Father's Name</Label>
                    <Input
                      id="father_name"
                      type="text"
                      placeholder="Enter father's name"
                      value={formData.father_name || ''}
                      onChange={(e) => handleInputChange('father_name', e.target.value)}
                      className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-sm font-medium">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                    <select
                      id="gender"
                      value={formData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-500 focus:ring-emerald-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Enter address"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Health Info Tab */}
            <TabsContent value="health" className="space-y-6 mt-8">
              <div className="bg-linear-to-br from-red-50/50 to-pink-50/50 p-6 rounded-xl border border-red-200/30 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="blood_group" className="text-sm font-medium">Blood Group</Label>
                    <select
                      id="blood_group"
                      value={formData.blood_group || ''}
                      onChange={(e) => handleInputChange('blood_group', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                    <select
                      id="status"
                      value={formData.status || ''}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="">Select status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-sm font-medium">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Enter height"
                      value={formData.height || ''}
                      onChange={(e) => handleInputChange('height', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="border-stone-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="Enter weight"
                      value={formData.weight || ''}
                      onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="border-stone-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="medical_conditions" className="text-sm font-medium">Medical Conditions</Label>
                    <Input
                      id="medical_conditions"
                      type="text"
                      placeholder="Enter any medical conditions"
                      value={formData.medical_conditions || ''}
                      onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                      className="border-stone-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fitness_goal" className="text-sm font-medium">Fitness Goal</Label>
                    <Input
                      id="fitness_goal"
                      type="text"
                      placeholder="Enter fitness goal"
                      value={formData.fitness_goal || ''}
                      onChange={(e) => handleInputChange('fitness_goal', e.target.value)}
                      className="border-stone-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Emergency Contact Tab */}
            <TabsContent value="emergency" className="space-y-6 mt-8">
              <div className="bg-linear-to-br from-blue-50/50 to-cyan-50/50 p-6 rounded-xl border border-blue-200/30 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emergency_contact_name" className="text-sm font-medium">Emergency Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      type="text"
                      placeholder="Enter emergency contact name"
                      value={formData.emergency_contact_name || ''}
                      onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                      className="border-stone-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone" className="text-sm font-medium">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      placeholder="Enter emergency contact phone"
                      value={formData.emergency_contact_phone || ''}
                      onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                      className="border-stone-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_relationship" className="text-sm font-medium">Relationship</Label>
                    <Input
                      id="emergency_contact_relationship"
                      type="text"
                      placeholder="e.g., Father, Mother, Friend"
                      value={formData.emergency_contact_relationship || ''}
                      onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                      className="border-stone-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Additional Info Tab */}
            <TabsContent value="additional" className="space-y-6 mt-8">
              <div className="bg-linear-to-br from-purple-50/50 to-violet-50/50 p-6 rounded-xl border border-purple-200/30 space-y-6">
                <p className="text-stone-600">Additional member information and notes can be added here in the future.</p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-linear-to-r from-emerald-800 to-teal-800 text-white px-8"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.form>
      </AnimatePresence>
    </div>
  )
}
