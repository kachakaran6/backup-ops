import React from 'react';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  id?: string;
  label: string;
  value?: string;
  count?: number;
}

export interface DropdownFilter {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (val: string) => void;
}

export interface FilterBarProps {
  searchQuery?: string;
  searchValue?: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  selectedFilter?: string;
  onFilterChange?: (filterId: string) => void;
  filters?: DropdownFilter[];
  totalCount?: number;
  filteredCount?: number;
  actions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  searchValue,
  onSearchChange,
  placeholder,
  searchPlaceholder,
  filterOptions,
  selectedFilter,
  onFilterChange,
  filters,
  totalCount,
  filteredCount,
  actions,
  className = '',
}) => {
  const query = searchValue ?? searchQuery ?? '';
  const searchInputPlaceholder = searchPlaceholder ?? placeholder ?? 'Filter records...';

  return (
    <div
      className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-surface border border-border rounded-lg ${className}`}
    >
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchInputPlaceholder}
            className="w-full bg-surface-secondary border border-border rounded-md pl-8 pr-8 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
          />
          {query && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        {filters && filters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className="bg-surface-secondary border border-border rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer font-sans"
                >
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Quick Filter Chips */}
        {filterOptions && filterOptions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {filterOptions.map((option) => {
              const optId = option.id || option.value || '';
              const isActive = selectedFilter === optId;
              return (
                <button
                  key={optId}
                  onClick={() => onFilterChange?.(optId)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-surface-elevated text-brand-primary border-brand-primary/40 font-semibold'
                      : 'bg-surface-secondary text-text-muted hover:text-text-primary border-transparent'
                  }`}
                >
                  <span>{option.label}</span>
                  {typeof option.count === 'number' && (
                    <span
                      className={`ml-1.5 text-[10px] font-mono px-1 py-0.2 rounded ${
                        isActive
                          ? 'bg-brand-primary/20 text-brand-primary'
                          : 'bg-surface-tertiary text-text-muted'
                      }`}
                    >
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side: Counts & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        {totalCount !== undefined && (
          <div className="text-[11px] font-mono text-text-muted">
            {filteredCount !== undefined && filteredCount !== totalCount ? (
              <span>
                Showing <strong className="text-text-primary">{filteredCount}</strong> of{' '}
                {totalCount}
              </span>
            ) : (
              <span>
                Total: <strong className="text-text-primary">{totalCount}</strong>
              </span>
            )}
          </div>
        )}

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
