import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricBreakdown {
  label: string;
  value: string | number;
  color?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand';
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  breakdown?: MetricBreakdown[];
  progress?: {
    current: number;
    total: number;
    percentage?: number;
    color?: 'brand' | 'success' | 'warning' | 'error' | 'info';
  };
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  breakdown,
  progress,
  onClick,
  className = '',
}) => {
  const isClickable = !!onClick;

  const colorMap = {
    success: 'text-success bg-success',
    warning: 'text-warning bg-warning',
    error: 'text-error bg-error',
    info: 'text-info bg-info',
    neutral: 'text-text-muted bg-text-muted',
    brand: 'text-brand bg-brand',
  };

  return (
    <div
      onClick={onClick}
      className={`op-card p-4 transition-all duration-150 relative group ${
        isClickable ? 'cursor-pointer hover:border-border-strong hover:bg-surface-secondary/40' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <Icon className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors" />
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-semibold text-text-primary font-mono tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs text-text-muted font-normal">{unit}</span>}
      </div>

      {progress && (
        <div className="mb-2">
          <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progress.color === 'brand'
                  ? 'bg-brand'
                  : progress.color === 'warning'
                  ? 'bg-warning'
                  : progress.color === 'error'
                  ? 'bg-error'
                  : progress.color === 'info'
                  ? 'bg-info'
                  : 'bg-success'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  progress.percentage ?? (progress.current / (progress.total || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {breakdown && breakdown.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono pt-1 border-t border-border-subtle">
          {breakdown.map((item, idx) => {
            const colorClass = item.color ? colorMap[item.color] : 'text-text-secondary bg-text-secondary';
            const textColor = colorClass.split(' ')[0];
            const dotColor = colorClass.split(' ')[1];

            return (
              <span key={idx} className={`flex items-center gap-1.5 ${textColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                <span>
                  {item.value} {item.label}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
