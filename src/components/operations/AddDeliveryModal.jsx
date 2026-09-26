import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useInventory } from '../../context/InventoryContext';
import { Plus, Trash2, Truck, CheckCircle2, AlertTriangle, Calendar, Hash } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const AddDeliveryModal = ({ isOpen, onClose }) => {
  const { addDelivery, validateDelivery, products, warehouses, customers, deliveries, getWarehouseName } = useInventory();

  const nextDeliveryId = `DEL-${2080 + (deliveries?.length || 0) + 1}`;

  const [customer, setCustomer] = useState(customers[0] || 'Apex Robotics International');
  const [customerEmail, setCustomerEmail] = useState('orders@client.com');
  const [shippingAddress, setShippingAddress] = useState('740 Tech Boulevard, Austin, TX');
  const [warehouseId, setWarehouseId] = useState('WH-MAIN');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('Draft');
  const [priority, setPriority] = useState('Normal');
  const [carrier, setCarrier] = useState('FedEx Priority Freight');
  const [notes, setNotes] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const [items, setItems] = useState([
    {
      productId: products[0]?.id || 'PRD-001',
      qty: 10,
      unitPrice: products[0]?.sellingPrice || 19.99
    }
  ]);

  const handleItemChange = (index, field, value) => {
    setFormError('');
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index].unitPrice = prod.sellingPrice;
      }
    }
    setItems(newItems);
  };

  const addItemRow = () => {
    setFormError('');
    setItems(prev => [
      ...prev,
      {
        productId: products[0]?.id || 'PRD-001',
        qty: 5,
        unitPrice: products[0]?.sellingPrice || 19.99
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setFormError('');
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0);

  // Validation logic
  const validateForm = () => {
    if (!customer || !customer.trim()) {
      setFormError('Customer is required.');
      return false;
    }
    if (!warehouseId) {
      setFormError('Dispatch warehouse is required.');
      return false;
    }
    if (!items || items.length === 0) {
      setFormError('At least one item is required.');
      return false;
    }

    // Check quantities and warehouse stock
    const qtyByProduct = {};
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        setFormError(`Item #${i + 1}: Product not found.`);
        return false;
      }
      const qtyNum = Number(item.qty);
      if (!item.qty || isNaN(qtyNum) || qtyNum <= 0) {
        setFormError(`Item #${i + 1} (${prod.name}): Quantity must be greater than 0.`);
        return false;
      }
      qtyByProduct[prod.id] = (qtyByProduct[prod.id] || 0) + qtyNum;
    }

    // Check against warehouse available stock
    for (const [prodId, reqQty] of Object.entries(qtyByProduct)) {
      const prod = products.find(p => p.id === prodId);
      const whStock = Number(prod?.stockByWarehouse?.[warehouseId] || 0);
      if (reqQty > whStock) {
        setFormError(
          `Insufficient stock for "${prod.name}": Available in ${getWarehouseName(warehouseId)} is ${whStock} ${prod.unit || 'units'}, but ${reqQty} requested.`
        );
        return false;
      }
    }

    setFormError('');
    return true;
  };

  const executeSave = (shouldValidate = false) => {
    const formattedItems = items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod?.name || 'Inventory Product',
        sku: prod?.sku || 'SKU-000',
        qty: Number(item.qty),
        unit: prod?.unit || 'units',
        unitPrice: Number(item.unitPrice)
      };
    });

    const newDel = addDelivery({
      customer,
      customerEmail,
      shippingAddress,
      warehouseId,
      date: date ? `${date} ${new Date().toTimeString().slice(0, 5)}` : new Date().toISOString().slice(0, 16).replace('T', ' '),
      priority,
      carrier,
      notes,
      items: formattedItems,
      status: shouldValidate ? 'Draft' : status
    });

    if (newDel) {
      if (shouldValidate) {
        validateDelivery(newDel.id);
      }
      onClose();
    }
  };

  const handleSaveClick = (shouldValidate = false) => {
    if (!validateForm()) return;

    if (shouldValidate) {
      setIsConfirmOpen(true);
    } else {
      executeSave(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create Outbound Delivery Order"
        subtitle="Dispatch inventory to customers and partners with automatic stock reduction."
        maxWidth="max-w-3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500 font-mono">
              Total Order Value: <strong className="text-slate-900 dark:text-slate-100 font-bold">{formatCurrency(totalAmount)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSaveClick(false)}
              >
                Save Delivery ({status})
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => handleSaveClick(true)}
              >
                Validate & Dispatch
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Delivery Number & Date preview bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">Order Number:</span>
              <strong className="font-mono text-blue-700 dark:text-blue-300">{nextDeliveryId}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Order Date:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Customer *"
              options={customers}
              value={customer}
              onChange={(e) => {
                setFormError('');
                setCustomer(e.target.value);
              }}
            />
            <Select
              label="Dispatch Warehouse *"
              options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.city})` }))}
              value={warehouseId}
              onChange={(e) => {
                setFormError('');
                setWarehouseId(e.target.value);
              }}
            />
            <Select
              label="Initial Status"
              options={['Draft', 'Picking']}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Priority Level"
              options={['Normal', 'High', 'Urgent']}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
            <Input
              label="Customer Email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
            <Input
              label="Shipping Address *"
              value={shippingAddress}
              onChange={(e) => {
                setFormError('');
                setShippingAddress(e.target.value);
              }}
            />
          </div>

          {/* Dynamic Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-500" />
                Dispatch Items ({items.length})
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
                const availableWhStock = Number(selectedProd?.stockByWarehouse?.[warehouseId] || 0);
                const isOverStock = Number(item.qty || 0) > availableWhStock;
                const isInvalidQty = !item.qty || Number(item.qty) <= 0;

                return (
                  <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 font-semibold">Product *</label>
                        <span className={`text-[10px] font-mono font-medium ${availableWhStock > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          Avail in {getWarehouseName(warehouseId)}: {availableWhStock} {selectedProd?.unit || 'units'}
                        </span>
                      </div>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20"
                      >
                        {products.map(p => {
                          const whStock = Number(p.stockByWarehouse?.[warehouseId] || 0);
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) — {whStock} {p.unit || 'units'} in {getWarehouseName(warehouseId)}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 font-semibold block">
                          Quantity ({selectedProd?.unit || 'units'}) *
                        </label>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                        className={`w-full text-xs bg-white dark:bg-slate-800 border rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono ${
                          isOverStock || isInvalidQty
                            ? 'border-rose-400 dark:border-rose-600 ring-1 ring-rose-400'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      />
                      {isOverStock && (
                        <span className="text-[9px] text-rose-500 font-medium block mt-0.5">
                          Exceeds available stock ({availableWhStock})
                        </span>
                      )}
                      {isInvalidQty && (
                        <span className="text-[9px] text-rose-500 font-medium block mt-0.5">
                          Must be &gt; 0
                        </span>
                      )}
                    </div>

                    <div className="w-28">
                      <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Unit Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono"
                      />
                    </div>

                    <div className="w-24 text-right self-end sm:self-center">
                      <span className="text-[10px] text-slate-400 font-semibold block sm:hidden">Subtotal</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {formatCurrency(Number(item.qty || 0) * Number(item.unitPrice || 0))}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Courier Carrier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            />
            <Input
              label="Delivery Notes & Handling"
              placeholder="e.g. Fragile electronic cargo, liftgate truck required"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog before validation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => executeSave(true)}
        title="Validate & Dispatch Delivery"
        message="Validating this delivery will reduce inventory stock."
        confirmText="Validate & Reduce Stock"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};
