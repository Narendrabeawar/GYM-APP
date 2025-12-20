import * as React from "react"
import { cn } from "@/lib/utils"

function Switch({
  className,
  checked,
  onCheckedChange,
  ...props
}: React.ComponentProps<"input"> & { checked?: boolean; onCheckedChange?: (val: boolean) => void }) {
  return (
    <label className={cn("inline-flex items-center cursor-pointer", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
        className="sr-only"
        {...props}
      />
      <span
        className={cn(
          "h-6 w-11 rounded-full transition-colors bg-gray-200",
          checked ? "bg-emerald-600" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 bg-white rounded-full transform transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
          aria-hidden
        />
      </span>
    </label>
  )
}

export { Switch }


