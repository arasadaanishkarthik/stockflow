import React from 'react';

export const Input = ({
  label,
  error,
  hint,
  icon: Icon,
  rightElement,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full bg-white dark:bg-slate-900 border ${
            error
              ? 'border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 dark:border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/20'
          } rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
            Icon ? 'pl-10' : ''
          } ${rightElement ? 'pr-11' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-500 font-medium mt-0.5">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>
      )}
    </div>
  );
};
