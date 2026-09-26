export const initialWarehouses = [
  {
    id: 'WH-MAIN',
    name: 'Main Central Warehouse',
    code: 'WH-MAIN',
    city: 'Chicago, IL',
    address: '4500 Industrial Parkway, Dock 12',
    manager: 'Sarah Jenkins',
    capacity: 25000,
    currentUtilization: 18450,
    status: 'Active',
    zones: ['Zone A (High-Bay)', 'Zone B (Bulk Pallets)', 'Zone C (Temperature Controlled)', 'Staging Dock 1-4'],
    temperature: 'Ambient (68°F)',
    type: 'Primary Hub'
  },
  {
    id: 'WH-PROD',
    name: 'Production & Assembly Floor',
    code: 'WH-PROD',
    city: 'Detroit, MI',
    address: '1200 Manufacturing Way, Bldg 3',
    manager: 'Marcus Vance',
    capacity: 8000,
    currentUtilization: 5240,
    status: 'Active',
    zones: ['Assembly Line 1 Buffers', 'Assembly Line 2 Buffers', 'Work-in-Progress Bay', 'Sub-Assembly Storage'],
    temperature: 'Standard',
    type: 'Production Site'
  },
  {
    id: 'WH-SEC',
    name: 'Warehouse 2 (West Hub)',
    code: 'WH-SEC',
    city: 'Reno, NV',
    address: '880 Logistics Blvd, Suite 200',
    manager: 'Elena Rostova',
    capacity: 16000,
    currentUtilization: 9800,
    status: 'Active',
    zones: ['Rack Cluster 1-6', 'Fast-Pick Conveyor E', 'Cross-Dock Lane 2'],
    temperature: 'Ambient (72°F)',
    type: 'Distribution Hub'
  },
  {
    id: 'WH-EAST',
    name: 'East Coast Fulfillment',
    code: 'WH-EAST',
    city: 'Allentown, PA',
    address: '310 Lehigh Valley Rd',
    manager: 'David Chen',
    capacity: 12000,
    currentUtilization: 8650,
    status: 'Active',
    zones: ['Mezzanine Pick Pack', 'Heavy Cargo Bay', 'Inbound Quarantine'],
    temperature: 'Ambient (65°F)',
    type: 'Fulfillment Center'
  }
];

export const initialCategories = [
  'Raw Materials',
  'Electronics',
  'Furniture',
  'Office Supplies',
  'Finished Goods'
];
