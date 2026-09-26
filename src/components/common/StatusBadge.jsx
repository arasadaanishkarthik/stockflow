import React from 'react';

export const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim();

  const getStyle = () => {
    switch (normalized) {
      // Completed / Done / In Stock / Applied
      case 'in stock':
      case 'done':
      case 'completed':
      case 'active':
      case 'applied':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50';

      // Ready for Dispatch / Loading Bay
      case 'ready':
        return 'bg-teal-50 text-teal-700 border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/50';

      // Packing stage
      case 'packing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/90 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50';

      // Picking stage
      case 'picking':
        return 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50';

      // Waiting stage (Inbound / Supplier)
      case 'waiting':
      case 'in transit':
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200/90 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800/50';

      // Low Stock / Warning / Medium Priority
      case 'low stock':
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50';

      // Critical / Out of Stock / High Priority / Danger / Canceled
      case 'out of stock':
      case 'critical':
      case 'canceled':
      case 'cancelled':
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50';

      // Draft / Info / Pending Approval
      case 'draft':
      case 'pending approval':
      case 'info':
        return 'bg-slate-100 text-slate-700 border-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700';

      // Default Neutral
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getDotColor = () => {
    switch (normalized) {
      case 'in stock':
      case 'done':
      case 'completed':
      case 'active':
      case 'applied':
        return 'bg-emerald-500';
      case 'ready':
        return 'bg-teal-500 animate-pulse-subtle';
      case 'packing':
        return 'bg-indigo-500 animate-pulse-subtle';
      case 'picking':
        return 'bg-amber-500 animate-pulse-subtle';
      case 'waiting':
      case 'in transit':
      case 'pending':
        return 'bg-orange-500 animate-pulse-subtle';
      case 'low stock':
      case 'medium':
        return 'bg-amber-500 animate-pulse-subtle';
      case 'out of stock':
      case 'critical':
      case 'canceled':
      case 'cancelled':
      case 'high':
        return 'bg-rose-500 animate-pulse';
      case 'draft':
        return 'bg-slate-400';
      default:
        return 'bg-slate-400';
    }
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] gap-1 font-medium',
    sm: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    md: 'px-3 py-1.5 text-sm gap-2 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs tracking-tight whitespace-nowrap ${sizeClasses[size]} ${getStyle()} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()} shrink-0`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};
