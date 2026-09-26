import React from 'react';
import { AlertCircle, AlertTriangle, Info, Check, X, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';

export const AlertCard = ({
  alert,
  onMarkAsRead,
  onDismiss
}) => {
  const navigate = useNavigate();

  const getSeverityConfig = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          icon: AlertCircle,
          border: 'border-rose-200 dark:border-rose-900/60',
          bg: 'bg-rose-50/50 dark:bg-rose-950/30',
          badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-300',
          iconColor: 'text-rose-500',
          dot: 'bg-rose-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          border: 'border-amber-200 dark:border-amber-900/60',
          bg: 'bg-amber-50/50 dark:bg-amber-950/30',
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300',
          iconColor: 'text-amber-500',
          dot: 'bg-amber-500'
        };
      default:
        return {
          icon: Info,
          border: 'border-blue-200 dark:border-blue-900/60',
          bg: 'bg-blue-50/50 dark:bg-blue-950/30',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300',
          iconColor: 'text-blue-500',
          dot: 'bg-blue-500'
        };
    }
  };

  const config = getSeverityConfig(alert.severity);
  const Icon = config.icon;

  const handleAction = () => {
    if (onMarkAsRead) onMarkAsRead(alert.id);
    if (alert.type === 'Receipt') navigate('/receipts');
    else if (alert.type === 'Delivery') navigate('/deliveries');
    else if (alert.type === 'Adjustment') navigate('/adjustments');
    else if (alert.sku || alert.productName) {
      navigate(`/products?search=${encodeURIComponent(alert.sku || alert.productName)}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border ${config.border} ${config.bg} relative transition-all duration-200 flex flex-col sm:flex-row items-start justify-between gap-4 ${
      !alert.isRead ? 'ring-1 ring-blue-500/20 shadow-2xs' : 'opacity-85'
    }`}>
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-center shrink-0 ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${config.badge}`}>
              {alert.severity}
            </span>
            <span className="text-xs text-slate-400">
              • {alert.timestamp}
            </span>
            {!alert.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" title="Unread alert" />
            )}
          </div>

          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {alert.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            {alert.message}
          </p>

          {/* Structured Stock Breakdown */}
          {alert.type === 'Stock' && (alert.currentStock !== undefined || alert.reorderPoint !== undefined) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                Number(alert.currentStock) <= 0
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
                {alert.currentStock} {alert.unit || 'units'} remaining
              </span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Reorder point: <strong className="font-mono text-slate-800 dark:text-slate-200">{alert.reorderPoint} {alert.unit || 'units'}</strong>
              </span>
              {alert.locations && (
                <>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[240px]" title={alert.locations}>
                    📍 {alert.locations}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {alert.actionText && (
          <Button
            variant="outline"
            size="xs"
            onClick={handleAction}
            className="text-xs font-semibold"
          >
            <span>{alert.actionText}</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}

        {!alert.isRead && (
          <button
            onClick={() => onMarkAsRead && onMarkAsRead(alert.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}

        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
