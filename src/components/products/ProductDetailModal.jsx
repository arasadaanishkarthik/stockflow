import React from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { Package, Warehouse, Barcode, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const ProductDetailModal = ({ isOpen, onClose, product, onEdit }) => {
  const { warehouses } = useInventory();
  if (!product) return null;

  const totalValue = (product.totalStock || 0) * (product.costPrice || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      subtitle={`SKU: ${product.sku} • Category: ${product.category}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <StatusBadge status={product.status} size="md" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {onEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
              >
                Edit Product
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Available Stock</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {product.totalStock} <span className="text-xs font-normal text-slate-500">{product.unit}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Reorder Point</span>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {product.minReorderPoint} <span className="text-xs font-normal text-slate-500">{product.unit}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Unit Cost / Price</span>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5">
              {formatCurrency(product.costPrice)} / <span className="text-emerald-600">{formatCurrency(product.sellingPrice)}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Inventory Value</span>
            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-1.5">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>

        {/* Warehouse Stock Distribution */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Warehouse className="w-4 h-4 text-blue-500" />
            Stock By Warehouse Location
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {warehouses.map((wh) => {
              const stock = product.stockByWarehouse?.[wh.id] || 0;
              const pct = product.totalStock > 0 ? Math.round((stock / product.totalStock) * 100) : 0;

              return (
                <div
                  key={wh.id}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {wh.name}
                    </p>
                    <span className="text-[10px] text-slate-400">{wh.city}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                      {stock} {product.unit}
                    </span>
                    <p className="text-[10px] text-slate-400">{pct}% of total</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barcode & Description */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Barcode className="w-4 h-4 text-slate-400" />
              Barcode / GTIN:
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {product.barcode || 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-slate-400" />
              Last Updated:
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              {product.lastUpdated || 'Today'}
            </span>
          </div>

          {product.description && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
