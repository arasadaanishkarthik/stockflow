import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { Plus, Trash2, ArrowDownToLine, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const AddReceiptModal = ({ isOpen, onClose }) => {
  const { addReceipt, validateReceipt, products, warehouses, suppliers } = useInventory();

  const [supplier, setSupplier] = useState(suppliers[0] || 'Apex Metallurgy Corp');
  const [warehouseId, setWarehouseId] = useState('WH-MAIN');
  const [expectedDate, setExpectedDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    {
      productId: products[0]?.id || 'PRD-001',
      qty: 50,
      unitCost: products[0]?.costPrice || 10.0
    }
  ]);

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
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        productId: products[0]?.id || 'PRD-001',
        qty: 25,
        unitCost: products[0]?.costPrice || 10.0
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitCost || 0)), 0);

  const handleSave = (shouldValidate = false) => {
    const formattedItems = items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod?.name || 'Inventory Product',
        sku: prod?.sku || 'SKU-000',
        qty: Number(item.qty),
        unit: prod?.unit || 'units',
        unitCost: Number(item.unitCost)
      };
    });

    const newRec = addReceipt({
      supplier,
      warehouseId,
      expectedDate,
      notes,
      items: formattedItems,
      status: shouldValidate ? 'Done' : 'Waiting'
    });

    if (shouldValidate && newRec) {
      validateReceipt(newRec.id);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Inbound Goods Receipt"
      subtitle="Record incoming stock from suppliers into a designated warehouse facility."
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-mono">
            Total Inbound Value: <strong className="text-slate-900 dark:text-slate-100 font-bold">{formatCurrency(totalAmount)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave(false)}
            >
              Save as Waiting
            </Button>
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle2}
              onClick={() => handleSave(true)}
            >
              Validate & Add Stock
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Supplier *"
            options={suppliers}
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
          <Select
            label="Destination Warehouse *"
            options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.city})` }))}
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          />
          <Input
            label="Expected Delivery Date"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
        </div>

        {/* Dynamic Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Received Items ({items.length})
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

          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item, idx) => {
              const selectedProd = products.find(p => p.id === item.productId);
              return (
                <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                      Quantity ({selectedProd?.unit || 'units'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Unit Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
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
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg self-end sm:self-center transition-colors"
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
          placeholder="e.g. Carrier BOL #884920, Dock 4 arrival, Quality checked"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
};
