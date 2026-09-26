import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialProducts } from '../data/products';
import { initialWarehouses, initialCategories } from '../data/warehouses';
import { initialReceipts, mockSuppliers } from '../data/receipts';
import { initialDeliveries, mockCustomers } from '../data/deliveries';
import { initialTransfers } from '../data/transfers';
import { initialAdjustments } from '../data/adjustments';
import { initialLedger } from '../data/ledger';
import { initialAlerts } from '../data/alerts';
import { initialActivities } from '../data/activities';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';

const InventoryContext = createContext();

const STORAGE_KEYS = {
  PRODUCTS: 'stockflow_products',
  WAREHOUSES: 'stockflow_warehouses',
  RECEIPTS: 'stockflow_receipts',
  DELIVERIES: 'stockflow_deliveries',
  TRANSFERS: 'stockflow_transfers',
  ADJUSTMENTS: 'stockflow_adjustments',
  LEDGER: 'stockflow_ledger',
  ALERTS: 'stockflow_alerts',
  ACTIVITIES: 'stockflow_activities',
  SETTINGS: 'stockflow_settings'
};

const DEFAULT_SETTINGS = {
  companyName: 'StockFlow Logistics Global',
  defaultWarehouse: 'WH-MAIN',
  currency: 'USD ($)',
  timezone: 'America/Chicago (CST)',
  defaultUnit: 'units',
  autoReorder: true,
  lowStockThresholdPct: 20,
  emailAlerts: true,
  deliveryNotifications: true,
  receiptNotifications: true,
  dailySummaryReport: true
};

