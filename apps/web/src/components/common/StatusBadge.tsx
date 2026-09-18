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

  let textColor = 'text-text-muted';
  let dotColor = 'bg-text-muted';

  switch (norm) {
    case 'healthy':
    case 'online':
    case 'active':
    case 'completed':
    case 'success':
      textColor = 'text-success';
      dotColor = 'bg-success';
      break;

    case 'running':
    case 'verifying':
    case 'planning':
      textColor = 'text-info';
      dotColor = 'bg-info';
      break;

    case 'queued':
      textColor = 'text-brand-primary';
      dotColor = 'bg-brand-primary';
      break;

    case 'warning':
    case 'degraded':
    case 'overdue':
      textColor = 'text-warning';
      dotColor = 'bg-warning';
      break;

    case 'failed':
    case 'error':
      textColor = 'text-error';
      dotColor = 'bg-error';
      break;

    case 'offline':
    case 'stopped':
    case 'cancelled':
      textColor = 'text-text-muted';
      dotColor = 'bg-text-muted/60';
      break;

    default:
      textColor = 'text-text-secondary';
      dotColor = 'bg-text-muted';
      break;
  }

  const textSize = size === 'sm' ? 'text-[10.5px]' : 'text-xs';
  const displayLabel = label || norm.toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium tracking-wide ${textSize} ${textColor} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      )}
      <span>{displayLabel}</span>
    </span>
  );
};
