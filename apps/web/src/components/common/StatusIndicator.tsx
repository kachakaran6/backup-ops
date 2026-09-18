import React from 'react';

export type OperationalStatus =
  | 'online'
  | 'offline'
  | 'healthy'
  | 'unhealthy'
  | 'warning'
  | 'overdue'
  | 'degraded'
  | 'failed'
  | 'error'
  | 'running'
  | 'syncing'
  | 'planning'
  | 'verifying'
  | 'queued'
  | 'completed'
  | 'verified'
  | 'checksum_verified'
  | 'connected'
  | 'disconnected'
  | 'unknown'
  | 'disabled';

interface StatusIndicatorProps {
  status: OperationalStatus | string;
  label?: string;
  variant?: 'inline' | 'badge' | 'dot' | 'glyph';
  className?: string;
  showGlyph?: boolean;
}

type StatusCategory = 'success' | 'warning' | 'error' | 'info' | 'neutral';

function getStatusCategory(status: string): { category: StatusCategory; glyph: string; defaultLabel: string } {
  const s = (status || '').toLowerCase().replace(/[\s_-]+/g, '');

  // Success states
  if (['online', 'healthy', 'connected', 'completed', 'verified', 'checksumverified', 'valid', 'active', 'listening', 'ready'].includes(s)) {
    return {
      category: 'success',
      glyph: '✓',
      defaultLabel: status === 'checksum_verified' ? 'Checksum Verified' : status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Healthy',
    };
  }

  // Warning states
  if (['warning', 'overdue', 'degraded', 'retrying', 'approaching'].includes(s)) {
    return {
      category: 'warning',
      glyph: '!',
      defaultLabel: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Warning',
    };
  }

  // Error / Failed states
  if (['failed', 'offline', 'error', 'disconnected', 'broken', 'unhealthy'].includes(s)) {
    return {
      category: 'error',
      glyph: '×',
      defaultLabel: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Failed',
    };
  }

  // Info / In-Flight states
  if (['running', 'syncing', 'planning', 'verifying', 'queued'].includes(s)) {
    return {
      category: 'info',
      glyph: '•',
      defaultLabel: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Running',
    };
  }

  // Neutral / Unknown / Disabled
  return {
    category: 'neutral',
    glyph: '–',
    defaultLabel: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown',
  };
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  variant = 'badge',
  className = '',
  showGlyph = false,
}) => {
  const { category, glyph, defaultLabel } = getStatusCategory(status);
  const displayLabel = label ?? defaultLabel;

  const dotColors: Record<StatusCategory, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    neutral: 'bg-text-muted',
  };

  const textColors: Record<StatusCategory, string> = {
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info',
    neutral: 'text-text-muted',
  };

  // Inline / Dot variant: [dot] Healthy or [✓] Healthy
  if (variant === 'inline' || variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[category]}`} />
        <span className={textColors[category]}>
          {showGlyph ? `${glyph} ` : ''}{displayLabel}
        </span>
      </span>
    );
  }

  if (variant === 'glyph') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-mono font-medium ${textColors[category]} ${className}`}>
        <span className="font-bold">{glyph}</span>
        <span>{displayLabel}</span>
      </span>
    );
  }

  // Badge variant: restrained, desaturated low-opacity tint with 1px border
  const badgeStyles: Record<StatusCategory, string> = {
    success: 'bg-success-muted text-success border-success/30',
    warning: 'bg-warning-muted text-warning border-warning/30',
    error: 'bg-error-muted text-error border-error/30',
    info: 'bg-info-muted text-info border-info/30',
    neutral: 'bg-surface-secondary text-text-muted border-border',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${badgeStyles[category]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[category]}`} />
      <span>{showGlyph ? `${glyph} ` : ''}{displayLabel}</span>
    </span>
  );
};

export const StatusBadge = StatusIndicator;
