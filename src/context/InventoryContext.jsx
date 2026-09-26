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

  // Helper: get warehouse name by code
  const getWarehouseName = (warehouseId) => {
    const found = warehouses.find(w => w.id === warehouseId || w.code === warehouseId);
    return found ? found.name : warehouseId;
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
    const newId = `REC-${1040 + receipts.length + 1}`;
    const totalAmount = (receiptData.items || []).reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitCost || 0)), 0);

    const newReceipt = {
      id: newId,
      receiptNumber: newId,
      supplier: receiptData.supplier || 'Apex Metallurgy Corp',
      supplierEmail: receiptData.supplierEmail || 'vendor@supply.com',
      warehouseId: receiptData.warehouseId || 'WH-MAIN',
      warehouseName: getWarehouseName(receiptData.warehouseId || 'WH-MAIN'),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      expectedDate: receiptData.expectedDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      status: receiptData.status || 'Draft',
      items: receiptData.items || [],
      totalAmount: totalAmount,
      notes: receiptData.notes || 'Inbound supplier replenishment purchase order.',
      receivedBy: receiptData.receivedBy || 'Anish (Procurement)'
    };

    setReceipts(prev => [newReceipt, ...prev]);

    toast.success('Receipt Created', `Receipt #${newReceipt.receiptNumber} generated.`);
    return newReceipt;
  };

  // 2. VALIDATE RECEIPT -> Increases Stock & Adds Ledger Entry
  const validateReceipt = (receiptId) => {
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) return;
    if (receipt.status === 'Done') {
      toast.warning('Already Validated', `Receipt #${receipt.receiptNumber} has already been marked as Done.`);
      return;
    }

    const whId = receipt.warehouseId;
    const whName = receipt.warehouseName;

    // 1. Update Product Stocks
    setProducts(prev => prev.map(prod => {
      const matchingItem = receipt.items.find(i => i.productId === prod.id || i.sku === prod.sku);
      if (matchingItem) {
        const addedQty = Number(matchingItem.qty);
        const currentWhStock = Number(prod.stockByWarehouse?.[whId] || 0);
        const newWhStock = currentWhStock + addedQty;
        const newStockByWarehouse = {
          ...prod.stockByWarehouse,
          [whId]: newWhStock
        };
        const newTotalStock = Object.values(newStockByWarehouse).reduce((a, b) => Number(a) + Number(b), 0);
        const newStatus = calculateStockStatus(newTotalStock, prod.minReorderPoint);

        return {
          ...prod,
          stockByWarehouse: newStockByWarehouse,
          totalStock: newTotalStock,
          status: newStatus,
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return prod;
    }));

    // 2. Update Receipt status to Done
    setReceipts(prev => prev.map(r => r.id === receiptId ? { ...r, status: 'Done' } : r));

    // 3. Create Ledger Entries for each received item
    const newLedgerEntries = receipt.items.map(item => ({
      id: `LED-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
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
    const newActivity = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      productName: firstItem?.productName || 'Multiple Products',
      operation: 'Received',
      type: 'receipt',
      quantity: `+${receipt.items.reduce((sum, i) => sum + Number(i.qty), 0)} units`,
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
      `Stock updated by +${receipt.items.reduce((sum, i) => sum + Number(i.qty), 0)} units in ${whName}.`
    );
  };

  // 3. ADD DELIVERY
  const addDelivery = (deliveryData) => {
    const newId = `DEL-${2080 + deliveries.length + 1}`;
    const totalAmount = (deliveryData.items || []).reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0);

    const newDelivery = {
      id: newId,
      deliveryId: newId,
      customer: deliveryData.customer || 'Apex Robotics International',
      customerEmail: deliveryData.customerEmail || 'orders@client.com',
      shippingAddress: deliveryData.shippingAddress || '100 Innovation Way, Suite 400',
      warehouseId: deliveryData.warehouseId || 'WH-MAIN',
      warehouseName: getWarehouseName(deliveryData.warehouseId || 'WH-MAIN'),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
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
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    if (delivery.status === 'Draft') {
      setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status: 'Picking' } : d));
      toast.info('Picking Commenced', `Delivery #${delivery.deliveryId} moved to Picking phase.`);
    } else if (delivery.status === 'Picking') {
      setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status: 'Packing' } : d));
      toast.info('Packing Started', `Delivery #${delivery.deliveryId} items packed and staged for courier.`);
    } else if (delivery.status === 'Packing' || delivery.status === 'Ready') {
      validateDelivery(deliveryId);
    }
  };

  const validateDelivery = (deliveryId) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    if (delivery.status === 'Done') {
      toast.warning('Already Dispatched', `Delivery #${delivery.deliveryId} has already been completed.`);
      return;
    }

    const whId = delivery.warehouseId;
    const whName = delivery.warehouseName;

    // 1. Update Product Stocks
    setProducts(prev => prev.map(prod => {
      const matchingItem = delivery.items.find(i => i.productId === prod.id || i.sku === prod.sku);
      if (matchingItem) {
        const reducedQty = Number(matchingItem.qty);
        const currentWhStock = Number(prod.stockByWarehouse?.[whId] || 0);
        const newWhStock = Math.max(0, currentWhStock - reducedQty);
        const newStockByWarehouse = {
          ...prod.stockByWarehouse,
          [whId]: newWhStock
        };
        const newTotalStock = Object.values(newStockByWarehouse).reduce((a, b) => Number(a) + Number(b), 0);
        const newStatus = calculateStockStatus(newTotalStock, prod.minReorderPoint);

        return {
          ...prod,
          stockByWarehouse: newStockByWarehouse,
          totalStock: newTotalStock,
          status: newStatus,
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return prod;
    }));

    // 2. Mark Delivery as Done
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status: 'Done' } : d));

    // 3. Create Ledger Entries
    const newLedgerEntries = delivery.items.map(item => ({
      id: `LED-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: item.productName,
      sku: item.sku,
      operation: 'Delivery',
      reference: delivery.deliveryId,
      from: whName,
      to: `${delivery.customer} (Customer)`,
      quantity: -Number(item.qty),
      unit: item.unit || 'units',
      user: 'Anish (Dispatched)',
      status: 'Completed'
    }));
    setLedger(prev => [...newLedgerEntries, ...prev]);

    // 4. Create Activity
    const firstItem = delivery.items[0];
    const totalDeliveredQty = delivery.items.reduce((sum, i) => sum + Number(i.qty), 0);
    const newActivity = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      productName: firstItem?.productName || 'Multiple Products',
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

    toast.success(
      '✓ Delivery Completed & Validated',
      `Stock reduced by ${totalDeliveredQty} units from ${whName}. Out for delivery.`
    );
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
    pendingReceiptsCount: receipts.filter(r => r.status === 'Waiting' || r.status === 'Ready' || r.status === 'Draft').length,
    pendingDeliveriesCount: deliveries.filter(d => d.status === 'Picking' || d.status === 'Packing' || d.status === 'Draft').length,
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
        getWarehouseName
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
