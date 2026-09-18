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
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 my-6">
      <div className="p-4 bg-zinc-800/80 rounded-2xl mb-4 text-zinc-400 border border-zinc-700/50">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-md mb-6">{description}</p>
      <div className="flex items-center gap-3">
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {actionText}
          </button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};
