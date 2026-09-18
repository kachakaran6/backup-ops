import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border bg-surface-secondary/30 my-4">
      <div className="p-2.5 bg-surface rounded-md mb-3 text-text-muted border border-border inline-flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-sm mb-4 leading-relaxed">{description}</p>
      {(actionText || secondaryActionText) && (
        <div className="flex items-center gap-2.5">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="op-btn-primary"
            >
              {actionText}
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="op-btn-secondary"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
