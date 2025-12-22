'use client'

import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import BranchOverviewCard from './BranchOverviewCard'

interface BranchData {
  id: string
  name: string
  address?: string
  phone?: string
  manager_name?: string
  status: 'active' | 'inactive'
  total_income: number
  total_expenses: number
  net_profit: number
  member_count: number
  active_members: number
}

interface BranchStatsGridProps {
  branches: BranchData[]
  isLoading: boolean
  error?: string | null
}

export default function BranchStatsGrid({ branches, isLoading, error }: BranchStatsGridProps) {
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full"
      >
        <Card className="border-red-200 bg-red-50/60 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Error loading branch data</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="col-span-full">
        <Card className="border-green-200 bg-white/60 backdrop-blur-xl">
          <CardContent className="p-12">
            <div className="flex items-center justify-center gap-3 text-stone-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-lg">Loading branch performance data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (branches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full"
      >
        <Card className="border-green-200 bg-white/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-stone-900">No Branches Found</CardTitle>
            <CardDescription className="text-stone-500">
              You haven&apos;t created any branches yet. Create your first branch to start tracking performance.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    )
  }

  // Calculate summary stats
  const totalIncome = branches.reduce((sum, branch) => sum + branch.total_income, 0)
  const totalExpenses = branches.reduce((sum, branch) => sum + branch.total_expenses, 0)
  const totalProfit = branches.reduce((sum, branch) => sum + branch.net_profit, 0)
  const totalMembers = branches.reduce((sum, branch) => sum + branch.member_count, 0)
  const totalActiveMembers = branches.reduce((sum, branch) => sum + branch.active_members, 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <Card className="border-emerald-200 bg-emerald-50/60 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-emerald-700 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-emerald-800">
                ₹{totalIncome.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/60 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-red-700 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-800">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-green-200 ${totalProfit >= 0 ? 'bg-green-50/60' : 'bg-red-50/60'} backdrop-blur-xl`}>
          <CardContent className="p-4">
            <div className="text-center">
              <p className={`text-sm font-medium ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                Net Profit
              </p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                ₹{totalProfit.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/60 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-blue-700 font-medium">Total Members</p>
              <p className="text-2xl font-bold text-blue-800">{totalMembers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/60 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-emerald-700 font-medium">Active Members</p>
              <p className="text-2xl font-bold text-emerald-800">{totalActiveMembers}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch, index) => (
          <BranchOverviewCard
            key={branch.id}
            branch={branch}
            delay={index}
          />
        ))}
      </div>
    </div>
  )
}
