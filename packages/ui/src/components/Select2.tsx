import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface Select2Option {
  value: string | number;
  label: string;
}

export interface Select2Props {
  options: Select2Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export const Select2 = React.forwardRef<HTMLDivElement, Select2Props>(
  (
    {
      options = [],
      value,
      onChange,
      placeholder = 'Pilih opsi...',
      required = false,
      disabled = false,
      className = '',
      error = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [options, searchQuery]);

    // Find the currently selected option
    const selectedOption = useMemo(() => {
      return options.find((opt) => String(opt.value) === String(value));
    }, [options, value]);

    // Handle clicking outside to close the dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Reset search query when dropdown opens/closes
    useEffect(() => {
      if (!isOpen) {
        setSearchQuery('');
      }
    }, [isOpen]);

    const handleSelect = (val: string | number) => {
      onChange(String(val));
      setIsOpen(false);
    };

    return (
      <div
        ref={containerRef}
        className={`relative w-full ${disabled ? 'opacity-65 cursor-not-allowed' : ''} ${className}`}
      >
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] text-left transition-all duration-200 ${
            error
              ? 'border-red-500 focus:ring-red-500/20'
              : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <span className={selectedOption ? 'truncate' : 'text-slate-400 dark:text-slate-500 truncate'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Hidden select for HTML validation/native form submission */}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className="hidden"
          style={{ display: 'none' }}
          tabIndex={-1}
          aria-hidden="true"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-100">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:ring-0 focus:outline-none"
                placeholder="Cari..."
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Options List */}
            <ul className="max-h-56 overflow-y-auto py-1 slim-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <li
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors duration-150 truncate ${
                        isSelected
                          ? 'bg-[#F97316] text-white font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      {opt.label}
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-2 text-xs text-center text-slate-400 dark:text-slate-500">
                  Tidak ada hasil ditemukan
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

Select2.displayName = 'Select2';
