import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search products, SKU, warehouse...',
  className = '',
  onClear,
  shortcut
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-16 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
      />
      <div className="absolute right-3 flex items-center gap-1.5">
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              if (onClear) onClear();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {shortcut && !value && (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
};
