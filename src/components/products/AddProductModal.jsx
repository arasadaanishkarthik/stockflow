import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { PackagePlus } from 'lucide-react';

const UNITS = ['units', 'kg', 'grams', 'meters', 'cm', 'liters', 'ml', 'rolls', 'sheets', 'packs', 'boxes', 'pallets'];

export const AddProductModal = ({ isOpen, onClose }) => {
  const { addProduct, categories, warehouses, products } = useInventory();

  const defaultWarehouseId = warehouses[0]?.id || 'WH-MAIN';

  const getDefaultForm = () => ({
    name: '',
    sku: '',
    category: categories[0] || 'Raw Materials',
    unit: 'units',
    initialStock: '0',
    warehouseId: defaultWarehouseId,
    costPrice: '25.00',
    sellingPrice: '45.00',
    minReorderPoint: '20',
    barcode: '',
    description: ''
  });

  const [formData, setFormData] = useState(getDefaultForm);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.sku.trim()) {
      errs.sku = 'SKU code is required';
    } else if (products.some(p => p.sku?.trim().toLowerCase() === formData.sku.trim().toLowerCase())) {
      errs.sku = 'SKU code already exists in catalog. Please use a unique SKU.';
    }
    if (Number(formData.initialStock) < 0) errs.initialStock = 'Stock cannot be negative';
    if (Number(formData.minReorderPoint) < 0) errs.minReorderPoint = 'Min reorder point must be 0 or higher';
    if (Number(formData.costPrice) < 0) errs.costPrice = 'Cost price cannot be negative';
    if (Number(formData.sellingPrice) < 0) errs.sellingPrice = 'Selling price cannot be negative';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Build a clean stockByWarehouse: only the selected warehouse gets the initial stock.
    // InventoryContext.addProduct will zero out all other warehouses.
    addProduct({
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category,
      unit: formData.unit,
      warehouseId: formData.warehouseId,
      initialStock: Number(formData.initialStock || 0),
      costPrice: Number(formData.costPrice || 0),
      sellingPrice: Number(formData.sellingPrice || 0),
      minReorderPoint: Number(formData.minReorderPoint || 0),
      barcode: formData.barcode.trim(),
      description: formData.description.trim()
    });

    onClose();
    setFormData(getDefaultForm());
    setErrors({});
  };

  const handleClose = () => {
    onClose();
    setFormData(getDefaultForm());
    setErrors({});
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Inventory Product"
      subtitle="Register a new item in the catalog with initial stock and warehouse assignment."
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={PackagePlus}
            onClick={handleSubmit}
          >
            Create Product
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name + SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            placeholder="e.g. Steel Rod 10mm"
            value={formData.name}
            onChange={set('name')}
            error={errors.name}
          />
          <Input
            label="SKU Code *"
            placeholder="e.g. SKU-108"
            value={formData.sku}
            onChange={set('sku')}
            error={errors.sku}
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

        {/* Row 3: Initial Stock + Warehouse */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Initial Stock Quantity"
            type="number"
            min="0"
            value={formData.initialStock}
            onChange={set('initialStock')}
            error={errors.initialStock}
            hint="Stock placed in the selected warehouse below"
          />
          <Select
            label="Primary Warehouse Location"
            options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.city})` }))}
            value={formData.warehouseId}
            onChange={set('warehouseId')}
          />
        </div>

        {/* Row 4: Prices + Reorder */}
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
            label="Reorder Alert Threshold"
            type="number"
            min="0"
            value={formData.minReorderPoint}
            onChange={set('minReorderPoint')}
            error={errors.minReorderPoint}
          />
        </div>

        {/* Row 5: Barcode */}
        <Input
          label="Barcode / GTIN Number"
          placeholder="e.g. 890123450999 (optional)"
          value={formData.barcode}
          onChange={set('barcode')}
        />

        {/* Row 6: Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Description & Notes
          </label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={set('description')}
            placeholder="Technical specs, storage requirements, handling notes..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </form>
    </Modal>
  );
};
