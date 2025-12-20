'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { User, Heart, Phone, FileText, Plus, Calendar, MapPin, Phone as PhoneIcon, CalendarDays, BadgeDollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface EnquiryFormData {
  full_name: string
  father_name: string
  phone: string
  email: string
  address: string
  health_info: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  notes: string
}

interface Enquiry {
  id: string
  full_name: string
  father_name?: string
  phone: string
  email?: string
  address: string
  health_info?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  notes?: string
  status: string
  created_at: string
  converted_to_member_id?: string
  branch_id?: string
}

interface MembershipPlan {
  id: string
  name: string
  duration_months: number
  price: number
}

export default function NewEnquiryForm() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([])
  const defaultPlans: MembershipPlan[] = [
    { id: 'plan_1m', name: '1 Month', duration_months: 1, price: 0 },
    { id: 'plan_3m', name: '3 Months', duration_months: 3, price: 0 },
    { id: 'plan_6m', name: '6 Months', duration_months: 6, price: 0 },
    { id: 'plan_12m', name: '1 Year', duration_months: 12, price: 0 },
  ]
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [amountReceived, setAmountReceived] = useState<string>('')
  const [showViewModal, setShowViewModal] = useState(false)

  const handleConvertClick = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry)
    setShowConvertModal(true)
  }
  const handleViewClick = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry)
    setShowViewModal(true)
  }

  const handleMarkContacted = async (enquiry: Enquiry) => {
    setIsLoading(true)
    try {
      // Get profile to ensure branch scoping for RLS
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User not authenticated')
        setIsLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        toast.error('Failed to fetch user profile')
        setIsLoading(false)
        return
      }

      const note = `${enquiry.notes || ''}\nContacted on ${new Date().toLocaleString()}`
      // Update only if branch matches to satisfy RLS
      const { error } = await supabase
        .from('enquiries')
        .update({ notes: note, status: 'pending' })
        .match({ id: enquiry.id, branch_id: profile.branch_id })

      if (error) {
        console.error('Error updating enquiry:', error)
        toast.error(error.message || 'Failed to mark as contacted')
      } else {
        toast.success('Marked as contacted')
        await fetchEnquiries()
      }
    } catch (err) {
      console.error('Error marking contacted:', err)
      toast.error('Failed to mark as contacted')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEnquiry = async (enquiry: Enquiry) => {
    if (!confirm(`Delete enquiry for ${enquiry.full_name}? This cannot be undone.`)) return
    setIsLoading(true)
    try {
      const { error } = await supabase.from('enquiries').delete().eq('id', enquiry.id)
      if (error) throw error
      toast.success('Enquiry deleted')
      fetchEnquiries()
    } catch (err) {
      console.error('Error deleting enquiry:', err)
      toast.error('Failed to delete enquiry')
    } finally {
      setIsLoading(false)
    }
  }

  const enquiryColumns: ColumnDef<Enquiry>[] = useMemo(() => [
      {
          header: 'Sr.No.',
          cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
          size: 60,
      },
      {
          accessorKey: 'full_name',
          header: 'Full Name',
          cell: ({ row }) => (
              <div className="flex flex-col">
                  <span className="font-bold text-stone-900">{row.getValue('full_name')}</span>
                  {row.original.father_name && (
                      <span className="text-xs text-stone-500">Father: {row.original.father_name}</span>
                  )}
              </div>
          ),
          size: 180,
      },
      {
          accessorKey: 'phone',
          header: 'Mobile Number',
          cell: ({ row }) => (
              <div className="flex items-center gap-2">
                  <PhoneIcon className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{row.getValue('phone')}</span>
              </div>
          ),
          size: 140,
      },
      {
          accessorKey: 'address',
          header: 'Address',
          cell: ({ row }) => {
              const address = row.getValue('address') as string
              return (
                  <div className="flex items-center gap-2 max-w-[300px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                      <span title={address}>{address || 'Not specified'}</span>
                  </div>
              )
          },
          size: 250,
      },
      {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => {
              const status = row.getValue('status') as string
              return (
                  <Badge
                      variant="outline"
                      className={`capitalize ${
                          status === 'converted'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : status === 'pending'
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                  >
                      {status}
                  </Badge>
              )
          },
          size: 100,
      },
      {
          accessorKey: 'created_at',
          header: 'Date',
          cell: ({ row }) => (
              <div className="flex items-center gap-2 text-stone-600">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(row.getValue('created_at')).toLocaleDateString()}
              </div>
          ),
          size: 120,
      },
      {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => {
              const enquiry = row.original
              return (
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white rounded-xl border-green-200 shadow-xl w-40 p-1">
                          <DropdownMenuLabel className="px-2 py-1.5 text-stone-500 text-xs font-semibold">Enquiry Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                              className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50 text-stone-700 focus:text-emerald-900 font-medium transition-colors"
                              onClick={() => handleViewClick(enquiry)}
                          >
                              View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-green-100 mx-1 my-1" />
                          <DropdownMenuItem
                              className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-blue-50 text-blue-600 focus:text-blue-700 font-medium transition-colors"
                              onClick={() => handleConvertClick(enquiry)}
                          >
                              Convert to Member
                          </DropdownMenuItem>
                          <DropdownMenuItem
                              className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-amber-50 text-amber-600 focus:text-amber-700 font-medium transition-colors"
                              onClick={() => handleMarkContacted(enquiry)}
                          >
                            Mark as Contacted
                          </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 focus:text-red-700 font-medium transition-colors"
                            onClick={() => handleDeleteEnquiry(enquiry)}
                        >
                            Delete Enquiry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              )
          },
          size: 100,
      },
  ], [handleConvertClick])

  const fetchEnquiries = useCallback(async () => {
    try {
      console.log('Fetching enquiries...')

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        return
      }

      if (!user) {
        console.log('No authenticated user')
        return
      }

      console.log('User authenticated:', user.id)

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gym_id, branch_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        toast.error('User profile not found. Please contact administrator.')
        return
      }

      if (!profile?.gym_id) {
        console.log('No gym_id found for user')
        toast.error('No gym associated with your account.')
        return
      }

      console.log('Gym ID found:', profile.gym_id)

      // Fetch enquiries (exclude converted entries so they don't show after conversion)
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .eq('gym_id', profile.gym_id)
        .neq('status', 'converted')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database query error:', error)

        // Check if it's a table not found error (PostgreSQL error code for undefined table)
        if (error.code === '42P01' || error.message?.includes('relation "enquiries" does not exist')) {
          console.log('Enquiries table does not exist. Setting empty enquiries list.')
          setEnquiries([])
          // Don't show error toast for table not found - just show empty table
        } else {
          toast.error(`Failed to load enquiries: ${error.message || 'Unknown error'}`)
        }
        return
      }

      console.log('Enquiries fetched successfully:', data?.length || 0)
      setEnquiries(data || [])
    } catch (error) {
      console.error('Unexpected error fetching enquiries:', error)
      toast.error('An unexpected error occurred while loading enquiries')
    }
  }, [supabase])

  const fetchMembershipPlans = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('gym_id')
        .eq('id', user.id)
        .single()

      if (!profile?.gym_id) return

      const { data, error } = await supabase
        .from('membership_plans')
        .select('id, name, duration_months, price')
        .eq('gym_id', profile.gym_id)
        .order('duration_months', { ascending: true })

      if (error) throw error
      setMembershipPlans(data || [])
    } catch (error) {
      console.error('Error fetching membership plans:', error)
      toast.error('Failed to load membership plans.')
    }
  }, [supabase])

  useEffect(() => {
    fetchEnquiries()
    fetchMembershipPlans()
  }, [fetchEnquiries, fetchMembershipPlans])
  
  const [formData, setFormData] = useState<EnquiryFormData>({
    full_name: '',
    father_name: '',
    phone: '',
    email: '',
    address: '',
    health_info: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    notes: ''
  })

  const handleInputChange = (field: keyof EnquiryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get current user profile to determine gym_id and branch_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('gym_id, branch_id')
        .eq('id', user.id)
        .single()

      if (!profile?.gym_id) {
        toast.error('No gym associated with your account')
        return
      }

      // Create the enquiry
      const { error } = await supabase
        .from('enquiries')
        .insert({
          full_name: formData.full_name,
          father_name: formData.father_name || null,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address,
          health_info: formData.health_info || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          emergency_contact_relationship: formData.emergency_contact_relationship || null,
          notes: formData.notes || null,
          gym_id: profile.gym_id,
          branch_id: profile.branch_id || null,
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating enquiry:', error)
        // Check if it's a table not found error
        if (error.code === '42P01' || error.message?.includes('relation "enquiries" does not exist')) {
          throw new Error('Enquiries feature is not yet set up. Please contact administrator.')
        }
        throw error
      }

      toast.success('Enquiry submitted successfully!')
      setShowForm(false)
      setFormData({
        full_name: '',
        father_name: '',
        phone: '',
        email: '',
        address: '',
        health_info: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        notes: ''
      })
      fetchEnquiries()

    } catch (error) {
      console.error('Error creating enquiry:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create enquiry')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!selectedEnquiry) {
      toast.error('No enquiry selected for conversion.')
      setIsLoading(false)
      return
    }

    if (!selectedPlan || !amountReceived) {
      toast.error('Please select a plan and enter the amount received.')
      setIsLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User not authenticated.')
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('gym_id, branch_id')
        .eq('id', user.id)
        .single()

      if (!profile?.gym_id) {
        toast.error('No gym associated with your account.')
        setIsLoading(false)
        return
      }

      const plansSource = membershipPlans.length ? membershipPlans : defaultPlans
      const selectedMembershipPlan = plansSource.find(plan => plan.id === selectedPlan)
      if (!selectedMembershipPlan) {
        toast.error('Selected membership plan not found.')
        setIsLoading(false)
        return
      }

      const membershipStartDate = new Date()
      const membershipEndDate = new Date()
      membershipEndDate.setMonth(membershipEndDate.getMonth() + selectedMembershipPlan.duration_months)

      // If using defaultPlans (not stored in DB) we shouldn't set a membership_plan_id that doesn't exist.
      const membershipPlanId = membershipPlans.length ? selectedMembershipPlan.id : null

      // 1. Check if member already exists (by email or phone) to avoid unique constraint error
      let newMember = null
      try {
        if (selectedEnquiry.email) {
          const { data: existingByEmail } = await supabase
            .from('members')
            .select('*')
            .eq('email', selectedEnquiry.email)
            .maybeSingle()
          if (existingByEmail) {
            // update existing member with membership details
            const { data: updatedMember, error: updateErr } = await supabase
              .from('members')
              .update({
                membership_plan_id: membershipPlanId,
                membership_start_date: membershipStartDate.toISOString().split('T')[0],
                membership_end_date: membershipEndDate.toISOString().split('T')[0],
                status: 'active',
              })
              .eq('id', existingByEmail.id)
              .select()
              .maybeSingle()
            if (updateErr) throw updateErr
            newMember = updatedMember
          }
        }

        if (!newMember && selectedEnquiry.phone) {
          const { data: existingByPhone } = await supabase
            .from('members')
            .select('*')
            .eq('phone', selectedEnquiry.phone)
            .maybeSingle()
          if (existingByPhone) {
            const { data: updatedMember, error: updateErr } = await supabase
              .from('members')
              .update({
                membership_plan_id: membershipPlanId,
                membership_start_date: membershipStartDate.toISOString().split('T')[0],
                membership_end_date: membershipEndDate.toISOString().split('T')[0],
                status: 'active',
              })
              .eq('id', existingByPhone.id)
              .select()
              .maybeSingle()
            if (updateErr) throw updateErr
            newMember = updatedMember
          }
        }

        if (!newMember) {
          const memberRes = await supabase
            .from('members')
            .insert({
              gym_id: profile.gym_id,
              branch_id: profile.branch_id || null,
              user_id: user.id,
              full_name: selectedEnquiry.full_name,
              email: selectedEnquiry.email || null,
              phone: selectedEnquiry.phone,
              address: selectedEnquiry.address,
              emergency_contact: selectedEnquiry.emergency_contact_name || null,
              emergency_phone: selectedEnquiry.emergency_contact_phone || null,
              membership_plan_id: membershipPlanId,
              membership_start_date: membershipStartDate.toISOString().split('T')[0],
              membership_end_date: membershipEndDate.toISOString().split('T')[0],
              status: 'active',
            })
            .select()
            .single()
          console.log('Member insert response:', memberRes)
          if (memberRes.error) {
            console.error('Member insert error:', memberRes)
            toast.error(memberRes.error.message || 'Failed to create member (see console)')
            setIsLoading(false)
            return
          }
          newMember = memberRes.data
        }
      } catch (err) {
        console.error('Member lookup/insert error:', err)
        toast.error(err instanceof Error ? err.message : 'Failed to create/update member')
        setIsLoading(false)
        return
      }

      // 2. Update the enquiry status and link to the new member.
      // Some deployments may not have converted_to_member_id in schema (PGRST204).
      // Try to update with converted_to_member_id first, fallback to status-only update.
      try {
        console.log('Attempting enquiry update with converted_to_member_id...')
        const updateRes = await supabase
          .from('enquiries')
          .update({
            status: 'converted',
            converted_to_member_id: newMember.id,
            branch_id: profile.branch_id || selectedEnquiry.branch_id || null // Ensure branch_id consistency
          })
          .eq('id', selectedEnquiry.id)
          .select()
          .maybeSingle()

        if (updateRes?.error) {
          console.warn('Enquiry update with converted_to_member_id failed, trying status-only update', updateRes.error)
          const fallback = await supabase
            .from('enquiries')
            .update({
              status: 'converted',
              branch_id: profile.branch_id || selectedEnquiry.branch_id || null
            })
            .eq('id', selectedEnquiry.id)
            .select()
            .maybeSingle()
          if (fallback?.error) {
            throw fallback.error
          }
        } else {
          console.log('Enquiry updated successfully:', updateRes.data)
        }
      } catch (err) {
        console.error('Enquiry update error:', err)
        // try status-only one more time before failing
        console.log('Attempting final status-only update...')
        const statusOnly = await supabase
          .from('enquiries')
          .update({
            status: 'converted',
            branch_id: profile.branch_id || selectedEnquiry.branch_id || null
          })
          .eq('id', selectedEnquiry.id)
          .select()
          .maybeSingle()
        if (statusOnly.error) {
          throw statusOnly.error
        }
        console.log('Enquiry status updated with fallback:', statusOnly.data)
      }

      // 3. Record payment (optional, but good practice) — non-blocking
      try {
        const paymentAmount = parseFloat(amountReceived || '0')
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
          console.warn('Invalid payment amount, skipping payment record:', amountReceived)
        } else {
          const paymentData = {
            gym_id: profile.gym_id,
            branch_id: profile.branch_id || null, // Include branch_id if available
            member_id: newMember.id,
            amount: paymentAmount,
            payment_method: 'cash',
            payment_type: 'membership',
            status: 'completed',
            description: `Membership payment for ${selectedMembershipPlan.name}`,
          }

          console.log('Attempting to insert payment:', paymentData)

          const { data: paymentResult, error: paymentError } = await supabase
            .from('payments')
            .insert(paymentData)
          .select()
          .maybeSingle()

        if (paymentError) {
            console.error('Payment insert error:', paymentError)
            // Try without branch_id as fallback
            console.log('Retrying payment insert without branch_id...')
            const fallbackData = { ...paymentData }
            delete fallbackData.branch_id

            const { data: fallbackResult, error: fallbackError } = await supabase
              .from('payments')
              .insert(fallbackData)
              .select()
              .maybeSingle()

            if (fallbackError) {
              console.error('Payment insert fallback also failed:', fallbackError)
            } else {
              console.log('Payment recorded successfully with fallback:', fallbackResult)
            }
          } else if (paymentResult) {
            console.log('Payment recorded successfully:', paymentResult)
          }
        }
      } catch (err) {
        console.error('Payment recording error (non-blocking):', err)
        // Non-blocking: don't fail the conversion if payment recording fails
      }

      toast.success(`${selectedEnquiry.full_name} converted to member successfully!`)
      setShowConvertModal(false)
      setSelectedEnquiry(null)
      setSelectedPlan('')
      setAmountReceived('')
      fetchEnquiries() // Refresh enquiries table
      // TODO: Also refresh members table once it's implemented

    } catch (error) {
      console.error('Error converting enquiry to member:', error)
      const msg = error instanceof Error
        ? error.message
        : (error && typeof error === 'object' && 'message' in error
          ? String(error.message) || JSON.stringify(error)
          : String(error))
      toast.error(msg || 'Failed to convert to member')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header with Add New Enquiry Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
            Saved Enquiries
          </h2>
          <p className="text-stone-600">View and manage all enquiry records</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Hide Form' : 'Add New Enquiry'}
        </Button>
      </div>

      {/* Enquiry Form */}
      <AnimatePresence>
        {showForm ? (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto space-y-6 overflow-hidden"
          >
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-0.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200/50 shadow-sm">
            <TabsTrigger
              value="personal"
              className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-800 data-[state=active]:to-teal-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-emerald-100/50 data-[state=inactive]:text-stone-600"
            >
              <User className="w-5 h-5" />
              <span className="text-center leading-tight">Personal<br/>Information</span>
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-red-100/50 data-[state=inactive]:text-stone-600"
            >
              <Heart className="w-5 h-5" />
              <span className="text-center leading-tight">Health<br/>Info</span>
            </TabsTrigger>
            <TabsTrigger
              value="emergency"
              className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-100/50 data-[state=inactive]:text-stone-600"
            >
              <Phone className="w-5 h-5" />
              <span className="text-center leading-tight">Emergency<br/>Contact</span>
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-100/50 data-[state=inactive]:text-stone-600"
            >
              <FileText className="w-5 h-5" />
              <span className="text-center leading-tight">Additional<br/>Notes</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6 mt-8">
            <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-6 rounded-xl border border-emerald-200/30 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    Full Name *
                  </Label>
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
                  <Label htmlFor="father_name" className="text-sm font-medium">
                    Father&apos;s Name
                  </Label>
                  <Input
                    id="father_name"
                    type="text"
                    placeholder="Enter father's name"
                    value={formData.father_name}
                    onChange={(e) => handleInputChange('father_name', e.target.value)}
                    className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Mobile Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Full Address *
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter complete address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  rows={3}
                  className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </TabsContent>

          {/* Health Info Tab */}
          <TabsContent value="health" className="space-y-6 mt-8">
            <div className="bg-gradient-to-br from-red-50/50 to-pink-50/50 p-6 rounded-xl border border-red-200/30 space-y-6">
              <div className="space-y-2">
              <Label htmlFor="health_info" className="text-sm font-medium">
                Medical Conditions / Health Information
              </Label>
              <Textarea
                id="health_info"
                placeholder="Any medical conditions, allergies, medications, or health concerns..."
                value={formData.health_info}
                onChange={(e) => handleInputChange('health_info', e.target.value)}
                rows={6}
                className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
              <p className="text-xs text-stone-500">
                Include any injuries, chronic conditions, allergies, or medications
              </p>
              </div>
            </div>
          </TabsContent>

          {/* Emergency Contact Tab */}
          <TabsContent value="emergency" className="space-y-6 mt-8">
            <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 p-6 rounded-xl border border-blue-200/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name" className="text-sm font-medium">
                  Emergency Contact Name
                </Label>
                <Input
                  id="emergency_contact_name"
                  type="text"
                  placeholder="Enter emergency contact name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship" className="text-sm font-medium">
                  Relationship
                </Label>
                <Input
                  id="emergency_contact_relationship"
                  type="text"
                  placeholder="e.g., Parent, Spouse, Sibling"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                  className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emergency_contact_phone" className="text-sm font-medium">
                  Emergency Contact Phone
                </Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  placeholder="Enter emergency contact phone number"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
            </div>
          </TabsContent>

          {/* Additional Notes Tab */}
          <TabsContent value="notes" className="space-y-6 mt-8">
            <div className="bg-gradient-to-br from-purple-50/50 to-violet-50/50 p-6 rounded-xl border border-purple-200/30">
              <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional information or observations..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={6}
                className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
              </div>
            </div>
          </TabsContent>
        </Tabs>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="border-stone-200 text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg"
              >
                {isLoading ? 'Submitting...' : 'Submit Enquiry'}
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full space-y-4"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-stone-900">
                Enquiry Records ({enquiries.length})
              </h2>
            </div>

            <DataTable columns={enquiryColumns} data={enquiries} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Convert to Member Modal */}
      <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
              Convert to Member
            </DialogTitle>
            <DialogDescription className="text-stone-500">
              Enter membership details for {selectedEnquiry?.full_name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConvertSubmit} className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="membershipPlan" className="text-stone-700 font-medium">Membership Plan</Label>
              <select
                id="membershipPlan"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full h-11 rounded-xl border border-stone-200 px-3 bg-white focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="">{(membershipPlans.length === 0 ? 'Select a plan' : 'Select a plan')}</option>
                {(membershipPlans.length ? membershipPlans : defaultPlans).map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.duration_months} months){plan.price ? ` - ₹${plan.price}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amountReceived" className="text-stone-700 font-medium">Amount Received</Label>
              <Input
                id="amountReceived"
                type="number"
                placeholder="Enter amount received"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                required
                className="h-11 rounded-xl border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConvertModal(false)}
                className="border-stone-200 text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-lg"
              >
                {isLoading ? 'Converting...' : 'Convert'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    {/* View Details Modal */}
    <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
      <DialogContent className="sm:max-w-[640px] w-full rounded-2xl shadow-lg overflow-hidden border-0 ring-0">
        <DialogTitle className="sr-only">Enquiry Details</DialogTitle>
        {/* Header (light, theme-matching) */}
        <div className="bg-emerald-50 p-5 border-b border-emerald-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-lg">
                {selectedEnquiry?.full_name?.substring(0,2).toUpperCase() || 'EN'}
              </div>
              <div>
                <h3 className="text-2xl font-extrabold leading-tight text-emerald-900">Enquiry Details</h3>
                <p className="text-sm text-emerald-700 mt-1">Full details of the enquiry</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-700">Status</span>
              <div className="px-3 py-1 rounded-full bg-white border border-emerald-100 text-emerald-900 text-sm font-semibold">
                {selectedEnquiry?.status ?? 'pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-stone-500 uppercase tracking-wide">Name</span>
              <div className="text-stone-900 font-semibold text-lg">{selectedEnquiry?.full_name}</div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-stone-500 uppercase tracking-wide">Father&apos;s Name</span>
              <div className="text-stone-900 font-medium">{selectedEnquiry?.father_name || '-'}</div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-stone-500 uppercase tracking-wide">Phone</span>
              <div className="flex items-center gap-2 text-stone-900 font-medium">
                <PhoneIcon className="w-4 h-4 text-stone-400" />
                <span>{selectedEnquiry?.phone}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-stone-500 uppercase tracking-wide">Address</span>
              <div className="flex items-center gap-2 text-stone-900">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span>{selectedEnquiry?.address}</span>
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <span className="text-xs text-stone-500 uppercase tracking-wide">Health Information</span>
              <div className="text-stone-900">{selectedEnquiry?.health_info || '-'}</div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <span className="text-xs text-stone-500 uppercase tracking-wide">Emergency Contact</span>
              <div className="text-stone-900">{selectedEnquiry?.emergency_contact_name || '-'} {selectedEnquiry?.emergency_contact_phone ? `(${selectedEnquiry?.emergency_contact_phone})` : ''}</div>
            </div>
          </div>

          <div className="mt-6">
            <span className="text-xs text-stone-500 uppercase tracking-wide">Notes</span>
            <div className="mt-2 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 whitespace-pre-wrap min-h-[72px]">
              {selectedEnquiry?.notes || '-'}
            </div>
          </div>

          <DialogFooter className="flex justify-end mt-6">
            <Button
              onClick={() => setShowViewModal(false)}
              className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-bold rounded-xl shadow-lg px-4 py-2"
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
    </motion.div>
  )
}