import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { Save } from 'lucide-react';

export const EditProductModal = ({ isOpen, onClose, product }) => {
  const { updateProduct, categories } = useInventory();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: '',
    costPrice: '',
    sellingPrice: '',
    minReorderPoint: '',
    barcode: '',
    description: ''
  });

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
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !product) return;

    updateProduct(product.id, {
      ...formData,
      costPrice: Number(formData.costPrice || 0),
      sellingPrice: Number(formData.sellingPrice || 0),
      minReorderPoint: Number(formData.minReorderPoint || 0)
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Product: ${product?.name || ''}`}
      subtitle="Update item properties, category pricing and reordering rules."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="SKU"
            value={formData.sku}
            disabled
            hint="SKU identifier is fixed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={categories}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <Input
            label="Unit of Measure"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
            label="Min Reorder Level"
            type="number"
            value={formData.minReorderPoint}
            onChange={(e) => setFormData({ ...formData, minReorderPoint: e.target.value })}
          />
        </div>

        <Input
          label="Barcode"
          value={formData.barcode}
          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </form>
    </Modal>
  );
};
