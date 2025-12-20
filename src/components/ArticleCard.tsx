import * as React from "react"
import { cn } from "@/lib/utils"
import { Clock, Eye } from "lucide-react"
import Image from "next/image"

type Tone = "indigo" | "emerald" | "amber"

export interface ArticleCardProps extends React.ComponentProps<"div"> {
  title: string
  author?: string
  description?: string
  readTime?: string
  views?: string
  imageSrc?: string
  avatarSrc?: string
  tone?: Tone
}

const toneGradients: Record<Tone, string> = {
  indigo: "from-indigo-600 to-blue-600",
  emerald: "from-emerald-700 to-teal-600",
  amber: "from-amber-600 to-orange-600",
}

export function ArticleCard({
  className,
  title,
  author = "Jordan Greenhall",
  description = "We saw the most impressive sights, ate the best food, had empowering volunteering experiences, but…",
  readTime = "6 min read",
  views = "24K",
  imageSrc,
  avatarSrc,
  tone = "indigo",
  ...props
}: ArticleCardProps) {
  const gradient = toneGradients[tone]
  return (
    <div
      className={cn(
        "relative rounded-3xl p-6 md:p-8 text-white shadow-2xl",
        "bg-linear-to-r ",
        gradient,
        className
      )}
      {...props}
    >
      {/* decorative backdrop shadow */}
      <div className="absolute inset-0 rounded-3xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.45)] pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-[260px_1fr] items-center gap-6 md:gap-10">
        {/* Left image tile */}
        <div className="relative md:-ml-10">
          <div className="w-55 h-55 md:w-60 md:h-60 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {imageSrc ? (
              <Image src={imageSrc} alt="" width={240} height={240} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-20 h-28 bg-stone-100 rounded-md" />
              </div>
            )}
          </div>
          {/* Avatar badge */}
          <div className="absolute -right-5 top-4">
            <div className="w-10 h-10 rounded-full ring-4 ring-white/40 bg-white overflow-hidden shadow-lg">
              {avatarSrc ? (
                <Image src={avatarSrc} alt="" width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-indigo-600 font-bold">JG</div>
              )}
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="space-y-3">
          {/* tiny decorative dots */}
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>

          <div className="text-sm text-white/80">{author}</div>

          <h3 className="text-2xl md:text-3xl font-bold leading-tight">
            {title}
          </h3>

          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" /> {readTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="w-4 h-4" /> {views}
            </span>
          </div>

          <p className="text-white/80 text-sm leading-relaxed max-w-lg">
            {description}
            <span className="ml-2 text-white hover:text-yellow-300 transition-colors cursor-pointer">Read more</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ArticleCard
