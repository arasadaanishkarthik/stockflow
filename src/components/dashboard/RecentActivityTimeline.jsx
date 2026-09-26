import React from 'react';
import {
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  SlidersHorizontal,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Link } from 'react-router-dom';

export const RecentActivityTimeline = () => {
  const { activities } = useInventory();

  const getOperationBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'receipt':
        return {
          icon: ArrowDownToLine,
          badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
          label: 'Received',
          qtyColor: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'delivery':
        return {
          icon: Truck,
          badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60',
          label: 'Delivered',
          qtyColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'transfer':
        return {
          icon: ArrowLeftRight,
          badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
          label: 'Transferred',
          qtyColor: 'text-purple-600 dark:text-purple-400'
        };
      case 'adjustment':
        return {
          icon: SlidersHorizontal,
          badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
          label: 'Adjusted',
          qtyColor: 'text-amber-600 dark:text-amber-400'
        };
      default:
        return {
          icon: Clock,
          badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
          label: 'Activity',
          qtyColor: 'text-slate-600 dark:text-slate-400'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Recent Stock Activity
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time operations stream across all facilities
          </p>
        </div>
        <Link
          to="/ledger"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>View Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {activities.slice(0, 6).map((item) => {
          const config = getOperationBadge(item.type);
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${config.badge}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.productName}
                    </h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${config.badge}`}>
                      {item.operation || config.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.location}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className={`text-xs sm:text-sm font-extrabold font-mono ${config.qtyColor}`}>
                  {item.quantity}
                </p>
                <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