export const InventoryProvider = ({ children }) => {
  const toast = useToast();

  // 1. PRODUCTS STATE
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  // 2. WAREHOUSES STATE
  const [warehouses, setWarehouses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return saved ? JSON.parse(saved) : initialWarehouses;
  });

  // 3. RECEIPTS STATE
  const [receipts, setReceipts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    return saved ? JSON.parse(saved) : initialReceipts;
  });

  // 4. DELIVERIES STATE
  const [deliveries, setDeliveries] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    return saved ? JSON.parse(saved) : initialDeliveries;
  });

  // 5. TRANSFERS STATE
  const [transfers, setTransfers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    return saved ? JSON.parse(saved) : initialTransfers;
  });

  // 6. ADJUSTMENTS STATE
  const [adjustments, setAdjustments] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
    return saved ? JSON.parse(saved) : initialAdjustments;
  });

  // 7. LEDGER / MOVE HISTORY STATE
  const [ledger, setLedger] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
    return saved ? JSON.parse(saved) : initialLedger;
  });

  // 8. ALERTS STATE
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
    return saved ? JSON.parse(saved) : initialAlerts;
  });

  // 9. ACTIVITIES STATE
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return saved ? JSON.parse(saved) : initialActivities;
  });

  // 10. SETTINGS STATE
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses)); }, [warehouses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts)); }, [receipts]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries)); }, [deliveries]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers)); }, [transfers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments)); }, [adjustments]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledger)); }, [ledger]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts)); }, [alerts]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);

  // Helper: compute product stock status
  const calculateStockStatus = (totalStock, minReorderPoint) => {
    if (totalStock <= 0) return 'Out of Stock';
    if (totalStock < Math.min(10, minReorderPoint / 2)) return 'Critical';
    if (totalStock <= minReorderPoint) return 'Low Stock';
    return 'In Stock';
  };

  // Helper: get warehouse name by code or ID
  const getWarehouseName = (warehouseId) => {
    const found = warehouses.find(w => w.id === warehouseId || w.code === warehouseId || w.name === warehouseId);
    return found ? found.name : warehouseId;
  };

  // Helper: resolve warehouse code / ID safely
  const resolveWarehouseId = (whIdentifier) => {
    if (!whIdentifier) return 'WH-MAIN';
    const found = warehouses.find(w => 
      w.id?.toLowerCase() === whIdentifier.toLowerCase() || 
      w.code?.toLowerCase() === whIdentifier.toLowerCase() || 
      w.name?.toLowerCase() === whIdentifier.toLowerCase()
    );
    return found ? (found.id || found.code) : whIdentifier;
  };

  // -------------------------------------------------------------
  // OPERATIONS LOGIC
  // -------------------------------------------------------------

  // ADD NEW PRODUCT
  const addProduct = (productData) => {
    const newId = `PRD-${String(products.length + 1).padStart(3, '0')}`;
    const initialWarehouseStock = productData.stockByWarehouse || {
      'WH-MAIN': Number(productData.initialStock || 0),
      'WH-PROD': 0,
      'WH-SEC': 0,
      'WH-EAST': 0
    };

    const totalStock = Object.values(initialWarehouseStock).reduce((a, b) => Number(a) + Number(b), 0);
    const minReorder = Number(productData.minReorderPoint || 30);
    const status = calculateStockStatus(totalStock, minReorder);

    const newProduct = {
      id: newId,
      sku: productData.sku || `SKU-${String(products.length + 1).padStart(3, '0')}`,
      name: productData.name,
      category: productData.category || 'Raw Materials',
      unit: productData.unit || 'units',
      costPrice: Number(productData.costPrice || 10.0),
      sellingPrice: Number(productData.sellingPrice || 19.99),
      minReorderPoint: minReorder,
      barcode: productData.barcode || `890123450${String(products.length + 1).padStart(3, '0')}`,
      stockByWarehouse: initialWarehouseStock,
      totalStock: totalStock,
      status: status,
      description: productData.description || 'Standard product inventory catalog item.',
      lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setProducts(prev => [newProduct, ...prev]);

    // Ledger entry if initial stock > 0
    if (totalStock > 0) {
      const newLedgerEntry = {
        id: `LED-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        productName: newProduct.name,
        sku: newProduct.sku,
        operation: 'Initial Intake',
        reference: newProduct.sku,
        from: 'Direct Entry / System Setup',
        to: getWarehouseName(productData.warehouseId || 'WH-MAIN'),
        quantity: totalStock,
        unit: newProduct.unit,
        user: 'Anish (Admin)',
        status: 'Completed'
      };
      setLedger(prev => [newLedgerEntry, ...prev]);
    }

    toast.success(
      'Product Created Successfully',
      `"${newProduct.name}" added to inventory catalog with SKU ${newProduct.sku}.`
    );
    return newProduct;
  };

  // UPDATE PRODUCT
  const updateProduct = (id, updatedFields) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const stockByWh = updatedFields.stockByWarehouse || p.stockByWarehouse;
        const total = Object.values(stockByWh).reduce((a, b) => Number(a) + Number(b), 0);
        const minReorder = updatedFields.minReorderPoint !== undefined ? Number(updatedFields.minReorderPoint) : p.minReorderPoint;
        const status = calculateStockStatus(total, minReorder);

        return {
          ...p,
          ...updatedFields,
          stockByWarehouse: stockByWh,
          totalStock: total,
          status: status,
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return p;
    }));

    toast.info('Product Updated', `Product details updated in the catalog.`);
  };

  // DELETE PRODUCT
  const deleteProduct = (id) => {
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.warning('Product Deleted', `"${product?.name || id}" removed from inventory.`);
  };

  // 1. ADD RECEIPT
  const addReceipt = (receiptData) => {
    // Validation
    if (!receiptData.supplier || !receiptData.supplier.trim()) {
      toast.error('Validation Error', 'Supplier name is required.');
      return null;
    }

    if (!receiptData.warehouseId) {
      toast.error('Validation Error', 'Destination warehouse must be selected.');
      return null;
    }

    if (!receiptData.items || !Array.isArray(receiptData.items) || receiptData.items.length === 0) {
      toast.error('Validation Error', 'Receipt must contain at least one product item.');
      return null;
    }

    for (const item of receiptData.items) {
      if (!item.productId) {
        toast.error('Validation Error', 'A product must be selected for all line items.');
        return null;
      }
      if (!item.qty || Number(item.qty) <= 0 || isNaN(Number(item.qty))) {
        toast.error('Validation Error', `Quantity for "${item.productName || 'product'}" must be greater than 0.`);
        return null;
      }
    }

    // Auto-generate safe sequential receipt ID avoiding collisions
    let nextNum = 1045;
    receipts.forEach(r => {
      const match = (r.receiptNumber || r.id || '').match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val >= nextNum) nextNum = val;
      }
    });
    const generatedNumber = `REC-${nextNum + 1}`;
    const newId = receiptData.receiptNumber && receiptData.receiptNumber.trim() ? receiptData.receiptNumber.trim() : generatedNumber;

    // Check for duplicate receipt number
    if (receipts.some(r => r.receiptNumber?.toLowerCase() === newId.toLowerCase())) {
      toast.error('Validation Error', `Receipt #${newId} already exists. Please use a unique receipt number.`);
      return null;
    }

    const totalAmount = receiptData.items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitCost || 0)), 0);

    // Initial status must be one of Draft, Ready, Waiting (never initial Done to prevent premature stock increase)
    const initialStatus = ['Draft', 'Ready', 'Waiting'].includes(receiptData.status) ? receiptData.status : 'Waiting';

    const newReceipt = {
      id: newId,
      receiptNumber: newId,
      supplier: receiptData.supplier.trim(),
      supplierEmail: receiptData.supplierEmail || `${receiptData.supplier.toLowerCase().replace(/[^a-z0-9]/g, '')}@vendor.com`,
      warehouseId: receiptData.warehouseId,
      warehouseName: getWarehouseName(receiptData.warehouseId),
      date: receiptData.date || new Date().toISOString().slice(0, 16).replace('T', ' '),
      expectedDate: receiptData.expectedDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      status: initialStatus,
      items: receiptData.items.map(item => ({
        productId: item.productId,
        productName: item.productName || 'Inventory Product',
        sku: item.sku || 'SKU-000',
        qty: Number(item.qty),
        unit: item.unit || 'units',
        unitCost: Number(item.unitCost || 0)
      })),
      totalAmount: totalAmount,
      notes: receiptData.notes || 'Inbound supplier replenishment purchase order.',
      receivedBy: receiptData.receivedBy || 'Anish (Procurement)'
    };

    setReceipts(prev => [newReceipt, ...prev]);

    toast.success('Receipt Created', `Receipt #${newReceipt.receiptNumber} successfully created in ${newReceipt.status} status.`);
    return newReceipt;
  };

  // 2. VALIDATE RECEIPT -> Increases Stock & Adds Ledger Entry
  const validateReceipt = (receiptId) => {
    const receipt = receipts.find(r => r.id === receiptId || r.receiptNumber === receiptId);
    if (!receipt) {
      toast.error('Receipt Not Found', 'Could not locate the requested goods receipt.');
      return false;
    }

    // DUPLICATE VALIDATION GUARD: A receipt that is already Done must never increase stock again.
    if (receipt.status === 'Done') {
      toast.warning('Already Validated', `Receipt #${receipt.receiptNumber} has already been marked as Done. Stock was not modified.`);
      return false;
    }

    if (receipt.status === 'Canceled') {
      toast.error('Validation Denied', `Receipt #${receipt.receiptNumber} is canceled and cannot be validated.`);
      return false;
    }

    if (!receipt.items || receipt.items.length === 0) {
      toast.error('Validation Error', 'Receipt contains no items to receive.');
      return false;
    }

    const hasInvalidQty = receipt.items.some(i => !i.qty || Number(i.qty) <= 0);
    if (hasInvalidQty) {
      toast.error('Validation Error', 'All items in the receipt must have a positive quantity (> 0).');
      return false;
    }

    if (!receipt.warehouseId) {
      toast.error('Validation Error', 'Destination warehouse is missing from receipt.');
      return false;
    }

    const whId = resolveWarehouseId(receipt.warehouseId);
    const whName = receipt.warehouseName || getWarehouseName(whId);

    // 1. Update Product Stocks
    // EXACT INVENTORY RULE:
    // newStock = existingStock + receiptQuantity
    // For warehouse stock:
    // newWarehouseStock = existingWarehouseStock + receiptQuantity
    setProducts(prevProducts => prevProducts.map(prod => {
      const matchingItems = (receipt.items || []).filter(i => 
        (i.productId && prod.id && String(i.productId).toLowerCase() === String(prod.id).toLowerCase()) ||
        (i.sku && prod.sku && String(i.sku).toLowerCase() === String(prod.sku).toLowerCase()) ||
        (i.productName && prod.name && String(i.productName).trim().toLowerCase() === String(prod.name).trim().toLowerCase()) ||
        (i.name && prod.name && String(i.name).trim().toLowerCase() === String(prod.name).trim().toLowerCase())
      );

      if (matchingItems.length > 0) {
        const addedQty = matchingItems.reduce((sum, i) => sum + Number(i.qty || 0), 0);
        
        // Explicit: newStock = existingStock + receiptQuantity
        const existingStock = Number(prod.totalStock !== undefined ? prod.totalStock : 0);
        const newTotalStock = existingStock + addedQty;

        // Explicit: newWarehouseStock = existingWarehouseStock + receiptQuantity
        const currentStockByWh = prod.stockByWarehouse ? { ...prod.stockByWarehouse } : {};
        const whKey = Object.keys(currentStockByWh).find(k => k.toLowerCase() === whId.toLowerCase()) || whId;
        const existingWhStock = Number(currentStockByWh[whKey] !== undefined ? currentStockByWh[whKey] : 0);
        const newWhStock = existingWhStock + addedQty;
        currentStockByWh[whKey] = newWhStock;

        // Recalculate status based on newTotalStock
        const newStatus = calculateStockStatus(newTotalStock, prod.minReorderPoint);

        return {
          ...prod,
          stockByWarehouse: currentStockByWh,
          totalStock: newTotalStock,
          status: newStatus,
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return prod;
    }));

    // 1b. Clear any stock alerts if replenished above threshold
    (receipt.items || []).forEach(item => {
      const prod = products.find(p =>
        (item.productId && p.id && String(item.productId).toLowerCase() === String(p.id).toLowerCase()) ||
        (item.sku && p.sku && String(item.sku).toLowerCase() === String(p.sku).toLowerCase()) ||
        (item.productName && p.name && String(item.productName).trim().toLowerCase() === String(p.name).trim().toLowerCase())
      );
      if (prod) {
        const addedQty = Number(item.qty || 0);
        const newTotal = (Number(prod.totalStock) || 0) + addedQty;
        if (newTotal > Number(prod.minReorderPoint || 0)) {
          setAlerts(prev => prev.filter(a => !(a.productId === prod.id && a.type === 'Stock')));
        }
      }
    });

    // 2. Update Receipt status to Done
    setReceipts(prevReceipts => prevReceipts.map(r => 
      (r.id === receipt.id || r.receiptNumber === receipt.receiptNumber)
        ? { ...r, status: 'Done', validatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
        : r
    ));

    // 3. Create Ledger Entries for each received item
    const newLedgerEntries = receipt.items.map(item => ({
      id: `LED-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: item.productName,
      sku: item.sku,
      operation: 'Receipt',
      reference: receipt.receiptNumber,
      from: receipt.supplier,
      to: whName,
      quantity: Number(item.qty),
      unit: item.unit || 'units',
      user: 'Anish (Validated)',
      status: 'Completed'
    }));
    setLedger(prev => [...newLedgerEntries, ...prev]);

    // 4. Create Recent Activity
    const firstItem = receipt.items[0];
    const totalUnitsReceived = receipt.items.reduce((sum, i) => sum + Number(i.qty || 0), 0);
    const newActivity = {
      id: `ACT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 1000)}`,
      productName: receipt.items.length === 1 ? firstItem?.productName : `${firstItem?.productName} +${receipt.items.length - 1} more`,
      operation: 'Received',
      type: 'receipt',
      quantity: `+${totalUnitsReceived} units`,
      location: whName,
      timestamp: 'Just now',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'Anish',
      status: 'success'
    };
    setActivities(prev => [newActivity, ...prev]);

    // 5. Fire confetti & celebration
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (e) {
      // safe fallback
    }

    toast.success(
      '✓ Receipt Validated Successfully',
      `Stock updated by +${totalUnitsReceived} units in ${whName}.`
    );

    return true;
  };

  // 3. ADD DELIVERY
  const addDelivery = (deliveryData) => {
    // Validation
    if (!deliveryData.customer || !deliveryData.customer.trim()) {
      toast.error('Validation Error', 'Customer name is required.');
      return null;
    }

    if (!deliveryData.warehouseId) {
      toast.error('Validation Error', 'Source dispatch warehouse must be selected.');
      return null;
    }

    if (!deliveryData.items || !Array.isArray(deliveryData.items) || deliveryData.items.length === 0) {
      toast.error('Validation Error', 'Delivery order must contain at least one item.');
      return null;
    }

    const whId = resolveWarehouseId(deliveryData.warehouseId);
    const whName = deliveryData.warehouseName || getWarehouseName(whId);

    // Validate each item
    for (const item of deliveryData.items) {
      if (!item.productId && !item.sku && !item.productName) {
        toast.error('Validation Error', 'Product information is required for all items.');
        return null;
      }
      if (!item.qty || Number(item.qty) <= 0 || isNaN(Number(item.qty))) {
        toast.error('Validation Error', 'Item quantity must be a positive number (> 0).');
        return null;
      }
    }

    // Check available warehouse stock for all items
    const qtyByProduct = {};
    for (const item of deliveryData.items) {
      const prod = products.find(p =>
        (item.productId && p.id && String(item.productId).toLowerCase() === String(p.id).toLowerCase()) ||
        (item.sku && p.sku && String(item.sku).toLowerCase() === String(p.sku).toLowerCase()) ||
        (item.productName && p.name && String(item.productName).trim().toLowerCase() === String(p.name).trim().toLowerCase()) ||
        (item.name && p.name && String(item.name).trim().toLowerCase() === String(p.name).trim().toLowerCase())
      );

      if (!prod) {
        toast.error('Validation Error', `Product "${item.productName || item.sku || item.productId}" not found in inventory.`);
        return null;
      }

      qtyByProduct[prod.id] = (qtyByProduct[prod.id] || 0) + Number(item.qty);
    }

    for (const [prodId, reqQty] of Object.entries(qtyByProduct)) {
      const prod = products.find(p => p.id === prodId);
      const currentStockByWh = prod.stockByWarehouse || {};
      const whKey = Object.keys(currentStockByWh).find(k => k.toLowerCase() === whId.toLowerCase()) || whId;
      const availableWhStock = Number(currentStockByWh[whKey] !== undefined ? currentStockByWh[whKey] : 0);

      if (reqQty > availableWhStock) {
        toast.error(
          'Insufficient Stock',
          `Cannot create delivery: "${prod.name}" has only ${availableWhStock} ${prod.unit || 'units'} available in ${whName}, but ${reqQty} requested.`
        );
        return null;
      }
    }

    const newId = `DEL-${2080 + deliveries.length + 1}`;
    const totalAmount = (deliveryData.items || []).reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0);

    const newDelivery = {
      id: newId,
      deliveryId: newId,
      customer: deliveryData.customer,
      customerEmail: deliveryData.customerEmail || 'orders@client.com',
      shippingAddress: deliveryData.shippingAddress || '100 Innovation Way, Suite 400',
      warehouseId: whId,
      warehouseName: whName,
      date: deliveryData.date || new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: deliveryData.status || 'Draft',
      priority: deliveryData.priority || 'Normal',
      items: deliveryData.items || [],
      totalAmount: totalAmount,
      trackingNumber: deliveryData.trackingNumber || `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      carrier: deliveryData.carrier || 'FedEx Priority Freight',
      notes: deliveryData.notes || 'Outbound commercial shipment order.',
      dispatchedBy: 'Anish (Operations)'
    };

    setDeliveries(prev => [newDelivery, ...prev]);
    toast.success('Delivery Order Created', `Order #${newDelivery.deliveryId} created for ${newDelivery.customer}.`);
    return newDelivery;
  };

  // 4. ADVANCE / VALIDATE DELIVERY -> Decreases Stock & Adds Ledger Entry
  const advanceDeliveryStatus = (deliveryId) => {
    const delivery = deliveries.find(d => d.id === deliveryId || d.deliveryId === deliveryId);
    if (!delivery) return;

    if (delivery.status === 'Draft') {
      setDeliveries(prev => prev.map(d => (d.id === deliveryId || d.deliveryId === deliveryId) ? { ...d, status: 'Picking' } : d));
      toast.info('Picking Commenced', `Delivery #${delivery.deliveryId} moved to Picking phase.`);
    } else if (delivery.status === 'Picking') {
      setDeliveries(prev => prev.map(d => (d.id === deliveryId || d.deliveryId === deliveryId) ? { ...d, status: 'Packing' } : d));
      toast.info('Packing Started', `Delivery #${delivery.deliveryId} items packed and staged for courier.`);
    } else if (delivery.status === 'Packing') {
      setDeliveries(prev => prev.map(d => (d.id === deliveryId || d.deliveryId === deliveryId) ? { ...d, status: 'Ready' } : d));
      toast.info('Ready for Dispatch', `Delivery #${delivery.deliveryId} is ready for validation & dispatch.`);
    }
  };

  const validateDelivery = (deliveryId) => {
    const delivery = deliveries.find(d => d.id === deliveryId || d.deliveryId === deliveryId);
    if (!delivery) {
      toast.error('Not Found', 'Delivery order not found.');
      return false;
    }

    // 1. Prevent duplicate validation
    if (delivery.status === 'Done') {
      toast.warning('Already Dispatched', `Delivery #${delivery.deliveryId} has already been completed.`);
      return false;
    }

    if (delivery.status === 'Canceled' || delivery.status === 'Cancelled') {
      toast.error('Validation Denied', `Delivery #${delivery.deliveryId} is canceled and cannot be validated.`);
      return false;
    }

    // 2. Validate items
    if (!delivery.items || !Array.isArray(delivery.items) || delivery.items.length === 0) {
      toast.error('Validation Error', 'Delivery order contains no items.');
      return false;
    }

    const hasInvalidQty = delivery.items.some(i => !i.qty || Number(i.qty) <= 0 || isNaN(Number(i.qty)));
    if (hasInvalidQty) {
      toast.error('Validation Error', 'All items in delivery must have a positive quantity (> 0).');
      return false;
    }

    if (!delivery.warehouseId) {
      toast.error('Validation Error', 'Source warehouse is missing from delivery order.');
      return false;
    }

    const whId = resolveWarehouseId(delivery.warehouseId);
    const whName = delivery.warehouseName || getWarehouseName(whId);

    // 3. Check stock against SELECTED warehouse for ALL items BEFORE making any changes!
    const qtyByProduct = {};
    for (const item of delivery.items) {
      const prod = products.find(p =>
        (item.productId && p.id && String(item.productId).toLowerCase() === String(p.id).toLowerCase()) ||
        (item.sku && p.sku && String(item.sku).toLowerCase() === String(p.sku).toLowerCase()) ||
        (item.productName && p.name && String(item.productName).trim().toLowerCase() === String(p.name).trim().toLowerCase()) ||
        (item.name && p.name && String(item.name).trim().toLowerCase() === String(p.name).trim().toLowerCase())
      );

      if (!prod) {
        toast.error('Validation Error', `Product "${item.productName || item.sku || item.productId}" not found in inventory.`);
        return false;
      }

      qtyByProduct[prod.id] = (qtyByProduct[prod.id] || 0) + Number(item.qty);
    }

    for (const [prodId, totalReqQty] of Object.entries(qtyByProduct)) {
      const prod = products.find(p => p.id === prodId);
      const currentStockByWh = prod.stockByWarehouse || {};
      const whKey = Object.keys(currentStockByWh).find(k => k.toLowerCase() === whId.toLowerCase()) || whId;
      const availableWhStock = Number(currentStockByWh[whKey] !== undefined ? currentStockByWh[whKey] : 0);

      if (totalReqQty > availableWhStock) {
        toast.error(
          'Insufficient Stock',
          `Cannot validate delivery: "${prod.name}" has only ${availableWhStock} ${prod.unit || 'units'} available in ${whName}, but ${totalReqQty} requested.`
        );
        return false;
      }
    }

    // 4. Update Product Stocks
    // EXACT INVENTORY RULE:
    // newStock = existingStock - deliveryQuantity
    // newWarehouseStock = existingWarehouseStock - deliveryQuantity
    setProducts(prevProducts => prevProducts.map(prod => {
      const matchingItems = (delivery.items || []).filter(i =>
        (i.productId && prod.id && String(i.productId).toLowerCase() === String(prod.id).toLowerCase()) ||
        (i.sku && prod.sku && String(i.sku).toLowerCase() === String(prod.sku).toLowerCase()) ||
        (i.productName && prod.name && String(i.productName).trim().toLowerCase() === String(prod.name).trim().toLowerCase()) ||
        (i.name && prod.name && String(i.name).trim().toLowerCase() === String(prod.name).trim().toLowerCase())
      );

      if (matchingItems.length > 0) {
        const reducedQty = matchingItems.reduce((sum, i) => sum + Number(i.qty || 0), 0);
        
        // Exact: newStock = existingStock - deliveryQuantity
        const existingStock = Number(prod.totalStock !== undefined ? prod.totalStock : 0);
        const newTotalStock = Math.max(0, existingStock - reducedQty);

        // Exact: newWarehouseStock = existingWarehouseStock - deliveryQuantity
        const currentStockByWh = prod.stockByWarehouse ? { ...prod.stockByWarehouse } : {};
        const whKey = Object.keys(currentStockByWh).find(k => k.toLowerCase() === whId.toLowerCase()) || whId;
        const existingWhStock = Number(currentStockByWh[whKey] !== undefined ? currentStockByWh[whKey] : 0);
        const newWhStock = Math.max(0, existingWhStock - reducedQty);
        currentStockByWh[whKey] = newWhStock;

        // Recalculate status based on newTotalStock
        const newStatus = calculateStockStatus(newTotalStock, prod.minReorderPoint);

        return {
          ...prod,
          stockByWarehouse: currentStockByWh,
          totalStock: newTotalStock,
          status: newStatus,
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return prod;
    }));

    // 4b. Update alerts if stock falls below reorder point or reaches zero
    (delivery.items || []).forEach(item => {
      const prod = products.find(p =>
        (item.productId && p.id && String(item.productId).toLowerCase() === String(p.id).toLowerCase()) ||
        (item.sku && p.sku && String(item.sku).toLowerCase() === String(p.sku).toLowerCase()) ||
        (item.productName && p.name && String(item.productName).trim().toLowerCase() === String(p.name).trim().toLowerCase())
      );
      if (prod) {
        const reducedQty = Number(item.qty || 0);
        const newTotal = Math.max(0, (Number(prod.totalStock) || 0) - reducedQty);
        if (newTotal <= 0) {
          setAlerts(prev => [
            {
              id: `ALT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
              title: `Out of Stock: ${prod.name}`,
              message: `Current stock reached 0 ${prod.unit || 'units'} across all facilities.`,
              severity: 'Critical',
              type: 'Stock',
              productId: prod.id,
              timestamp: 'Just now',
              date: new Date().toISOString().slice(0, 16).replace('T', ' '),
              isRead: false,
              actionText: 'Create Receipt PO'
            },
            ...prev.filter(a => !(a.productId === prod.id && a.type === 'Stock'))
          ]);
        } else if (newTotal <= Number(prod.minReorderPoint || 0)) {
          setAlerts(prev => [
            {
              id: `ALT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
              title: `Low Stock: ${prod.name}`,
              message: `Total stock (${newTotal} ${prod.unit || 'units'}) has fallen below minimum reorder point (${prod.minReorderPoint} ${prod.unit || 'units'}).`,
              severity: 'Warning',
              type: 'Stock',
              productId: prod.id,
              timestamp: 'Just now',
              date: new Date().toISOString().slice(0, 16).replace('T', ' '),
              isRead: false,
              actionText: 'Review Replenishment'
            },
            ...prev.filter(a => !(a.productId === prod.id && a.type === 'Stock'))
          ]);
        }
      }
    });

    // 5. Mark Delivery as Done
    setDeliveries(prev => prev.map(d =>
      (d.id === delivery.id || d.deliveryId === delivery.deliveryId)
        ? { ...d, status: 'Done', validatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
        : d
    ));

    // 6. Create Ledger Entries
    const newLedgerEntries = delivery.items.map(item => ({
      id: `LED-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: item.productName,
      sku: item.sku,
      operation: 'Delivery',
      reference: delivery.deliveryId || delivery.id,
      from: whName,
      to: `${delivery.customer} (Customer)`,
      quantity: -Number(item.qty),
      unit: item.unit || 'units',
      user: 'Anish (Dispatched)',
      status: 'Completed'
    }));
    setLedger(prev => [...newLedgerEntries, ...prev]);

    // 7. Create Activity
    const firstItem = delivery.items[0];
    const totalDeliveredQty = delivery.items.reduce((sum, i) => sum + Number(i.qty || 0), 0);
    const newActivity = {
      id: `ACT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 1000)}`,
      productName: delivery.items.length === 1 ? firstItem?.productName : `${firstItem?.productName} +${delivery.items.length - 1} more`,
      operation: 'Delivered',
      type: 'delivery',
      quantity: `-${totalDeliveredQty} units`,
      location: whName,
      timestamp: 'Just now',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'Anish',
      status: 'warning'
    };
    setActivities(prev => [newActivity, ...prev]);

    // 8. Fire confetti
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (e) {
      // safe fallback
    }

    toast.success(
      '✓ Delivery Completed & Validated',
      `Stock reduced by ${totalDeliveredQty} units from ${whName}. Out for delivery.`
    );

    return true;
  };

  // 5. INTERNAL TRANSFER -> Source Warehouse - Qty, Destination Warehouse + Qty, Total Stock UNCHANGED!
  const createTransfer = (transferData) => {
    const newId = `TRF-${3010 + transfers.length + 1}`;
    const qty = Number(transferData.qty || 1);
    const prod = products.find(p => p.id === transferData.productId || p.sku === transferData.sku);
    const fromWhId = transferData.fromWarehouseId || 'WH-MAIN';
    const toWhId = transferData.toWarehouseId || 'WH-PROD';

    if (fromWhId === toWhId) {
      toast.error('Invalid Transfer', 'Source and destination warehouses cannot be the same location.');
      return null;
    }

    const fromWhName = getWarehouseName(fromWhId);
    const toWhName = getWarehouseName(toWhId);

    // Update product stock distribution across warehouses
    if (prod) {
      setProducts(prev => prev.map(p => {
        if (p.id === prod.id) {
          const currentFromStock = Number(p.stockByWarehouse?.[fromWhId] || 0);
          const currentToStock = Number(p.stockByWarehouse?.[toWhId] || 0);

          const newStockByWarehouse = {
            ...p.stockByWarehouse,
            [fromWhId]: Math.max(0, currentFromStock - qty),
            [toWhId]: currentToStock + qty
          };
          // Total stock remains the same!
          return {
            ...p,
            stockByWarehouse: newStockByWarehouse,
            lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
          };
        }
        return p;
      }));
    }

    const newTransfer = {
      id: newId,
      transferNumber: newId,
      productId: prod?.id || transferData.productId,
      productName: prod?.name || transferData.productName || 'Industrial Inventory Item',
      sku: prod?.sku || transferData.sku || 'SKU-TRF',
      qty: qty,
      unit: prod?.unit || transferData.unit || 'units',
      fromWarehouseId: fromWhId,
      fromWarehouseName: fromWhName,
      toWarehouseId: toWhId,
      toWarehouseName: toWhName,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: transferData.status || 'Completed',
      carrier: transferData.carrier || 'Internal Shuttle Logistics',
      initiatedBy: 'Anish (Supervisor)',
      notes: transferData.notes || 'Internal stock relocation and replenishment.'
    };

    setTransfers(prev => [newTransfer, ...prev]);

    // Ledger Entry
    const newLedgerEntry = {
      id: `LED-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: newTransfer.productName,
      sku: newTransfer.sku,
      operation: 'Internal Transfer',
      reference: newTransfer.transferNumber,
      from: fromWhName,
      to: toWhName,
      quantity: qty,
      unit: newTransfer.unit,
      user: 'Anish',
      status: 'Completed'
    };
    setLedger(prev => [newLedgerEntry, ...prev]);

    // Activity Entry
    const newActivity = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      productName: newTransfer.productName,
      operation: 'Transferred',
      type: 'transfer',
      quantity: `${qty} ${newTransfer.unit}`,
      location: `${fromWhName} → ${toWhName}`,
      timestamp: 'Just now',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'Anish',
      status: 'info'
    };
    setActivities(prev => [newActivity, ...prev]);

    toast.success(
      '✓ Internal Transfer Executed',
      `${qty} ${newTransfer.unit} moved from ${fromWhName} to ${toWhName}. Total inventory unchanged.`
    );
    return newTransfer;
  };

  // 6. INVENTORY ADJUSTMENT -> System Qty vs Physical Qty
  const applyAdjustment = (adjustmentData) => {
    const newId = `ADJ-${4000 + adjustments.length + 1}`;
    const prod = products.find(p => p.id === adjustmentData.productId || p.sku === adjustmentData.sku);
    const whId = adjustmentData.warehouseId || 'WH-MAIN';
    const whName = getWarehouseName(whId);

    const systemQty = Number(adjustmentData.systemQty !== undefined ? adjustmentData.systemQty : (prod?.stockByWarehouse?.[whId] || 0));
    const physicalQty = Number(adjustmentData.physicalQty || 0);
    const difference = physicalQty - systemQty;

    // Update Product Stock to match Physical Qty in that warehouse
    if (prod) {
      setProducts(prev => prev.map(p => {
        if (p.id === prod.id) {
          const newStockByWarehouse = {
            ...p.stockByWarehouse,
            [whId]: physicalQty
          };
          const newTotal = Object.values(newStockByWarehouse).reduce((a, b) => Number(a) + Number(b), 0);
          const newStatus = calculateStockStatus(newTotal, p.minReorderPoint);

          return {
            ...p,
            stockByWarehouse: newStockByWarehouse,
            totalStock: newTotal,
            status: newStatus,
            lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
          };
        }
        return p;
      }));
    }

    const newAdjustment = {
      id: newId,
      adjustmentNumber: newId,
      productId: prod?.id || adjustmentData.productId,
      productName: prod?.name || adjustmentData.productName || 'Inventory Item',
      sku: prod?.sku || adjustmentData.sku || 'SKU-ADJ',
      warehouseId: whId,
      warehouseName: whName,
      systemQty: systemQty,
      physicalQty: physicalQty,
      difference: difference,
      unit: prod?.unit || adjustmentData.unit || 'units',
      reason: adjustmentData.reason || 'Cycle Count Variance',
      status: 'Applied',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      auditor: 'Anish (Auditor)',
      notes: adjustmentData.notes || 'Audited physical count adjustment.'
    };

    setAdjustments(prev => [newAdjustment, ...prev]);

    // Ledger Entry
    const newLedgerEntry = {
      id: `LED-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: newAdjustment.productName,
      sku: newAdjustment.sku,
      operation: 'Adjustment',
      reference: newAdjustment.adjustmentNumber,
      from: whName,
      to: `${newAdjustment.reason} (${difference > 0 ? '+' : ''}${difference} ${newAdjustment.unit})`,
      quantity: difference,
      unit: newAdjustment.unit,
      user: 'Anish (Auditor)',
      status: 'Completed'
    };
    setLedger(prev => [newLedgerEntry, ...prev]);

    // Activity Entry
    const newActivity = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      productName: newAdjustment.productName,
      operation: 'Adjusted',
      type: 'adjustment',
      quantity: `${difference > 0 ? '+' : ''}${difference} ${newAdjustment.unit}`,
      location: whName,
      timestamp: 'Just now',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'Anish',
      status: difference >= 0 ? 'success' : 'neutral'
    };
    setActivities(prev => [newActivity, ...prev]);

    toast.info(
      '✓ Inventory Adjustment Applied',
      `Physical count of ${physicalQty} recorded for ${newAdjustment.productName} (${difference > 0 ? '+' : ''}${difference} ${newAdjustment.unit}).`
    );
    return newAdjustment;
  };

  // 7. WAREHOUSE MANAGEMENT
  const addWarehouse = (whData) => {
    const newId = `WH-${(whData.code || 'LOC').toUpperCase()}`;
    const newWarehouse = {
      id: newId,
      code: whData.code?.toUpperCase() || newId,
      name: whData.name,
      city: whData.city || 'Chicago, IL',
      address: whData.address || 'Logistics Park Blvd',
      manager: whData.manager || 'Anish',
      capacity: Number(whData.capacity || 10000),
      currentUtilization: Number(whData.currentUtilization || 0),
      status: 'Active',
      zones: whData.zones || ['Standard Storage Bay 1', 'Dock Area'],
      temperature: whData.temperature || 'Ambient (68°F)',
      type: whData.type || 'Regional Hub'
    };

    setWarehouses(prev => [...prev, newWarehouse]);
    toast.success('Warehouse Added', `"${newWarehouse.name}" added to facilities network.`);
    return newWarehouse;
  };

  // 8. ALERTS MANAGEMENT
  const markAlertAsRead = (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const markAllAlertsAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    toast.info('Alerts Cleared', 'All inventory alerts marked as read.');
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // 9. SETTINGS
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    toast.success('Settings Saved', 'Application preferences updated successfully.');
  };

  // 10. RESET ALL MOCK DATA TO DEFAULT
  const resetToDefaults = () => {
    setProducts(initialProducts);
    setWarehouses(initialWarehouses);
    setReceipts(initialReceipts);
    setDeliveries(initialDeliveries);
    setTransfers(initialTransfers);
    setAdjustments(initialAdjustments);
    setLedger(initialLedger);
    setAlerts(initialAlerts);
    setActivities(initialActivities);
    setSettings(DEFAULT_SETTINGS);
    localStorage.clear();
    toast.info('Factory Reset', 'Mock data has been restored to default initial state.');
  };

  // CALCULATE DASHBOARD METRICS IN REAL-TIME
  const kpiMetrics = {
    totalProductsInStock: products.reduce((acc, p) => acc + (p.totalStock > 0 ? 1 : 0), 0),
    totalUnitsInStock: products.reduce((acc, p) => acc + Number(p.totalStock || 0), 0),
    lowStockCount: products.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length,
    outOfStockCount: products.filter(p => p.status === 'Out of Stock' || p.totalStock <= 0).length,
    pendingReceiptsCount: receipts.filter(r => ['Draft', 'Waiting', 'Ready'].includes(r.status)).length,
    pendingDeliveriesCount: deliveries.filter(d => ['Draft', 'Picking', 'Packing', 'Ready'].includes(d.status)).length,
    internalTransfersCount: transfers.length,
    unreadAlertsCount: alerts.filter(a => !a.isRead).length
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        warehouses,
        categories: initialCategories,
        suppliers: mockSuppliers,
        customers: mockCustomers,
        receipts,
        deliveries,
        transfers,
        adjustments,
        ledger,
        alerts,
        activities,
        settings,
        kpiMetrics,
        // Methods
        addProduct,
        updateProduct,
        deleteProduct,
        addReceipt,
        validateReceipt,
        addDelivery,
        advanceDeliveryStatus,
        validateDelivery,
        createTransfer,
        applyAdjustment,
        addWarehouse,
        markAlertAsRead,
        markAllAlertsAsRead,
        dismissAlert,
        updateSettings,
        resetToDefaults,
        getWarehouseName,
        resolveWarehouseId
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
