import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { ArrowLeftRight, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

// Inner form — mounted fresh each time modal opens via key={isOpen} in parent
const AddTransferForm = ({ onClose }) => {
  const { createTransfer, products, warehouses } = useInventory();

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [fromWarehouseId, setFromWarehouseId] = useState('WH-MAIN');
  const [toWarehouseId, setToWarehouseId] = useState('WH-PROD');
  const [qty, setQty] = useState('');
  const [carrier, setCarrier] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectedProd = products.find(p => p.id === productId);
  const availableAtSource = selectedProd?.stockByWarehouse?.[fromWarehouseId] ?? 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!productId) {
      setError('Please select a product to transfer.');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setError('Source and destination warehouses cannot be the same facility.');
      return;
    }
    const numQty = Number(qty);
    if (!qty || numQty <= 0) {
      setError('Transfer quantity must be greater than 0.');
      return;
    }
    if (numQty > availableAtSource) {
      setError(
        `Insufficient stock at source. Only ${availableAtSource} ${selectedProd?.unit || 'units'} available at the selected source warehouse.`
      );
      return;
    }

    const result = createTransfer({
      productId,
      fromWarehouseId,
      toWarehouseId,
      qty: numQty,
      carrier: carrier.trim() || 'Internal Shuttle Logistics',
      notes: notes.trim(),
      status: 'Pending'   // Two-step workflow: create as Pending, validate to move stock
    });

    if (result) {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pending workflow notice */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          <strong>Two-Step Workflow:</strong> Creating a transfer sets it to <em>Pending</em>.
          Stock does not move until you click <strong>Validate</strong> on the transfers table.
        </span>
      </div>

      {/* Product Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Product to Transfer *
        </label>
        <select
          value={productId}
          onChange={(e) => { setProductId(e.target.value); setError(''); }}
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

      {/* Source → Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Select
            label="Source Warehouse (From) *"
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            value={fromWarehouseId}
            onChange={(e) => { setFromWarehouseId(e.target.value); setError(''); }}
          />
          {selectedProd && (
            <p className="text-[11px] font-medium mt-1">
              <span className="text-slate-400">Available at source: </span>
              <span className={`font-bold ${availableAtSource <= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {availableAtSource} {selectedProd.unit}
              </span>
            </p>
          )}
        </div>

        <div>
          <Select
            label="Destination Warehouse (To) *"
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            value={toWarehouseId}
            onChange={(e) => { setToWarehouseId(e.target.value); setError(''); }}
          />
          {selectedProd && fromWarehouseId !== toWarehouseId && (
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Current at dest: <span className="font-bold text-slate-600 dark:text-slate-300">
                {selectedProd.stockByWarehouse?.[toWarehouseId] ?? 0} {selectedProd.unit}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Quantity & Carrier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={`Transfer Quantity (${selectedProd?.unit || 'units'}) *`}
          type="number"
          min="1"
          max={availableAtSource || 9999}
          value={qty}
          placeholder="Enter quantity"
          onChange={(e) => { setQty(e.target.value); setError(''); }}
        />
        <Input
          label="Transport / AGV / Shuttle"
          value={carrier}
          placeholder="e.g. Internal Shuttle #3"
          onChange={(e) => setCarrier(e.target.value)}
        />
      </div>

      {/* Stock preview */}
      {selectedProd && qty && Number(qty) > 0 && fromWarehouseId !== toWarehouseId && (
        <div className="p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-xs space-y-1.5">
          <p className="font-bold text-purple-800 dark:text-purple-300 text-[11px] uppercase tracking-wide">
            Preview (after validation)
          </p>
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span>{warehouses.find(w => w.id === fromWarehouseId)?.name || fromWarehouseId}</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {availableAtSource} → {Math.max(0, availableAtSource - Number(qty))} {selectedProd.unit}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span>{warehouses.find(w => w.id === toWarehouseId)?.name || toWarehouseId}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {selectedProd.stockByWarehouse?.[toWarehouseId] ?? 0} → {(selectedProd.stockByWarehouse?.[toWarehouseId] ?? 0) + Number(qty)} {selectedProd.unit}
            </span>
          </div>
          <div className="border-t border-purple-200 dark:border-purple-800 pt-1.5 flex justify-between text-purple-700 dark:text-purple-400 font-semibold">
            <span>Total (unchanged)</span>
            <span>{selectedProd.totalStock} {selectedProd.unit}</span>
          </div>
        </div>
      )}

      {/* Inventory Neutral info */}
      <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Inventory Neutral:</strong> This operation only redistributes stock between locations.
          The company-wide total inventory balance remains unchanged.
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Transfer Reason & Routing Instructions
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Shift 1 buffer replenishment, Work order WO-902"
          className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Submit row */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button variant="outline" size="sm" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" icon={ArrowLeftRight} type="submit">
          Create Transfer (Pending)
        </Button>
      </div>
    </form>
  );
};

// Wrapper uses key={isOpen} to remount form fresh on every open
export const AddTransferModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Internal Stock Transfer"
      subtitle="Request a stock relocation between warehouses. Stock moves only after validation."
      maxWidth="max-w-xl"
    >
      {/* key forces full form reset each time modal opens */}
      <AddTransferForm key={String(isOpen)} onClose={onClose} />
    </Modal>
  );
};
