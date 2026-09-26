import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { ArrowLeftRight, AlertTriangle, ShieldCheck } from 'lucide-react';

export const AddTransferModal = ({ isOpen, onClose }) => {
  const { createTransfer, products, warehouses } = useInventory();

  const [productId, setProductId] = useState(products[0]?.id || 'PRD-001');
  const [fromWarehouseId, setFromWarehouseId] = useState('WH-MAIN');
  const [toWarehouseId, setToWarehouseId] = useState('WH-PROD');
  const [qty, setQty] = useState('20');
  const [carrier, setCarrier] = useState('Internal Shuttle Truck #3');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectedProd = products.find(p => p.id === productId);
  const availableAtSource = selectedProd?.stockByWarehouse?.[fromWarehouseId] || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fromWarehouseId === toWarehouseId) {
      setError('Source and destination warehouses cannot be the same facility.');
      return;
    }

    if (Number(qty) <= 0) {
      setError('Transfer quantity must be greater than 0.');
      return;
    }

    if (Number(qty) > availableAtSource) {
      setError(`Insufficient stock at source. Only ${availableAtSource} ${selectedProd?.unit || 'units'} available in ${fromWarehouseId}.`);
      return;
    }

    createTransfer({
      productId,
      fromWarehouseId,
      toWarehouseId,
      qty: Number(qty),
      carrier,
      notes
    });

    onClose();
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Internal Stock Transfer"
      subtitle="Relocate inventory between warehouse zones or production facilities without altering total inventory."
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ArrowLeftRight}
            onClick={handleSubmit}
          >
            Execute Stock Transfer
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Product to Transfer *
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Total Stock: {p.totalStock} {p.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Source -> Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Source Warehouse (From) *"
              options={warehouses.map(w => ({ value: w.id, label: w.name }))}
              value={fromWarehouseId}
              onChange={(e) => {
                setFromWarehouseId(e.target.value);
                setError('');
              }}
            />
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
              Available at source: <strong>{availableAtSource} {selectedProd?.unit}</strong>
            </p>
          </div>

          <div>
            <Select
              label="Destination Warehouse (To) *"
              options={warehouses.map(w => ({ value: w.id, label: w.name }))}
              value={toWarehouseId}
              onChange={(e) => {
                setToWarehouseId(e.target.value);
                setError('');
              }}
            />
          </div>
        </div>

        {/* Transfer Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={`Transfer Quantity (${selectedProd?.unit || 'units'}) *`}
            type="number"
            min="1"
            max={availableAtSource || 9999}
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              setError('');
            }}
          />
          <Input
            label="Internal Transport / AGV / Shuttle"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
        </div>

        {/* Info Note */}
        <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Inventory Neutral:</strong> This operation updates location stock buffers ({fromWarehouseId} &minus;{qty || 0}, {toWarehouseId} +{qty || 0}) while maintaining the global company inventory balance.
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Transfer Reason & Routing Instructions"
          placeholder="e.g. Shift 1 buffer replenishment, Work order WO-902"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  );
};
