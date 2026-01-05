import { cn } from "@/lib/utils";

interface GlassSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "card" | "avatar" | "button" | "input";
}

function GlassSkeleton({ className, variant = "text", ...props }: GlassSkeletonProps) {
  const variants = {
    text: "h-4 w-full",
    card: "h-32 w-full rounded-xl",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24 rounded-lg",
    input: "h-10 w-full rounded-lg",
  };

  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-secondary/50 border border-border/30",
        "bg-gradient-to-r from-secondary/30 via-secondary/50 to-secondary/30",
        "animate-shimmer bg-[length:200%_100%]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

interface GlassSkeletonCardProps {
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
  className?: string;
}

function GlassSkeletonCard({ 
  showHeader = true, 
  showFooter = false, 
  lines = 3,
  className 
}: GlassSkeletonCardProps) {
  return (
    <div className={cn("glass-panel rounded-xl p-6 space-y-4", className)}>
      {showHeader && (
        <div className="flex items-center gap-4">
          <GlassSkeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <GlassSkeleton className="h-4 w-1/3" />
            <GlassSkeleton className="h-3 w-1/4" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <GlassSkeleton 
            key={i} 
            className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} 
          />
        ))}
      </div>
      {showFooter && (
        <div className="flex gap-2 pt-2">
          <GlassSkeleton variant="button" />
          <GlassSkeleton variant="button" className="w-20" />
        </div>
      )}
    </div>
  );
}

interface GlassSkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

function GlassSkeletonTable({ 
  rows = 5, 
  columns = 4,
  className 
}: GlassSkeletonTableProps) {
  return (
    <div className={cn("glass-panel rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border/30">
        {Array.from({ length: columns }).map((_, i) => (
          <GlassSkeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex gap-4 p-4 border-b border-border/20 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <GlassSkeleton 
              key={colIndex} 
              className={cn(
                "h-4 flex-1",
                colIndex === 0 ? "w-1/4" : ""
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface GlassSkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

function GlassSkeletonList({ 
  items = 4, 
  showAvatar = true,
  className 
}: GlassSkeletonListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i} 
          className="glass-panel rounded-lg p-4 flex items-center gap-4"
        >
          {showAvatar && <GlassSkeleton variant="avatar" />}
          <div className="flex-1 space-y-2">
            <GlassSkeleton className="h-4 w-1/3" />
            <GlassSkeleton className="h-3 w-1/2" />
          </div>
          <GlassSkeleton variant="button" className="w-16" />
        </div>
      ))}
    </div>
  );
}

export { GlassSkeleton, GlassSkeletonCard, GlassSkeletonTable, GlassSkeletonList };
