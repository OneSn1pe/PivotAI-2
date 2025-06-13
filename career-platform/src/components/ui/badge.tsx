import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-gray-100 text-gray-700 hover:bg-gray-200",
        secondary:
          "bg-gray-50 text-gray-600 hover:bg-gray-100",
        outline:
          "border border-gray-300 text-gray-700 hover:bg-gray-50",
        success:
          "bg-green-50 text-green-700 border border-green-200",
        warning:
          "bg-yellow-50 text-yellow-700 border border-yellow-200",
        error:
          "bg-red-50 text-red-700 border border-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }