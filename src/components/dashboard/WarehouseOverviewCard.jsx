import React from 'react';
import { Warehouse, MapPin, ArrowRight, ShieldCheck, Layers } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Link } from 'react-router-dom';

export const WarehouseOverviewCard = () => {
  const { warehouses, products } = useInventory();

  // Compute live stock per warehouse
  const getWarehouseStock = (whId) => {
    return products.reduce((acc, p) => acc + Number(p.stockByWarehouse?.[whId] || 0), 0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Warehouse Network Overview
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Capacity utilization across 4 active facilities
          </p>
        </div>
        <Link
          to="/warehouses"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-4">
        {warehouses.map((wh) => {
          const currentStock = getWarehouseStock(wh.id);
          const capacity = wh.capacity || 10000;
          const usagePct = Math.min(100, Math.round((currentStock / capacity) * 100));

          let progressColor = 'bg-blue-600';
          let badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
          if (usagePct > 85) {
            progressColor = 'bg-rose-500';
            badgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
          } else if (usagePct > 65) {
            progressColor = 'bg-amber-500';
            badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
          }

          return (
            <div
              key={wh.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      {wh.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span>{wh.city}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${badgeColor}`}>
                  {usagePct}% Utilized
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 mt-3">
                <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Current: <strong>{currentStock.toLocaleString()}</strong> units</span>
                  <span>Cap: {capacity.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
