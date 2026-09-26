import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import { Warehouse, MapPin, User, Layers, Thermometer, Box, Package, Power, Trash2 } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const WarehouseDetailModal = ({ isOpen, onClose, warehouse }) => {
  const { products, toggleWarehouseStatus, deleteWarehouse } = useInventory();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!warehouse) return null;

  // Filter products located in this warehouse
  const warehouseProducts = products.filter(
    p => (p.stockByWarehouse?.[warehouse.id] || 0) > 0
  );

  const totalStockUnits = warehouseProducts.reduce(
    (sum, p) => sum + Number(p.stockByWarehouse?.[warehouse.id] || 0),
    0
  );

  const totalWarehouseValuation = warehouseProducts.reduce(
    (sum, p) => sum + (Number(p.stockByWarehouse?.[warehouse.id] || 0) * Number(p.costPrice || 0)),
    0
  );

  const usagePct = Math.min(100, Math.round((totalStockUnits / (warehouse.capacity || 10000)) * 100));

  const handleToggleStatus = () => {
    toggleWarehouseStatus(warehouse.id);
  };

  const handleDelete = () => {
    const success = deleteWarehouse(warehouse.id);
    if (success) {
      setIsDeleteConfirmOpen(false);
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={warehouse.name}
        subtitle={`Code: ${warehouse.code} • ${warehouse.type} • Managed by ${warehouse.manager}`}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <StatusBadge status={warehouse.status} size="md" />
              <Button
                variant="outline"
                size="xs"
                icon={Power}
                onClick={handleToggleStatus}
              >
                {warehouse.status === 'Active' ? 'Set Inactive' : 'Set Active'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                icon={Trash2}
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                Delete Facility
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        }
      >
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block">Total Items Stocked</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 block">
              {formatNumber(totalStockUnits)} <span className="text-xs font-normal text-slate-500">units</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block">Capacity Utilization</span>
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
              {usagePct}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block">Unique SKU Count</span>
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">
              {warehouseProducts.length} <span className="text-xs font-normal text-slate-500">SKUs</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block">Total Asset Value</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 block">
              {formatCurrency(totalWarehouseValuation)}
            </span>
          </div>
        </div>

        {/* Location & Zones info */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{warehouse.address}, {warehouse.city}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Thermometer className="w-4 h-4 text-slate-400" />
              <span>Climate: {warehouse.temperature}</span>
            </div>
          </div>

          {/* Zones */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Designated Storage Zones & Racks
            </span>
            <div className="flex flex-wrap gap-2">
              {(warehouse.zones || []).map((zone, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  {zone}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Products Stocked Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-500" />
            Stocked Products in this Facility ({warehouseProducts.length})
          </h4>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Available in WH</th>
                  <th className="py-2.5 px-3 text-right">Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {warehouseProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      No stock currently allocated to this warehouse.
                    </td>
                  </tr>
                ) : (
                  warehouseProducts.map((p) => {
                    const qty = p.stockByWarehouse?.[warehouse.id] || 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {p.sku}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {p.category}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {qty} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          {formatCurrency(qty * (p.costPrice || 0))}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <ConfirmDialog
      isOpen={isDeleteConfirmOpen}
      onClose={() => setIsDeleteConfirmOpen(false)}
      onConfirm={handleDelete}
      variant="danger"
      title={`Delete Warehouse ${warehouse.name}`}
      message={`Are you sure you want to permanently delete warehouse "${warehouse.name}" (${warehouse.code})?\n\nNote: A warehouse holding active stock cannot be deleted until all stock is transferred or adjusted out.`}
      confirmText="Yes, Delete Warehouse"
      cancelText="Cancel"
    />
  </>
  );
};
