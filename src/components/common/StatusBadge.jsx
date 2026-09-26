import React from 'react';

export const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      // Positive / Done / In Stock / Active
      case 'in stock':
      case 'done':
      case 'completed':
      case 'active':
      case 'applied':
      case 'ready':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50 dot-emerald';

      // Warning / Low Stock / Waiting / Picking / In Transit / Medium
      case 'low stock':
      case 'waiting':
      case 'picking':
      case 'in transit':
      case 'medium':
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50 dot-amber';

      // Critical / Out of Stock / High Priority / Danger / Canceled
      case 'out of stock':
      case 'critical':
      case 'canceled':
      case 'cancelled':
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50 dot-rose';

      // Info / Packing / Draft / Pending Approval
      case 'packing':
      case 'draft':
      case 'pending approval':
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50 dot-blue';

      // Neutral / Normal / Default
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 dot-slate';
    }
  };

  const getDotColor = () => {
    switch (normalized) {
      case 'in stock':
      case 'done':
      case 'completed':
      case 'active':
      case 'applied':
      case 'ready':
        return 'bg-emerald-500';
      case 'low stock':
      case 'waiting':
      case 'picking':
      case 'in transit':
      case 'medium':
      case 'pending':
        return 'bg-amber-500 animate-pulse-subtle';
      case 'out of stock':
      case 'critical':
      case 'canceled':
      case 'cancelled':
      case 'high':
        return 'bg-rose-500 animate-pulse';
      case 'packing':
      case 'draft':
      case 'pending approval':
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-slate-400';
    }
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    md: 'px-3 py-1.5 text-sm gap-2 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs font-medium tracking-tight whitespace-nowrap ${sizeClasses[size]} ${getStyle()} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()} shrink-0`} />
      <span>{status}</span>
    </span>
  );
};
