import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { WarehouseDetailModal } from '../../components/warehouses/WarehouseDetailModal';
import { AddWarehouseModal } from '../../components/warehouses/AddWarehouseModal';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import {
  Warehouse,
  Plus,
  MapPin,
  Layers,
  Thermometer,
  ArrowRight,
  AlertTriangle,
  Boxes,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export const WarehousesPage = () => {
  const { warehouses, products } = useInventory();

  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Compute live warehouse stats
  const getWarehouseStats = (whId) => {
    const whProducts = products.filter(p => (p.stockByWarehouse?.[whId] || 0) > 0);
    const totalUnits = whProducts.reduce((sum, p) => sum + Number(p.stockByWarehouse?.[whId] || 0), 0);
    const lowStockItems = whProducts.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length;
    const valuation = whProducts.reduce((sum, p) => sum + (Number(p.stockByWarehouse?.[whId] || 0) * Number(p.costPrice || 0)), 0);

    return {
      productCount: whProducts.length,
      totalUnits,
      lowStockItems,
      valuation
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Warehouses & Facilities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor capacity, storage aisles, and product allocation across all 4 operational sites.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsAddOpen(true)}
        >
          Add Warehouse
        </Button>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {warehouses.map((wh) => {
          const stats = getWarehouseStats(wh.id);
          const capacity = wh.capacity || 10000;
          const usagePct = Math.min(100, Math.round((stats.totalUnits / capacity) * 100));

          let progressColor = 'bg-blue-600';
          if (usagePct > 85) progressColor = 'bg-rose-500';
          else if (usagePct > 65) progressColor = 'bg-amber-500';

          return (
            <motion.div
              key={wh.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs border border-blue-100 dark:border-blue-900/40">
                      <Warehouse className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                          {wh.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                          {wh.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{wh.city}</span>
                        <span>• Manager: {wh.manager}</span>
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={wh.status} size="sm" />
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 my-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Facility Storage Utilization
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {usagePct}% ({formatNumber(stats.totalUnits)} / {formatNumber(capacity)} units)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                </div>

                {/* Stats 3-Column */}
                <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Unique SKUs</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
                      {stats.productCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Low Stock Alerts</span>
                    <span className={`text-base font-extrabold font-mono mt-0.5 block ${
                      stats.lowStockItems > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
                    }`}>
                      {stats.lowStockItems}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Asset Value</span>
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
                      {formatCurrency(stats.valuation)}
                    </span>
                  </div>
                </div>

                {/* Zones preview */}
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Storage Zones & Bays
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(wh.zones || []).slice(0, 3).map((z, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]"
                      >
                        {z}
                      </span>
                    ))}
                    {(wh.zones || []).length > 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 text-[11px]">
                        +{(wh.zones || []).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5" />
                  {wh.temperature}
                </span>

                <Button
                  variant="outline"
                  size="xs"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => {
                    setSelectedWarehouse(wh);
                    setIsDetailOpen(true);
                  }}
                >
                  View Facility Products
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Warehouse Detail Modal */}
      <WarehouseDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        warehouse={selectedWarehouse}
      />

      {/* Add Warehouse Modal */}
      <AddWarehouseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  );
};
