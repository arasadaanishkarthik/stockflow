export const initialReceipts = [
  {
    id: 'REC-1041',
    receiptNumber: 'REC-1041',
    supplier: 'Apex Metallurgy Corp',
    supplierEmail: 'orders@apexmetals.com',
    warehouseId: 'WH-MAIN',
    warehouseName: 'Main Central Warehouse',
    date: '2026-09-26 09:15',
    expectedDate: '2026-09-26',
    status: 'Ready', // Draft, Waiting, Ready, Done, Canceled
    items: [
      {
        productId: 'PRD-001',
        productName: 'Industrial Steel Rods (10mm)',
        sku: 'SKU-001',
        qty: 150,
        unit: 'kg',
        unitCost: 4.50
      },
      {
        productId: 'PRD-005',
        productName: 'Aluminum Alloy Sheets (4x8ft)',
        sku: 'SKU-005',
        qty: 40,
        unit: 'sheets',
        unitCost: 38.00
      }
    ],
    totalAmount: 2195.00,
    notes: 'Urgent incoming batch for production line buffer replenishment. Truck carrier dock 4.',
    receivedBy: 'Sarah Jenkins'
  },
  {
    id: 'REC-1042',
    receiptNumber: 'REC-1042',
    supplier: 'Silicon Dynamics Ltd',
    supplierEmail: 'supply@silicondynamics.io',
    warehouseId: 'WH-MAIN',
    warehouseName: 'Main Central Warehouse',
    date: '2026-09-26 08:30',
    expectedDate: '2026-09-27',
    status: 'Waiting',
    items: [
      {
        productId: 'PRD-004',
        productName: 'Precision Microcontroller Board X1',
        sku: 'SKU-004',
        qty: 200,
        unit: 'units',
        unitCost: 14.20
      },
      {
        productId: 'PRD-003',
        productName: 'Industrial Core Laptop i7',
        sku: 'SKU-003',
        qty: 15,
        unit: 'units',
        unitCost: 720.00
      }
    ],
    totalAmount: 13640.00,
    notes: 'Inbound air freight from Taiwan customs clearance verified.',
    receivedBy: 'Pending Assignment'
  },
  {
    id: 'REC-1043',
    receiptNumber: 'REC-1043',
    supplier: 'ErgoTech Furnishings Inc',
    supplierEmail: 'b2b@ergotech.com',
    warehouseId: 'WH-SEC',
    warehouseName: 'Warehouse 2 (West Hub)',
    date: '2026-09-25 15:45',
    expectedDate: '2026-09-25',
    status: 'Done',
    items: [
      {
        productId: 'PRD-002',
        productName: 'Ergonomic Mesh Office Chair',
        sku: 'SKU-002',
        qty: 50,
        unit: 'units',
        unitCost: 85.00
      }
    ],
    totalAmount: 4250.00,
    notes: 'Completed delivery, quality QC inspection passed 100%.',
    receivedBy: 'Elena Rostova'
  },
  {
    id: 'REC-1044',
    receiptNumber: 'REC-1044',
    supplier: 'PackPro Logistics Supplies',
    supplierEmail: 'orders@packpro.net',
    warehouseId: 'WH-MAIN',
    warehouseName: 'Main Central Warehouse',
    date: '2026-09-24 11:20',
    expectedDate: '2026-09-24',
    status: 'Done',
    items: [
      {
        productId: 'PRD-006',
        productName: 'Thermal Shipping Barcode Labels',
        sku: 'SKU-006',
        qty: 100,
        unit: 'rolls',
        unitCost: 6.50
      }
    ],
    totalAmount: 650.00,
    notes: 'Standard monthly packaging restock PO-4481.',
    receivedBy: 'Sarah Jenkins'
  },
  {
    id: 'REC-1045',
    receiptNumber: 'REC-1045',
    supplier: 'VoltMax Energy Systems',
    supplierEmail: 'enterprise@voltmaxenergy.com',
    warehouseId: 'WH-MAIN',
    warehouseName: 'Main Central Warehouse',
    date: '2026-09-26 10:00',
    expectedDate: '2026-09-28',
    status: 'Draft',
    items: [
      {
        productId: 'PRD-012',
        productName: 'Lithium Iron Phosphate Battery 48V',
        sku: 'SKU-012',
        qty: 20,
        unit: 'units',
        unitCost: 420.00
      }
    ],
    totalAmount: 8400.00,
    notes: 'Draft PO under review by procurement manager.',
    receivedBy: 'Anish (Procurement)'
  }
];

export const mockSuppliers = [
  'Apex Metallurgy Corp',
  'Silicon Dynamics Ltd',
  'ErgoTech Furnishings Inc',
  'PackPro Logistics Supplies',
  'VoltMax Energy Systems',
  'Global Fasteners & Hardware',
  'Precision Sensors Global'
];
