import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, ArrowDownToLine, Package, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const AddReceiptModal = ({ isOpen, onClose }) => {
  const { addReceipt, products, warehouses, suppliers, receipts } = useInventory();
  const toast = useToast();

  // Helper to compute next sequential receipt number
  const computeNextReceiptNumber = () => {
    let maxNum = 1045;
    (receipts || []).forEach(r => {
      const match = (r.receiptNumber || r.id || '').match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val >= maxNum) maxNum = val;
      }
    });
    return `REC-${maxNum + 1}`;
  };

  const [receiptNumber, setReceiptNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [warehouseId, setWarehouseId] = useState('WH-MAIN');
  const [status, setStatus] = useState('Waiting');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReceiptNumber(computeNextReceiptNumber());
      setSupplier(suppliers[0] || 'Apex Metallurgy Corp');
      setWarehouseId(warehouses[0]?.id || 'WH-MAIN');
      setStatus('Waiting');
      setDate(new Date().toISOString().slice(0, 10));
      setExpectedDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
      setNotes('');
      setErrors({});

      const defaultProduct = products[0];
      setItems([
        {
          productId: defaultProduct?.id || 'PRD-001',
          qty: 100,
          unitCost: defaultProduct?.costPrice || 4.50
        }
      ]);
    }
  }, [isOpen]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index].unitCost = prod.costPrice;
      }
    }
    setItems(newItems);

    // Clear specific item error if modified
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[`item_${index}_${field}`];
        return copy;
      });
    }
  };

  const addItemRow = () => {
    const defaultProduct = products[0];
    setItems(prev => [
      ...prev,
      {
        productId: defaultProduct?.id || '',
        qty: 25,
        unitCost: defaultProduct?.costPrice || 10.0
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitCost || 0)), 0);
  const totalUnits = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const validateForm = () => {
    const newErrors = {};

    if (!supplier || !supplier.trim()) {
      newErrors.supplier = 'Supplier name is required.';
    }

    if (!warehouseId) {
      newErrors.warehouseId = 'Destination warehouse must be selected.';
    }

    if (!receiptNumber || !receiptNumber.trim()) {
      newErrors.receiptNumber = 'Receipt number is required.';
    }

    if (!items || items.length === 0) {
      newErrors.items = 'At least one product item is required.';
    } else {
      items.forEach((item, idx) => {
        if (!item.productId) {
          newErrors[`item_${idx}_productId`] = 'Product must be selected.';
        }
        if (!item.qty || Number(item.qty) <= 0 || isNaN(Number(item.qty))) {
          newErrors[`item_${idx}_qty`] = 'Quantity must be > 0.';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (forcedStatus = null) => {
    if (!validateForm()) {
      toast.error('Validation Error', 'Please correct the highlighted fields before saving.');
      return;
    }

    const chosenStatus = forcedStatus || status;

    const formattedItems = items.map(item => {
      const prod = products.find(p => 
        p.id === item.productId || 
        p.sku === item.productId || 
        (item.productId && p.name && p.name.toLowerCase() === item.productId.toLowerCase())
      );
      return {
        productId: prod?.id || item.productId,
        productName: prod?.name || 'Industrial Steel Rods (10mm)',
        sku: prod?.sku || 'SKU-001',
        qty: Number(item.qty),
        unit: prod?.unit || 'kg',
        unitCost: Number(item.unitCost || prod?.costPrice || 0)
      };
    });

    const newRec = addReceipt({
      receiptNumber: receiptNumber.trim(),
      supplier: supplier.trim(),
      warehouseId,
      date,
      expectedDate,
      notes: notes.trim(),
      items: formattedItems,
      status: chosenStatus
    });

    if (newRec) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Inbound Goods Receipt"
      subtitle="Draft a supplier purchase order or incoming shipment. Stock will increase only after receipt validation."
      maxWidth="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="text-xs text-slate-500 font-mono">
            Total Units: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+{totalUnits}</strong> | Total Value: <strong className="text-slate-900 dark:text-slate-100 font-bold">{formatCurrency(totalAmount)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave('Draft')}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowDownToLine}
              onClick={() => handleSave(status)}
            >
              Create Receipt
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Row 1: Identification & Timing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Receipt # *"
            placeholder="REC-1046"
            value={receiptNumber}
            onChange={(e) => {
              setReceiptNumber(e.target.value);
              if (errors.receiptNumber) setErrors(prev => ({ ...prev, receiptNumber: undefined }));
            }}
            error={errors.receiptNumber}
          />

          <Select
            label="Initial Status *"
            options={[
              { value: 'Waiting', label: 'Waiting (Pending Delivery)' },
              { value: 'Ready', label: 'Ready (Arrived at Dock)' },
              { value: 'Draft', label: 'Draft (In Preparation)' }
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />

          <Input
            label="Receipt Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Row 2: Supplier, Destination & Expected Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Supplier *
            </label>
            <input
              list="suppliers-datalist"
              value={supplier}
              onChange={(e) => {
                setSupplier(e.target.value);
                if (errors.supplier) setErrors(prev => ({ ...prev, supplier: undefined }));
              }}
              placeholder="Select or enter supplier..."
              className={`w-full bg-white dark:bg-slate-900 border ${
                errors.supplier
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 dark:border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/20'
              } rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`}
            />
            <datalist id="suppliers-datalist">
              {suppliers.map((s, i) => (
                <option key={i} value={s} />
              ))}
            </datalist>
            {errors.supplier && (
              <p className="text-xs text-rose-500 font-medium mt-0.5">{errors.supplier}</p>
            )}
          </div>

          <Select
            label="Destination Warehouse *"
            options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.city})` }))}
            value={warehouseId}
            onChange={(e) => {
              setWarehouseId(e.target.value);
              if (errors.warehouseId) setErrors(prev => ({ ...prev, warehouseId: undefined }));
            }}
            error={errors.warehouseId}
          />

          <Input
            label="Expected Arrival Date"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
        </div>

        {/* Items Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-500" />
              Inbound Items ({items.length})
            </h4>
            <button
              type="button"
              onClick={addItemRow}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          {errors.items && (
            <p className="text-xs text-rose-500 font-medium">{errors.items}</p>
          )}

          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item, idx) => {
              const selectedProd = products.find(p => p.id === item.productId);
              const prodError = errors[`item_${idx}_productId`];
              const qtyError = errors[`item_${idx}_qty`];

              return (
                <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                      Product *
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className={`w-full text-xs bg-white dark:bg-slate-800 border ${
                        prodError ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                      } rounded-lg p-2 text-slate-800 dark:text-slate-200`}
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {p.unit}
                        </option>
                      ))}
                    </select>
                    {prodError && (
                      <span className="text-[10px] text-rose-500 block mt-0.5">{prodError}</span>
                    )}
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                      Quantity ({selectedProd?.unit || 'units'}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      className={`w-full text-xs bg-white dark:bg-slate-800 border ${
                        qtyError ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                      } rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono`}
                    />
                    {qtyError && (
                      <span className="text-[10px] text-rose-500 block mt-0.5">{qtyError}</span>
                    )}
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                      Unit Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>

                  <div className="w-24 text-right self-end sm:self-center">
                    <span className="text-[10px] text-slate-400 font-semibold block sm:hidden">Subtotal</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {formatCurrency(Number(item.qty || 0) * Number(item.unitCost || 0))}
                    </span>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg self-end sm:self-center transition-colors cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <Input
          label="Receipt Notes / PO Reference"
          placeholder="e.g. Carrier BOL #884920, Dock 4 arrival, Quality inspection required"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
};
