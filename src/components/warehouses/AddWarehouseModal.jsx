import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useInventory } from '../../context/InventoryContext';
import { Warehouse } from 'lucide-react';

export const AddWarehouseModal = ({ isOpen, onClose }) => {
  const { addWarehouse } = useInventory();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    address: '',
    manager: 'Anish',
    capacity: '15000',
    type: 'Regional Hub',
    temperature: 'Ambient (68°F)'
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.city.trim()) {
      setError('Please provide warehouse name, code, and city location.');
      return;
    }

    addWarehouse({
      ...formData,
      capacity: Number(formData.capacity || 10000),
      zones: ['Aisle 1-4 (Standard Pallets)', 'Pick & Pack Stage', 'High-Bay Rack 1-2']
    });

    onClose();
    setFormData({
      name: '',
      code: '',
      city: '',
      address: '',
      manager: 'Anish',
      capacity: '15000',
      type: 'Regional Hub',
      temperature: 'Ambient (68°F)'
    });
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Warehouse Facility"
      subtitle="Expand logistics network capacity and register storage locations."
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Warehouse}
            onClick={handleSubmit}
          >
            Register Facility
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Warehouse Name *"
            placeholder="e.g. North Hub Logistics"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Facility Code *"
            placeholder="e.g. WH-NORTH"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City & State *"
            placeholder="e.g. Dallas, TX"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            label="Street Address"
            placeholder="e.g. 500 Commerce Way, Bldg A"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Facility Manager"
            value={formData.manager}
            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
          />
          <Input
            label="Max Pallet/Unit Capacity"
            type="number"
            min="1000"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Facility Role / Type"
            options={['Primary Hub', 'Regional Hub', 'Fulfillment Center', 'Production Site', 'Cross-Dock Transit']}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
          <Select
            label="Climate Control"
            options={['Ambient (68°F)', 'Temperature Controlled (50-65°F)', 'Cold Storage (34-40°F)', 'Standard Unconditioned']}
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
          />
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        )}
      </form>
    </Modal>
  );
};
