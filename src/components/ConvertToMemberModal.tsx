"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { TrendingUp, IndianRupee } from 'lucide-react'

export type MinimalMembershipPlan = {
  id: string
  name: string
  duration_months: number
  price: number
  discount_amount?: number
  final_amount?: number
  custom_days?: number
  plan_period?: string
}

export type MinimalEnquiry = {
  id: string
  full_name: string
  phone: string
  email?: string | null
  address?: string | null
  blood_group?: string | null
  height?: number | string | null
  weight?: number | string | null
  fitness_goal?: string | null
  health_info?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  branch_id?: string | null
}

type SelectedPlanDetails = {
  plan: MinimalMembershipPlan
  basePrice: number
  discount: number
  finalAmount: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  enquiry: MinimalEnquiry | null
  membershipPlans: MinimalMembershipPlan[]
  defaultPlans: MinimalMembershipPlan[]
  selectedPlan: string
  onPlanChange: (planId: string) => void
  amountReceived: string
  onAmountReceivedChange: (value: string) => void
  differenceAction: string
  onDifferenceActionChange: (value: string) => void
  selectedPlanDetails: SelectedPlanDetails | null
  hasDifference: boolean
  amountDifference: number
  formatCurrency: (value: number) => string
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function ConvertToMemberModal({
  open,
  onOpenChange,
  enquiry,
  membershipPlans,
  defaultPlans,
  selectedPlan,
  onPlanChange,
  amountReceived,
  onAmountReceivedChange,
  differenceAction,
  onDifferenceActionChange,
  selectedPlanDetails,
  hasDifference,
  amountDifference,
  formatCurrency,
  isLoading,
  onSubmit,
}: Props) {
  const plansSource = membershipPlans.length ? membershipPlans : defaultPlans
  const [alertOpen, setAlertOpen] = React.useState(false)
  const [alertMsg, setAlertMsg] = React.useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl border-none shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
            Convert to Member
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            {enquiry?.full_name ? `Enter membership details for ${enquiry.full_name}.` : 'Enter membership details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="membershipPlan" className="text-stone-700 font-medium">Membership Plan</Label>
            <select
              id="membershipPlan"
              value={selectedPlan}
              onChange={(e) => onPlanChange(e.target.value)}
              className="w-full h-11 rounded-xl border border-stone-200 px-3 bg-white focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value="">Select a plan</option>
              {plansSource.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.duration_months} months){plan.price ? ` - ₹${plan.price}` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedPlanDetails && (
            <>
              <div className="grid gap-2">
                <Label className="text-stone-700 font-medium">Discount</Label>
                <div className="h-11 rounded-xl border border-stone-200 px-3 flex items-center bg-stone-50 text-stone-900 font-semibold">
                  {formatCurrency(selectedPlanDetails.discount)}
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-stone-700 font-medium">Final Payable Amount</Label>
                <div className="h-11 rounded-xl border border-stone-200 px-3 flex items-center bg-emerald-50 text-emerald-900 font-bold">
                  {formatCurrency(selectedPlanDetails.finalAmount)}
                </div>
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="amountReceived" className="text-stone-700 font-medium">Amount Received</Label>
            <Input
              id="amountReceived"
              type="number"
              placeholder="Enter amount received"
              value={amountReceived}
              onChange={(e) => {
                const raw = e.target.value
                const entered = parseFloat(raw || '0')
                if (Number.isNaN(entered)) {
                  onAmountReceivedChange('')
                  return
                }
                const max = selectedPlanDetails?.finalAmount ?? undefined
                if (typeof max === 'number' && entered > max) {
                  setAlertMsg('Amount cannot exceed final payable amount')
                  setAlertOpen(true)
                  onAmountReceivedChange(String(max))
                  return
                }
                if (entered < 0) {
                  onAmountReceivedChange('0')
                  return
                }
                onAmountReceivedChange(raw)
              }}
              required
              className="h-11 rounded-xl border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {hasDifference && selectedPlanDetails && (
            <div className="grid gap-2">
              <Label className="text-stone-700 font-medium">
                {amountDifference < 0 ? 'Remaining Amount' : 'Extra Amount'} ({formatCurrency(Math.abs(amountDifference))})
              </Label>
              <select
                value={differenceAction}
                onChange={(e) => onDifferenceActionChange(e.target.value)}
                className="w-full h-11 rounded-xl border border-stone-200 px-3 bg-white focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="">Select how to handle</option>
                {amountDifference < 0 ? (
                  <>
                    <option value="discount">Treat remaining as additional discount</option>
                    <option value="due">Mark remaining as amount due (to be paid later)</option>
                  </>
                ) : (
                  <>
                    <option value="extra_keep">Keep extra as received</option>
                    <option value="extra_adjust">Adjust/credit extra amount</option>
                  </>
                )}
              </select>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="bg-white rounded-xl border-green-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Invalid Amount</AlertDialogTitle>
            <AlertDialogDescription>{alertMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
