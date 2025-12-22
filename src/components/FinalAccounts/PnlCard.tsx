'use client'

import React from 'react'

interface PnlCardProps {
  title: string
  value: string
  variant?: 'green' | 'red' | 'amber'
}

export default function PnlCard({ title, value, variant = 'green' }: PnlCardProps) {
  const color = variant === 'green' ? 'text-emerald-700' : variant === 'red' ? 'text-red-600' : 'text-amber-600'
  return (
    <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-sm">
      <div className="text-xs text-stone-500">{title}</div>
      <div className={`font-bold ${color}`}>{value}</div>
    </div>
  )
}


