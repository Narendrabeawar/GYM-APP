'use client'

import React from 'react'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

interface Row {
  day: string
  total_income: number
  total_expense: number
  net_profit: number
}

interface PnlTableProps {
  rows: Row[]
}

export default function PnlTable({ rows }: PnlTableProps) {
  return (
    <div className="rounded-xl border border-green-200 overflow-hidden bg-white/50">
      <Table>
        <TableHeader>
          <TableRow className="bg-emerald-50 text-stone-700">
            <TableHead className="h-10 text-xs font-bold uppercase tracking-wide first:rounded-tl-lg last:rounded-tr-lg">Date</TableHead>
            <TableHead className="h-10 text-xs font-bold uppercase tracking-wide">Total Income</TableHead>
            <TableHead className="h-10 text-xs font-bold uppercase tracking-wide">Total Expense</TableHead>
            <TableHead className="h-10 text-xs font-bold uppercase tracking-wide">Net Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={idx} className="border-green-200 border-b hover:bg-emerald-50/30 transition-colors">
              <TableCell className="py-2">{r.day}</TableCell>
              <TableCell className="py-2">₹{r.total_income.toLocaleString('en-IN')}</TableCell>
              <TableCell className="py-2">₹{r.total_expense.toLocaleString('en-IN')}</TableCell>
              <TableCell className="py-2">₹{r.net_profit.toLocaleString('en-IN')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


