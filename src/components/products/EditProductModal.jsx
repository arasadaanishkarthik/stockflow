import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { Save } from 'lucide-react';

const UNITS = ['units', 'kg', 'grams', 'meters', 'cm', 'liters', 'ml', 'rolls', 'sheets', 'packs', 'boxes', 'pallets'];

export const EditProductModal = ({ isOpen, onClose, product }) => {
  const { updateProduct, categories } = useInventory();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'units',
    costPrice: '',
    sellingPrice: '',
    minReorderPoint: '',
    barcode: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || 'Raw Materials',
        unit: product.unit || 'units',
        costPrice: String(product.costPrice || ''),
        sellingPrice: String(product.sellingPrice || ''),
        minReorderPoint: String(product.minReorderPoint || ''),
        barcode: product.barcode || '',
        description: product.description || ''
      });
      setErrors({});
    }
  }, [product]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (Number(formData.costPrice) < 0) errs.costPrice = 'Cost price cannot be negative';
    if (Number(formData.sellingPrice) < 0) errs.sellingPrice = 'Selling price cannot be negative';
    if (Number(formData.minReorderPoint) < 0) errs.minReorderPoint = 'Reorder point cannot be negative';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    updateProduct(product.id, {
      name: formData.name.trim(),
      category: formData.category,
      unit: formData.unit,
      costPrice: Number(formData.costPrice || 0),
      sellingPrice: Number(formData.sellingPrice || 0),
      minReorderPoint: Number(formData.minReorderPoint || 0),
      barcode: formData.barcode.trim(),
      description: formData.description.trim()
      // Note: stockByWarehouse is intentionally NOT changed here.
      // Stock levels are only modified by receiveStock / deliverStock / transferStock / adjustStock.
    });
    onClose();
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Product: ${product?.name || ''}`}
      subtitle="Update item properties, category, pricing and reordering rules. Stock levels are managed via Receipts, Deliveries, Transfers and Adjustments."
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" icon={Save} onClick={handleSubmit}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name + SKU (readonly) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            value={formData.name}
            onChange={set('name')}
            error={errors.name}
          />
          <Input
            label="SKU"
            value={formData.sku}
            disabled
            hint="SKU identifier is fixed after creation"
          />
        </div>

        {/* Row 2: Category + Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={categories}
            value={formData.category}
            onChange={set('category')}
          />
          <Select
            label="Unit of Measure"
            options={UNITS}
            value={formData.unit}
            onChange={set('unit')}
          />
        </div>

        {/* Row 3: Prices + Reorder */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Cost Price ($)"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPrice}
            onChange={set('costPrice')}
            error={errors.costPrice}
          />
          <Input
            label="Selling Price ($)"
            type="number"
            step="0.01"
            min="0"
            value={formData.sellingPrice}
            onChange={set('sellingPrice')}
            error={errors.sellingPrice}
          />
          <Input
            label="Min Reorder Level"
            type="number"
            min="0"
            value={formData.minReorderPoint}
            onChange={set('minReorderPoint')}
            error={errors.minReorderPoint}
          />
        </div>

        {/* Row 4: Barcode */}
        <Input
          label="Barcode / GTIN"
          placeholder="e.g. 890123450999"
          value={formData.barcode}
          onChange={set('barcode')}
        />

        {/* Row 5: Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={set('description')}
            placeholder="Technical specs, storage requirements, handling notes..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Stock info banner */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Stock levels are not editable here.</strong> Use Receipts to add stock, Deliveries to remove stock,
            Transfers to move between warehouses, and Adjustments to correct physical count variances.
          </span>
        </div>
      </form>
    </Modal>
  );
};
