import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded bg-surface-secondary/70 ${className}`}
      aria-hidden="true"
    />
  );
};

export const MetricCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${count} gap-2.5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="w-5 h-5 rounded-md" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <div className="op-card overflow-hidden border border-border">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="overflow-x-auto">
        <table className="op-table">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}>
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c}>
                    <Skeleton
                      className={`h-3.5 ${
                        c === 0
                          ? 'w-36'
                          : c === 1
                          ? 'w-20'
                          : c === 2
                          ? 'w-28'
                          : c === columns - 1
                          ? 'w-16 ml-auto'
                          : 'w-16'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="op-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  );
};
