/**
 * Loading Skeleton Components
 * Beautiful loading states for various UI elements
 */

export function EscrowCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="mt-4 flex gap-3">
        <div className="h-10 bg-gray-200 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}

export function EscrowListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <EscrowCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-200 p-4 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-20"></div>
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="mt-4 flex justify-center gap-4">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
}

export function TimelineSkeleton({ events = 5 }: { events?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
      <div className="space-y-6">
        {Array.from({ length: events }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-gray-200 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-96"></div>
    </div>
  );
}

export function ButtonSkeleton({ width = "w-32" }: { width?: string }) {
  return <div className={`h-10 bg-gray-200 rounded ${width} animate-pulse`}></div>;
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded"
          style={{ width: i === lines - 1 ? "80%" : "100%" }}
        ></div>
      ))}
    </div>
  );
}

export function ImageSkeleton({ aspectRatio = "16/9" }: { aspectRatio?: string }) {
  return (
    <div
      className="bg-gray-200 rounded animate-pulse"
      style={{ aspectRatio }}
    ></div>
  );
}

export function BadgeSkeleton() {
  return <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>;
}

export function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  return (
    <div className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse`}></div>
  );
}

export function NavbarSkeleton() {
  return (
    <div className="bg-white border-b border-gray-200 p-4 animate-pulse">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-20"></div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <TimelineSkeleton events={4} />
      </div>
      <EscrowListSkeleton count={3} />
    </div>
  );
}

// Shimmer effect component
export function ShimmerEffect() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
  );
}

// Generic skeleton wrapper
export function Skeleton({
  className = "",
  shimmer = false,
}: {
  className?: string;
  shimmer?: boolean;
}) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse relative overflow-hidden ${className}`}>
      {shimmer && <ShimmerEffect />}
    </div>
  );
}

