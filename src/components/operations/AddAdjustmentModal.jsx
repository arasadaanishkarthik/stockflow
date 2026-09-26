import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { adjustmentReasons } from '../../data/adjustments';
import {
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

// ─── Inner Form Component ─────────────────────────────────────────────────────
// Mounted fresh on every modal open via key={String(isOpen)} in parent wrapper.
const AdjustmentForm = ({ onClose }) => {
  const { applyAdjustment, products, warehouses } = useInventory();

  // ── Step state: 'input' | 'review' ────────────────────────────────────────
  const [step, setStep] = useState('input');

  // ── Form fields ───────────────────────────────────────────────────────────
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState('WH-MAIN');
  const [physicalQty, setPhysicalQty] = useState('');
  const [reason, setReason] = useState(adjustmentReasons[0] || 'Damaged during handling');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // ── Derived values (auto-calculated, never manually entered) ──────────────
  const selectedProd = useMemo(
    () => products.find(p => p.id === productId),
    [products, productId]
  );
  const selectedWh = useMemo(
    () => warehouses.find(w => w.id === warehouseId),
    [warehouses, warehouseId]
  );

  const systemQty = selectedProd?.stockByWarehouse?.[warehouseId] ?? 0;
  const numPhysical = physicalQty === '' ? null : Number(physicalQty);
  const difference = numPhysical !== null ? numPhysical - systemQty : null;

  // ── Product/warehouse change handlers ─────────────────────────────────────
  const handleProductChange = (newId) => {
    setProductId(newId);
    setPhysicalQty('');
    setError('');
  };
  const handleWarehouseChange = (newId) => {
    setWarehouseId(newId);
    setPhysicalQty('');
    setError('');
  };

  // ── Validate before advancing to review step ──────────────────────────────
  const handleReview = (e) => {
    e.preventDefault();
    setError('');

    if (!productId) {
      setError('Please select a product to adjust.');
      return;
    }
    if (physicalQty === '' || numPhysical === null || isNaN(numPhysical)) {
      setError('Please enter a valid physical count quantity.');
      return;
    }
    if (numPhysical < 0) {
      setError('Physical quantity cannot be negative.');
      return;
    }
    if (!reason) {
      setError('Please select an adjustment reason.');
      return;
    }

    // Advance to confirmation step
    setStep('review');
  };

  // ── Final confirm: call applyAdjustment() ─────────────────────────────────
  const handleConfirm = () => {
    applyAdjustment({
      productId,
      warehouseId,
      systemQty,
      physicalQty: numPhysical,
      difference,
      reason,
      notes: notes.trim() || undefined
    });
    onClose();
  };

  // ── Difference display helpers ────────────────────────────────────────────
  const diffColor =
    difference === null
      ? 'text-slate-400'
      : difference > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : difference < 0
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-600 dark:text-slate-400';

  const diffBg =
    difference === null
      ? 'bg-slate-100 dark:bg-slate-800'
      : difference > 0
      ? 'bg-emerald-50 dark:bg-emerald-950/50'
      : difference < 0
      ? 'bg-rose-50 dark:bg-rose-950/50'
      : 'bg-slate-100 dark:bg-slate-800';

  const DiffIcon =
    difference === null ? Minus
    : difference > 0 ? TrendingUp
    : difference < 0 ? TrendingDown
    : Minus;

  // ── REVIEW STEP ───────────────────────────────────────────────────────────
  if (step === 'review') {
    return (
      <div className="space-y-4">
        {/* Summary panel */}
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Review Before Applying
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Product</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{selectedProd?.name}</p>
              <p className="text-[10px] font-mono text-slate-400">{selectedProd?.sku}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Location</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{selectedWh?.name || warehouseId}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">System (Before)</p>
              <p className="font-bold font-mono text-slate-700 dark:text-slate-300">
                {systemQty} {selectedProd?.unit}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Physical Count</p>
              <p className="font-bold font-mono text-blue-700 dark:text-blue-300">
                {numPhysical} {selectedProd?.unit}
              </p>
            </div>
          </div>

          {/* Difference highlight */}
          <div className={`p-3 rounded-xl ${diffBg} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <DiffIcon className={`w-4 h-4 ${diffColor}`} />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Variance Difference</span>
            </div>
            <span className={`font-extrabold font-mono text-sm ${diffColor}`}>
              {difference > 0 ? `+${difference}` : difference} {selectedProd?.unit}
            </span>
          </div>

          <div className="pt-1 border-t border-amber-200 dark:border-amber-800/60 text-xs">
            <p className="text-slate-400 font-medium">Reason</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{reason}</p>
            {notes && <p className="text-[10px] text-slate-400 mt-0.5 italic">{notes}</p>}
          </div>
        </div>

        {/* Warning */}
        <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This will permanently set the stock of <strong>{selectedProd?.name}</strong> at{' '}
            <strong>{selectedWh?.name}</strong> to <strong>{numPhysical} {selectedProd?.unit}</strong>.
            The ledger will be updated and this action cannot be undone.
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            type="button"
            onClick={() => setStep('input')}
          >
            Go Back
          </Button>
          <Button
            variant="warning"
            size="sm"
            icon={CheckCircle2}
            type="button"
            onClick={handleConfirm}
          >
            Confirm & Apply Adjustment
          </Button>
        </div>
      </div>
    );
  }

  // ── INPUT STEP ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleReview} className="space-y-4">
      {/* Product Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Product to Adjust *
        </label>
        <select
          value={productId}
          onChange={(e) => handleProductChange(e.target.value)}
          className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Select a product —</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku}) — Total: {p.totalStock} {p.unit}
            </option>
          ))}
        </select>
      </div>

      {/* Warehouse Selection */}
      <Select
        label="Warehouse / Location *"
        options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.city})` }))}
        value={warehouseId}
        onChange={(e) => handleWarehouseChange(e.target.value)}
      />

      {/* System Qty | Physical Qty | Auto Difference */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 items-center">
        {/* System Quantity (read-only, from context) */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 block mb-1">System Recorded</p>
          <p className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300">
            {systemQty}
            <span className="text-xs font-normal text-slate-400 ml-1">{selectedProd?.unit || 'units'}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">From InventoryContext</p>
        </div>

        {/* Physical Count (user enters) */}
        <div>
          <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-1">
            Physical Counted *
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={physicalQty}
            placeholder={String(systemQty)}
            onChange={(e) => { setPhysicalQty(e.target.value); setError(''); }}
            className="w-full text-sm bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-lg p-2 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">Counted on shelf</p>
        </div>

        {/* Auto-calculated difference (read-only) */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 block mb-1">Variance (Auto)</p>
          <div className={`p-2 rounded-lg ${diffBg} flex items-center gap-1.5`}>
            <DiffIcon className={`w-3.5 h-3.5 ${diffColor} shrink-0`} />
            <span className={`font-extrabold font-mono text-sm ${diffColor}`}>
              {difference === null
                ? '—'
                : `${difference > 0 ? '+' : ''}${difference}`}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Physical − System</p>
        </div>
      </div>

      {/* Reason */}
      <Select
        label="Adjustment Reason *"
        options={adjustmentReasons.map(r => ({ value: r, label: r }))}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Audit Notes & Incident Documentation
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Broken packaging on shelf B2, scrap ticket #SC-881"
          className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Zero difference info */}
      {difference === 0 && physicalQty !== '' && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Physical count matches the system record exactly. Applying this will confirm the count with no stock change.</span>
        </div>
      )}

      {/* Submit row */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button variant="outline" size="sm" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" icon={SlidersHorizontal} type="submit">
          Review Adjustment →
        </Button>
      </div>
    </form>
  );
};

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
export const AddAdjustmentModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Stock Inventory Adjustment"
      subtitle="Reconcile variances between recorded system inventory and physical audited counts."
      maxWidth="max-w-xl"
    >
      {/* key forces full form + step reset each time modal opens */}
      <AdjustmentForm key={String(isOpen)} onClose={onClose} />
    </Modal>
  );
};
