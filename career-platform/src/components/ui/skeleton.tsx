import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

// Specific skeleton patterns for common UI elements
export function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 w-full", className)} {...props} />
}

export function SkeletonTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-6 w-3/4", className)} {...props} />
}

export function SkeletonButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-10 w-24", className)} {...props} />
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-gray-200 p-6", className)} {...props}>
      <SkeletonTitle className="mb-2" />
      <SkeletonText className="mb-2" />
      <SkeletonText className="w-5/6" />
    </div>
  )
}

export function SkeletonMilestone({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-gray-200 p-6", className)} {...props}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <SkeletonTitle className="mb-2" />
          <SkeletonText className="w-5/6" />
        </div>
        <Skeleton className="h-5 w-5 rounded-full ml-4" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <SkeletonText className="w-16" />
        <SkeletonText className="w-20" />
        <SkeletonText className="w-24" />
      </div>
      <div className="flex justify-between items-center">
        <SkeletonText className="w-12" />
        <SkeletonButton />
      </div>
    </div>
  )
}

export function SkeletonProgress({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-8", className)} {...props}>
      {/* Hero metric skeleton */}
      <div className="text-center py-12">
        <Skeleton className="h-16 w-16 mx-auto mb-2 rounded-full" />
        <SkeletonTitle className="mx-auto mb-1" />
        <SkeletonText className="w-32 mx-auto" />
      </div>
      
      {/* Progress bar skeleton */}
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between mb-2">
          <SkeletonText className="w-32" />
          <SkeletonText className="w-12" />
        </div>
        <Skeleton className="h-1 w-full" />
      </div>
      
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

export { Skeleton }