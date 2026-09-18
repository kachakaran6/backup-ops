import React from 'react';

export type OperationalStatus =
  | 'healthy'
  | 'online'
  | 'active'
  | 'running'
  | 'completed'
  | 'success'
  | 'warning'
  | 'degraded'
  | 'overdue'
  | 'failed'
  | 'error'
  | 'offline'
  | 'stopped'
  | 'queued'
  | 'planning'
  | 'verifying'
  | 'cancelled'
  | 'unknown';

interface StatusBadgeProps {
  status: OperationalStatus | string;
  label?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const norm = (status || 'unknown').toLowerCase().trim() as OperationalStatus;

  let styleClasses = 'bg-surface-secondary text-text-muted border-border';
  let dotColor = 'bg-text-muted';
  let isPulsing = false;

  switch (norm) {
    case 'healthy':
    case 'online':
    case 'active':
    case 'completed':
    case 'success':
      styleClasses = 'bg-success/10 text-success border-success/30';
      dotColor = 'bg-success';
      break;

    case 'running':
    case 'verifying':
    case 'planning':
      styleClasses = 'bg-info/10 text-info border-info/30';
      dotColor = 'bg-info';
      isPulsing = true;
      break;

    case 'queued':
      styleClasses = 'bg-brand/10 text-brand border-brand/30';
      dotColor = 'bg-brand';
      isPulsing = true;
      break;

    case 'warning':
    case 'degraded':
    case 'overdue':
      styleClasses = 'bg-warning/10 text-warning border-warning/30';
      dotColor = 'bg-warning';
      break;

    case 'failed':
    case 'error':
      styleClasses = 'bg-error/10 text-error border-error/30';
      dotColor = 'bg-error';
      break;

    case 'offline':
    case 'stopped':
    case 'cancelled':
      styleClasses = 'bg-surface-secondary text-text-muted border-border';
      dotColor = 'bg-text-muted';
      break;

    default:
      styleClasses = 'bg-surface-secondary text-text-secondary border-border';
      dotColor = 'bg-text-muted';
      break;
  }

  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';
  const displayLabel = label || norm.toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border uppercase tracking-wider ${sizeClasses} ${styleClasses} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {isPulsing && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
        </span>
      )}
      <span>{displayLabel}</span>
    </span>
  );
};
