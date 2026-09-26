import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { Plus, Trash2, Truck, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const AddDeliveryModal = ({ isOpen, onClose }) => {
  const { addDelivery, validateDelivery, products, warehouses, customers } = useInventory();

  const [customer, setCustomer] = useState(customers[0] || 'Apex Robotics International');
  const [customerEmail, setCustomerEmail] = useState('orders@client.com');
  const [shippingAddress, setShippingAddress] = useState('740 Tech Boulevard, Austin, TX');
  const [warehouseId, setWarehouseId] = useState('WH-MAIN');
  const [priority, setPriority] = useState('Normal');
  const [carrier, setCarrier] = useState('FedEx Priority Freight');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    {
      productId: products[0]?.id || 'PRD-001',
      qty: 10,
      unitPrice: products[0]?.sellingPrice || 19.99
    }
  ]);

  const handleItemChange = (index, field, value) => {
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
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0);

  const handleSave = (shouldValidate = false) => {
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
      priority,
      carrier,
      notes,
      items: formattedItems,
      status: shouldValidate ? 'Done' : 'Picking'
    });

    if (shouldValidate && newDel) {
      validateDelivery(newDel.id);
    }

    onClose();
  };

  return (
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
              onClick={() => handleSave(false)}
            >
              Save as Picking
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => handleSave(true)}
            >
              Validate & Dispatch
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Customer *"
            options={customers}
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
          <Select
            label="Dispatch Warehouse *"
            options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.city})` }))}
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          />
          <Select
            label="Priority Level"
            options={['Normal', 'High', 'Urgent']}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer Email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
          <Input
            label="Shipping Destination Address *"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
          />
        </div>

        {/* Dynamic Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
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
              const availableWhStock = selectedProd?.stockByWarehouse?.[warehouseId] || 0;

              return (
                <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 font-semibold">Product</label>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                        Avail: {availableWhStock} {selectedProd?.unit}
                      </span>
                    </div>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {p.stockByWarehouse?.[warehouseId] || 0} in {warehouseId}
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
                      max={availableWhStock || 9999}
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono"
                    />
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
  );
};
