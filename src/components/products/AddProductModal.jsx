import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { PackagePlus } from 'lucide-react';

export const AddProductModal = ({ isOpen, onClose }) => {
  const { addProduct, categories, warehouses } = useInventory();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: categories[0] || 'Raw Materials',
    unit: 'units',
    initialStock: '50',
    warehouseId: 'WH-MAIN',
    costPrice: '25.00',
    sellingPrice: '45.00',
    minReorderPoint: '20',
    barcode: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  const units = ['units', 'kg', 'meters', 'rolls', 'sheets', 'packs', 'boxes'];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU code is required';
    if (Number(formData.initialStock) < 0) errs.initialStock = 'Stock cannot be negative';
    if (Number(formData.minReorderPoint) < 0) errs.minReorderPoint = 'Min reorder point must be 0 or higher';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    addProduct({
      ...formData,
      stockByWarehouse: {
        [formData.warehouseId]: Number(formData.initialStock || 0),
        'WH-MAIN': formData.warehouseId === 'WH-MAIN' ? Number(formData.initialStock || 0) : 0,
        'WH-PROD': formData.warehouseId === 'WH-PROD' ? Number(formData.initialStock || 0) : 0,
        'WH-SEC': formData.warehouseId === 'WH-SEC' ? Number(formData.initialStock || 0) : 0,
        'WH-EAST': formData.warehouseId === 'WH-EAST' ? Number(formData.initialStock || 0) : 0,
      }
    });

    onClose();
    // Reset form
    setFormData({
      name: '',
      sku: '',
      category: categories[0] || 'Raw Materials',
      unit: 'units',
      initialStock: '50',
      warehouseId: 'WH-MAIN',
      costPrice: '25.00',
      sellingPrice: '45.00',
      minReorderPoint: '20',
      barcode: '',
      description: ''
    });
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Inventory Product"
      subtitle="Register a new item in the catalog with initial stock and warehouse assignment."
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            placeholder="e.g. Precision Microcontroller X2"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="SKU Code *"
            placeholder="e.g. SKU-108"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            error={errors.sku}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={categories}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <Select
            label="Unit of Measure"
            options={units}
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Initial Stock Quantity"
            type="number"
            min="0"
            value={formData.initialStock}
            onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
            error={errors.initialStock}
          />
          <Select
            label="Primary Warehouse Location"
            options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.city})` }))}
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Cost Price ($)"
            type="number"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
          />
          <Input
            label="Selling Price ($)"
            type="number"
            step="0.01"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
          />
          <Input
            label="Reorder Alert Threshold"
            type="number"
            min="1"
            value={formData.minReorderPoint}
            onChange={(e) => setFormData({ ...formData, minReorderPoint: e.target.value })}
            error={errors.minReorderPoint}
          />
        </div>

        <Input
          label="Barcode / GTIN Number"
          placeholder="e.g. 890123450999"
          value={formData.barcode}
          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Description & Notes
          </label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Technical specs, storage requirements, handling notes..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </form>
    </Modal>
  );
};
