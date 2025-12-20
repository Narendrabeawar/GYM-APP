import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

type Variant = "emerald" | "teal" | "green"

export interface LinkCardProps extends React.ComponentProps<"a"> {
  href: string
  title: string
  description?: string
  icon?: React.ElementType
  variant?: Variant
}

const variantStyles: Record<Variant, { border: string; accent: string; badge: string; glow: string }> = {
  emerald: {
    border: "border-emerald-200",
    accent: "text-emerald-800",
    badge: "bg-emerald-50 text-emerald-900",
    glow: "from-emerald-400/30 to-teal-400/30",
  },
  teal: {
    border: "border-teal-200",
    accent: "text-teal-800",
    badge: "bg-teal-50 text-teal-900",
    glow: "from-teal-400/30 to-emerald-400/30",
  },
  green: {
    border: "border-green-200",
    accent: "text-green-800",
    badge: "bg-green-50 text-green-900",
    glow: "from-green-400/30 to-emerald-400/30",
  },
}

export default function LinkCard({ href, title, description, icon: Icon, variant = "emerald", className, ...props }: LinkCardProps) {
  const styles = variantStyles[variant]

  return (
    <Link href={href} className={cn("block group rounded-3xl focus:outline-none focus:ring-2 focus:ring-emerald-500", className)} {...props}>
      <Card
        className={cn(
          "overflow-hidden bg-white border transition-all",
          styles.border,
          "shadow-[0_20px_40px_-20px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-24px_rgba(0,0,0,0.25)] hover:translate-y-0.5"
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-4">
            {/* Icon tile with soft glow */}
            <div className="relative">
              <div className={cn("absolute -inset-2 rounded-3xl blur-md bg-linear-to-br", styles.glow)} />
              <div className="relative grid place-items-center w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-500 text-white shadow-[0_12px_20px_-10px_rgba(59,130,246,0.65)]">
                {Icon ? <Icon className="w-6 h-6" /> : null}
              </div>
            </div>
            <div className="flex-1">
              <CardTitle className={cn("text-lg font-semibold", styles.accent)}>{title}</CardTitle>
              {description ? (
                <CardDescription className="text-stone-600 mt-1">{description}</CardDescription>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className={cn("px-3 py-1 rounded-full text-xs font-medium", styles.badge)}>Open</span>
            <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
