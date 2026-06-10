type SkeletonProps = { className?: string };

export function Skeleton({ className ="" }: SkeletonProps) {
 return <div className={`animate-pulse rounded-md bg-[var(--progress-track)] ${className}`} />;
}
