export const initialDeliveries = [
  {
    id: 'DEL-2081',
    deliveryId: 'DEL-2081',
    customer: 'Apex Robotics International',
    customerEmail: 'shipping@apexrobotics.io',
    shippingAddress: '740 Tech Boulevard, Austin, TX 78701',
    warehouseId: 'WH-MAIN',
    warehouseName: 'Main Central Warehouse',
    date: '2026-09-26 09:40',
    status: 'Picking', // Draft, Picking, Packing, Done, Canceled
    priority: 'High',
    items: [
      {
        productId: 'PRD-007',
        productName: 'Smart Conveyor Sensor Unit V2',
        sku: 'SKU-007',
        qty: 12,
        unit: 'units',
        unitPrice: 245.00
      },
      {
        productId: 'PRD-010',
        productName: 'Industrial IoT Gateway 5G',
        sku: 'SKU-010',
        qty: 4,
        unit: 'units',
        unitPrice: 580.00
      }
    ],
    totalAmount: 5260.00,
    trackingNumber: 'FX-88492019US',
    carrier: 'FedEx Priority Freight',
    notes: 'Same-day urgent dispatch for factory installation pilot.',
    dispatchedBy: 'Sarah Jenkins'
  },
  {
    id: 'DEL-2082',
    deliveryId: 'DEL-2082',
    customer: 'NextGen Office Hubs',
    customerEmail: 'facilities@nextgenoffices.com',
    shippingAddress: '120 Market Street, Floor 14, San Francisco, CA 94105',
    warehouseId: 'WH-SEC',
    warehouseName: 'Warehouse 2 (West Hub)',
    date: '2026-09-26 08:20',
    status: 'Packing',
    priority: 'Medium',
    items: [
      {
        productId: 'PRD-002',
        productName: 'Ergonomic Mesh Office Chair',
        sku: 'SKU-002',
        qty: 10,
        unit: 'units',
        unitPrice: 169.00
      }
    ],
    totalAmount: 1690.00,
    trackingNumber: 'UPS-1Z992A0129',
    carrier: 'UPS Ground Commercial',
    notes: 'Scheduled delivery window between 14:00 - 17:00 PST.',
    dispatchedBy: 'Elena Rostova'
  },
  {
    id: 'DEL-2083',
    deliveryId: 'DEL-2083',
    customer: 'Cascade Automation Corp',
    customerEmail: 'orders@cascadeauto.org',
    shippingAddress: '55 Cascade Way, Seattle, WA 98101',
    warehouseId: 'WH-MAIN',
    warehouseName: 'Main Central Warehouse',
    date: '2026-09-25 16:30',
    status: 'Done',
    priority: 'High',
    items: [
      {
        productId: 'PRD-004',
        productName: 'Precision Microcontroller Board X1',
        sku: 'SKU-004',
        qty: 50,
        unit: 'units',
        unitPrice: 28.50
      },
      {
        productId: 'PRD-001',
        productName: 'Industrial Steel Rods (10mm)',
        sku: 'SKU-001',
        qty: 60,
        unit: 'kg',
        unitPrice: 7.20
      }
    ],
    totalAmount: 1857.00,
    trackingNumber: 'DHL-EX-9920194',
    carrier: 'DHL Express',
    notes: 'Signed and delivered at destination receiving bay.',
    dispatchedBy: 'Sarah Jenkins'
  },
  {
    id: 'DEL-2084',
    deliveryId: 'DEL-2084',
    customer: 'Pinnacle Research Labs',
    customerEmail: 'procurement@pinnacleresearch.edu',
    shippingAddress: '200 University Ave, Cambridge, MA 02138',
    warehouseId: 'WH-EAST',
    warehouseName: 'East Coast Fulfillment',
    date: '2026-09-24 14:10',
    status: 'Done',
    priority: 'Normal',
    items: [
      {
        productId: 'PRD-008',
        productName: 'Heavy-Duty Modular Workbench',
        sku: 'SKU-008',
        qty: 2,
        unit: 'units',
        unitPrice: 380.00
      }
    ],
    totalAmount: 760.00,
    trackingNumber: 'FX-33910244US',
    carrier: 'FedEx Freight',
    notes: 'Delivered to university lab loading bay 2.',
    dispatchedBy: 'David Chen'
  },
  {
    id: 'DEL-2085',
    deliveryId: 'DEL-2085',
    customer: 'BioTech Automation Labs',
    customerEmail: 'supply@biotechlabs.com',
    shippingAddress: '400 Science Park Rd, San Diego, CA 92121',
    warehouseId: 'WH-MAIN',
    warehouseName: 'Main Central Warehouse',
    date: '2026-09-26 10:15',
    status: 'Draft',
    priority: 'High',
    items: [
      {
        productId: 'PRD-007',
        productName: 'Smart Conveyor Sensor Unit V2',
        sku: 'SKU-007',
        qty: 5,
        unit: 'units',
        unitPrice: 245.00
      }
    ],
    totalAmount: 1225.00,
    trackingNumber: 'TBD',
    carrier: 'Pending Courier Selection',
    notes: 'Draft order awaiting payment confirmation from accounting.',
    dispatchedBy: 'Anish'
  }
];

export const mockCustomers = [
  'Apex Robotics International',
  'NextGen Office Hubs',
  'Cascade Automation Corp',
  'Pinnacle Research Labs',
  'BioTech Automation Labs',
  'Quantum Manufacturing LLC',
  'Metro Logistics Group'
];
