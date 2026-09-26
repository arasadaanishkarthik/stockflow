import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { adjustmentReasons } from '../../data/adjustments';
import { SlidersHorizontal, AlertCircle, CheckCircle } from 'lucide-react';

export const AddAdjustmentModal = ({ isOpen, onClose }) => {
  const { applyAdjustment, products, warehouses } = useInventory();

  const [productId, setProductId] = useState(products[0]?.id || 'PRD-001');
  const [warehouseId, setWarehouseId] = useState('WH-MAIN');
  const [reason, setReason] = useState(adjustmentReasons[0] || 'Cycle Count Discrepancy');
  const [notes, setNotes] = useState('');

  const selectedProd = products.find(p => p.id === productId);
  const systemQty = selectedProd?.stockByWarehouse?.[warehouseId] || 0;
  const [physicalQty, setPhysicalQty] = useState(String(systemQty));

  const numPhysical = Number(physicalQty || 0);
  const difference = numPhysical - systemQty;

  const handleProductChange = (newProdId) => {
    setProductId(newProdId);
    const prod = products.find(p => p.id === newProdId);
    const sys = prod?.stockByWarehouse?.[warehouseId] || 0;
    setPhysicalQty(String(sys));
  };

  const handleWarehouseChange = (newWhId) => {
    setWarehouseId(newWhId);
    const sys = selectedProd?.stockByWarehouse?.[newWhId] || 0;
    setPhysicalQty(String(sys));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numPhysical < 0) return;

    applyAdjustment({
      productId,
      warehouseId,
      systemQty,
      physicalQty: numPhysical,
      difference,
      reason,
      notes
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Stock Inventory Adjustment"
      subtitle="Reconcile variances between recorded system inventory and physical audited counts."
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={SlidersHorizontal}
            onClick={handleSubmit}
          >
            Apply Inventory Adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Product to Adjust *
          </label>
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Total: {p.totalStock} {p.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Warehouse Selection */}
        <Select
          label="Warehouse Location *"
          options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.city})` }))}
          value={warehouseId}
          onChange={(e) => handleWarehouseChange(e.target.value)}
        />

        {/* System Quantity vs Physical Quantity & Difference Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 items-center">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">System Recorded</span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono">
              {systemQty} {selectedProd?.unit}
            </span>
          </div>

          <div>
            <label className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block mb-1">
              Physical Counted *
            </label>
            <input
              type="number"
              min="0"
              value={physicalQty}
              onChange={(e) => setPhysicalQty(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-900 border border-blue-500 rounded-lg p-2 font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 font-semibold block">Variance Difference</span>
            <span className={`inline-flex items-center text-sm font-extrabold font-mono px-2 py-0.5 rounded-md ${
              difference > 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                : difference < 0
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {difference > 0 ? `+${difference}` : difference} {selectedProd?.unit}
            </span>
          </div>
        </div>

        {/* Reason */}
        <Select
          label="Adjustment Reason *"
          options={adjustmentReasons}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <Input
          label="Audit Notes & Incident Documentation"
          placeholder="e.g. Broken packaging on shelf B2, scrap ticket #SC-881"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  );
};
