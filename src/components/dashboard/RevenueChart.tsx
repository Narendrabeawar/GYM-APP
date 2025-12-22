'use client'

import { useEffect, useState } from 'react'

interface Series {
  labels: string[]
  income: number[]
  expense: number[]
}

export default function RevenueChart() {
  const [data, setData] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/gym/revenue')
        const json = await res.json()
        if (!mounted) return
        if (json.error) {
          console.error('Revenue API error', json)
          setData(null)
        } else {
          setData({ labels: json.labels || [], income: json.income || [], expense: json.expense || [] })
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return <div className="h-60 flex items-center justify-center text-sm text-stone-500">Loading chart...</div>
  }
  if (!data) {
    return <div className="h-60 flex items-center justify-center text-sm text-stone-500">No chart data</div>
  }

  // simple grouped bar chart using SVG
  const width = 800
  const height = 240
  const padding = 40
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const maxVal = Math.max(...data.income, ...data.expense, 1)
  const barWidth = innerW / data.labels.length

  return (
    <div className="overflow-auto">
      <svg width={Math.min(width, innerW + padding * 2)} height={height}>
        <g transform={`translate(${padding},${padding})`}>
          {/* y grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <g key={i} transform={`translate(0, ${innerH * (1 - t)})`}>
              <line x1={0} x2={innerW} stroke="#eef2f4" />
              <text x={-8} y={4} fontSize={10} textAnchor="end" fill="#94a3b8">
                {Math.round(maxVal * t).toLocaleString()}
              </text>
            </g>
          ))}

          {/* bars */}
          {data.labels.map((label, idx) => {
            const x = idx * barWidth
            const incomeH = (data.income[idx] / maxVal) * innerH
            const expenseH = (data.expense[idx] / maxVal) * innerH
            const gap = 6
            const bw = Math.max(6, (barWidth - gap * 2) / 2)
            return (
              <g key={label}>
                <rect
                  x={x + gap}
                  y={innerH - incomeH}
                  width={bw}
                  height={incomeH}
                  fill="#10b981"
                  rx={3}
                />
                <rect
                  x={x + gap + bw}
                  y={innerH - expenseH}
                  width={bw}
                  height={expenseH}
                  fill="#ef4444"
                  rx={3}
                />
                <text x={x + barWidth / 2} y={innerH + 14} fontSize={10} textAnchor="middle" fill="#64748b">
                  {label.split(' ')[0]}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}


