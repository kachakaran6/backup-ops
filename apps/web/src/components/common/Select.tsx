import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  id,
  name,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string, isDisabled?: boolean) => {
    if (isDisabled || disabled) return;
    onValueChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for form submission & required validation */}
      {name && (
        <input
          type="hidden"
          name={name}
          id={id}
          value={value}
          required={required}
        />
      )}

      {/* Select Trigger */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex h-9 w-full items-center justify-between rounded border px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
          isOpen
            ? 'border-brand ring-1 ring-brand bg-surface-elevated'
            : 'border-border bg-surface hover:border-border-strong'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-secondary' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <selectedOption.icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
              )}
              <span className="font-medium text-text-primary truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[11px] font-mono text-text-muted truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
            </>
          ) : (
            <span className="text-text-muted">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand' : ''
          }`}
        />
      </button>

      {/* Select Dropdown Content */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-surface-elevated p-1 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {options.length === 0 ? (
            <div className="py-3 text-center text-xs text-text-muted">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded py-1.5 pl-8 pr-2.5 text-xs outline-hidden transition-colors ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed pointer-events-none'
                      : isSelected
                      ? 'bg-brand/10 text-brand font-medium'
                      : 'text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {/* Selected Checkmark */}
                  {isSelected && (
                    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center text-brand">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                  )}

                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && (
                      <opt.icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    )}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] font-mono text-text-muted truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
