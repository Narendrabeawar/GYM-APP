'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface FinancialMetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: LucideIcon
  color: string
  delay?: number
}

export default function FinancialMetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color,
  delay = 0
}: FinancialMetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
    >
      <Card className="border-green-200 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-stone-500 mb-1">{title}</p>
              <h3 className="text-2xl font-bold text-stone-900 mb-2">{value}</h3>
              {change && (
                <div className="flex items-center gap-1">
                  <span
                    className={`text-sm font-medium ${
                      changeType === 'increase' ? 'text-emerald-600' :
                      changeType === 'decrease' ? 'text-red-600' : 'text-stone-500'
                    }`}
                  >
                    {change}
                  </span>
                  {/* removed 'vs last month' per UI request */}
                </div>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
