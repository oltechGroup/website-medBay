import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  label?: string;
  error?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ label, error, options, value, onChange, placeholder = "Seleccionar..." }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    };

    const removeOption = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter(v => v !== optionValue));
    };

    const selectedLabels = value.map(v => 
      options.find(opt => opt.value === v)?.label || v
    );

    return (
      <div className="space-y-2" ref={ref}>
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          <div
            className={cn(
              "flex min-h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 focus:ring-red-500",
              isOpen && "ring-2 ring-blue-500 ring-offset-2"
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedLabels.length === 0 ? (
                <span className="text-gray-400">{placeholder}</span>
              ) : (
                selectedLabels.map((label, index) => (
                  <span
                    key={value[index]}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                  >
                    {label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-blue-600"
                      onClick={(e) => removeOption(value[index], e)}
                    />
                  </span>
                ))
              )}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </div>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50",
                    value.includes(option.value) && "bg-blue-50"
                  )}
                  onClick={() => toggleOption(option.value)}
                >
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border mr-2",
                    value.includes(option.value)
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                  )}>
                    {value.includes(option.value) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
MultiSelect.displayName = "MultiSelect";

export default MultiSelect;