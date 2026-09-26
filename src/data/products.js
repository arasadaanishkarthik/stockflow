export const initialProducts = [
  {
    id: 'PRD-001',
    sku: 'SKU-001',
    name: 'Industrial Steel Rods (10mm)',
    category: 'Raw Materials',
    unit: 'kg',
    costPrice: 4.50,
    sellingPrice: 7.20,
    minReorderPoint: 500,
    barcode: '890123450001',
    stockByWarehouse: {
      'WH-MAIN': 250,
      'WH-PROD': 120,
      'WH-SEC': 80,
      'WH-EAST': 0
    },
    totalStock: 450,
    status: 'Low Stock', // < minReorderPoint
    description: 'High-tensile carbon steel structural reinforcing rods for industrial frame fabrications.',
    lastUpdated: '2026-09-26 09:30'
  },
  {
    id: 'PRD-002',
    sku: 'SKU-002',
    name: 'Ergonomic Mesh Office Chair',
    category: 'Furniture',
    unit: 'units',
    costPrice: 85.00,
    sellingPrice: 169.00,
    minReorderPoint: 40,
    barcode: '890123450002',
    stockByWarehouse: {
      'WH-MAIN': 65,
      'WH-PROD': 5,
      'WH-SEC': 120,
      'WH-EAST': 40
    },
    totalStock: 230,
    status: 'In Stock',
    description: 'Breathable lumbar support chair with adjustable 3D armrests and multi-tilt lock mechanism.',
    lastUpdated: '2026-09-26 08:15'
  },
  {
    id: 'PRD-003',
    sku: 'SKU-003',
    name: 'Industrial Core Laptop i7',
    category: 'Electronics',
    unit: 'units',
    costPrice: 720.00,
    sellingPrice: 1150.00,
    minReorderPoint: 25,
    barcode: '890123450003',
    stockByWarehouse: {
      'WH-MAIN': 8,
      'WH-PROD': 0,
      'WH-SEC': 0,
      'WH-EAST': 0
    },
    totalStock: 8,
    status: 'Critical', // < 10
    description: 'Ruggedized shock-resistant laptop unit used for on-site warehouse diagnostics and PLC flashing.',
    lastUpdated: '2026-09-25 18:40'
  },
  {
    id: 'PRD-004',
    sku: 'SKU-004',
    name: 'Precision Microcontroller Board X1',
    category: 'Electronics',
    unit: 'units',
    costPrice: 14.20,
    sellingPrice: 28.50,
    minReorderPoint: 150,
    barcode: '890123450004',
    stockByWarehouse: {
      'WH-MAIN': 420,
      'WH-PROD': 350,
      'WH-SEC': 180,
      'WH-EAST': 90
    },
    totalStock: 1040,
    status: 'In Stock',
    description: 'ARM Cortex-M4 embedded processing board with dual CAN-bus and optical isolation.',
    lastUpdated: '2026-09-26 07:10'
  },
  {
    id: 'PRD-005',
    sku: 'SKU-005',
    name: 'Aluminum Alloy Sheets (4x8ft)',
    category: 'Raw Materials',
    unit: 'sheets',
    costPrice: 38.00,
    sellingPrice: 62.00,
    minReorderPoint: 100,
    barcode: '890123450005',
    stockByWarehouse: {
      'WH-MAIN': 310,
      'WH-PROD': 140,
      'WH-SEC': 95,
      'WH-EAST': 0
    },
    totalStock: 545,
    status: 'In Stock',
    description: 'Aircraft grade 6061-T6 aluminum sheet metal, corrosion-resistant anodized finish.',
    lastUpdated: '2026-09-24 14:20'
  },
  {
    id: 'PRD-006',
    sku: 'SKU-006',
    name: 'Thermal Shipping Barcode Labels',
    category: 'Office Supplies',
    unit: 'rolls',
    costPrice: 6.50,
    sellingPrice: 12.00,
    minReorderPoint: 80,
    barcode: '890123450006',
    stockByWarehouse: {
      'WH-MAIN': 28,
      'WH-PROD': 10,
      'WH-SEC': 15,
      'WH-EAST': 12
    },
    totalStock: 65,
    status: 'Low Stock',
    description: '4x6 inch direct thermal perforated labels (1,000 labels per roll) compatible with Zebra scanners.',
    lastUpdated: '2026-09-26 09:00'
  },
  {
    id: 'PRD-007',
    sku: 'SKU-007',
    name: 'Smart Conveyor Sensor Unit V2',
    category: 'Finished Goods',
    unit: 'units',
    costPrice: 110.00,
    sellingPrice: 245.00,
    minReorderPoint: 30,
    barcode: '890123450007',
    stockByWarehouse: {
      'WH-MAIN': 85,
      'WH-PROD': 40,
      'WH-SEC': 60,
      'WH-EAST': 25
    },
    totalStock: 210,
    status: 'In Stock',
    description: 'Photoelectric optical sensor with integrated edge AI for package sorting and speed metering.',
    lastUpdated: '2026-09-26 06:45'
  },
  {
    id: 'PRD-008',
    sku: 'SKU-008',
    name: 'Heavy-Duty Modular Workbench',
    category: 'Furniture',
    unit: 'units',
    costPrice: 210.00,
    sellingPrice: 380.00,
    minReorderPoint: 15,
    barcode: '890123450008',
    stockByWarehouse: {
      'WH-MAIN': 14,
      'WH-PROD': 8,
      'WH-SEC': 12,
      'WH-EAST': 6
    },
    totalStock: 40,
    status: 'In Stock',
    description: 'Reinforced steel frame workbench with electrostatic dissipative rubber top and power strip rail.',
    lastUpdated: '2026-09-23 11:15'
  },
  {
    id: 'PRD-009',
    sku: 'SKU-009',
    name: 'Aluminum Laptop Stand Pro',
    category: 'Office Supplies',
    unit: 'units',
    costPrice: 12.00,
    sellingPrice: 29.99,
    minReorderPoint: 50,
    barcode: '890123450009',
    stockByWarehouse: {
      'WH-MAIN': 0,
      'WH-PROD': 0,
      'WH-SEC': 0,
      'WH-EAST': 0
    },
    totalStock: 0,
    status: 'Out of Stock',
    description: 'Foldable ergonomic aluminum riser with silicone anti-slip pads and cable management routing.',
    lastUpdated: '2026-09-25 12:00'
  },
  {
    id: 'PRD-010',
    sku: 'SKU-010',
    name: 'Industrial IoT Gateway 5G',
    category: 'Finished Goods',
    unit: 'units',
    costPrice: 290.00,
    sellingPrice: 580.00,
    minReorderPoint: 20,
    barcode: '890123450010',
    stockByWarehouse: {
      'WH-MAIN': 32,
      'WH-PROD': 15,
      'WH-SEC': 24,
      'WH-EAST': 18
    },
    totalStock: 89,
    status: 'In Stock',
    description: 'DIN-rail mounted edge computing gateway with Modbus TCP, MQTT broker, and eSIM failover.',
    lastUpdated: '2026-09-26 08:50'
  },
  {
    id: 'PRD-011',
    sku: 'SKU-011',
    name: 'Pure Copper Coil Wiring (500m)',
    category: 'Raw Materials',
    unit: 'rolls',
    costPrice: 45.00,
    sellingPrice: 82.00,
    minReorderPoint: 60,
    barcode: '890123450011',
    stockByWarehouse: {
      'WH-MAIN': 18,
      'WH-PROD': 25,
      'WH-SEC': 10,
      'WH-EAST': 5
    },
    totalStock: 58,
    status: 'Low Stock',
    description: '99.9% OFC oxygen-free pure copper wire spool for transformer windings and motor armatures.',
    lastUpdated: '2026-09-26 09:12'
  },
  {
    id: 'PRD-012',
    sku: 'SKU-012',
    name: 'Lithium Iron Phosphate Battery 48V',
    category: 'Electronics',
    unit: 'units',
    costPrice: 420.00,
    sellingPrice: 790.00,
    minReorderPoint: 15,
    barcode: '890123450012',
    stockByWarehouse: {
      'WH-MAIN': 4,
      'WH-PROD': 2,
      'WH-SEC': 0,
      'WH-EAST': 1
    },
    totalStock: 7,
    status: 'Critical',
    description: '100Ah LiFePO4 battery pack with built-in BMS, rated for 6,000 deep discharge cycles.',
    lastUpdated: '2026-09-26 09:25'
  }
];
