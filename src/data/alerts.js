export const initialAlerts = [
  {
    id: 'ALT-101',
    title: 'Out of Stock: Aluminum Laptop Stand Pro',
    message: 'Current stock is 0 units across all warehouses. Reorder threshold is 50 units.',
    severity: 'Critical', // Critical, Warning, Info
    type: 'Stock',
    productId: 'PRD-009',
    timestamp: '10 min ago',
    date: '2026-09-26 09:50',
    isRead: false,
    actionText: 'Create Receipt PO'
  },
  {
    id: 'ALT-102',
    title: 'Low Stock: Industrial Steel Rods (10mm)',
    message: 'Total stock (450 kg) has fallen below minimum reorder point (500 kg).',
    severity: 'Warning',
    type: 'Stock',
    productId: 'PRD-001',
    timestamp: '25 min ago',
    date: '2026-09-26 09:35',
    isRead: false,
    actionText: 'Review Replenishment'
  },
  {
    id: 'ALT-103',
    title: 'Pending Receipt Validation: REC-1041',
    message: 'Apex Metallurgy shipment of 150 kg Steel Rods arrived at Dock 4 ready for validation.',
    severity: 'Info',
    type: 'Receipt',
    referenceId: 'REC-1041',
    timestamp: '45 min ago',
    date: '2026-09-26 09:15',
    isRead: false,
    actionText: 'Validate Receipt'
  },
  {
    id: 'ALT-104',
    title: 'Critical Stock: Lithium Iron Phosphate Battery',
    message: 'Only 7 units remain across facilities (Reorder point: 15). 4 units in Main Warehouse.',
    severity: 'Critical',
    type: 'Stock',
    productId: 'PRD-012',
    timestamp: '1 hour ago',
    date: '2026-09-26 09:00',
    isRead: false,
    actionText: 'Restock Order'
  },
  {
    id: 'ALT-105',
    title: 'High Priority Delivery: DEL-2081',
    message: 'Apex Robotics dispatch scheduled for delivery cutoff at 11:00 AM.',
    severity: 'Warning',
    type: 'Delivery',
    referenceId: 'DEL-2081',
    timestamp: '2 hours ago',
    date: '2026-09-26 08:00',
    isRead: true,
    actionText: 'Track Order'
  },
  {
    id: 'ALT-106',
    title: 'Adjustment Pending Approval: ADJ-4004',
    message: 'Elena Rostova reported -2 spools of Pure Copper Coil Wiring damaged at West Hub.',
    severity: 'Info',
    type: 'Adjustment',
    referenceId: 'ADJ-4004',
    timestamp: '3 hours ago',
    date: '2026-09-26 07:00',
    isRead: true,
    actionText: 'Review Adjustment'
  }
];
