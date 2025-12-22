'use client'

import { motion } from 'framer-motion'
import { Building2, TrendingUp, TrendingDown, IndianRupee, Users, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import FinancialMetricCard from './FinancialMetricCard'

interface BranchOverviewCardProps {
  branch: {
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
  delay?: number
}

export default function BranchOverviewCard({ branch, delay = 0 }: BranchOverviewCardProps) {
  const profitChangeType = branch.net_profit >= 0 ? 'increase' : 'decrease'
  const profitColor = branch.net_profit >= 0 ? 'from-emerald-500 to-green-600' : 'from-red-500 to-rose-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="h-full"
    >
      <Card className="border-green-200 bg-white/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-800 to-teal-800 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-stone-900">{branch.name}</CardTitle>
                {branch.address && (
                  <p className="text-sm text-stone-500 truncate max-w-[200px]">{branch.address}</p>
                )}
              </div>
            </div>
            <Badge
              variant={branch.status === 'active' ? 'default' : 'secondary'}
              className={branch.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}
            >
              {branch.status}
            </Badge>
          </div>

          {branch.manager_name && (
            <p className="text-sm text-stone-600 mt-2">
              Manager: <span className="font-medium">{branch.manager_name}</span>
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Income</span>
              </div>
              <span className="font-bold text-emerald-700">
                ₹{branch.total_income.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Expenses</span>
              </div>
              <span className="font-bold text-red-700">
                ₹{branch.total_expenses.toLocaleString('en-IN')}
              </span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              branch.net_profit >= 0
                ? 'bg-green-50 border-green-100'
                : 'bg-red-50 border-red-100'
            }`}>
              <div className="flex items-center gap-2">
                {branch.net_profit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  branch.net_profit >= 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  Net Profit
                </span>
              </div>
              <span className={`font-bold ${
                branch.net_profit >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                ₹{branch.net_profit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Member Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-stone-600" />
                <span className="text-xs text-stone-500">Total Members</span>
              </div>
              <p className="text-lg font-bold text-stone-900">{branch.member_count}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-stone-500">Active</span>
              </div>
              <p className="text-lg font-bold text-emerald-700">{branch.active_members}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
