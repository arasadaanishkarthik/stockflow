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

// Unique ID generator that doesn't depend on array length (avoids collision on delete)
const makeId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

// Helper: compute product stock status from single source of truth
export const calculateStockStatus = (totalStock, minReorderPoint) => {
  const stock = Number(totalStock ?? 0);
  const reorder = Number(minReorderPoint ?? 0);
  if (stock <= 0) return 'Out of Stock';
  if (stock < Math.min(10, reorder / 2)) return 'Critical';
  if (stock <= reorder) return 'Low Stock';
  return 'In Stock';
};

export const InventoryProvider = ({ children }) => {
  const toast = useToast();

  // 1. PRODUCTS STATE
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const list = saved ? JSON.parse(saved) : initialProducts;
    return list.map(p => ({
      ...p,
      status: calculateStockStatus(p.totalStock, p.minReorderPoint)
    }));
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

  // Helper: get warehouse name by code or ID
  const getWarehouseName = (warehouseId) => {
    // Use a functional lookup to always get the latest warehouses (avoid stale closure)
    const found = warehouses.find(w => w.id === warehouseId || w.code === warehouseId);
    return found ? found.name : warehouseId;
  };

  // Helper: build a zeroed stockByWarehouse map for all current warehouses
  const buildEmptyStockMap = (currentWarehouses) => {
    return currentWarehouses.reduce((acc, wh) => {
      acc[wh.id] = 0;
      return acc;
    }, {});
  };

  // Helper: add activity entry
  const addActivity = (activityData) => {
    const newActivity = {
      id: `ACT-${Date.now().toString().slice(-6)}`,
      timestamp: 'Just now',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'Anish',
      ...activityData
    };
    setActivities(prev => [newActivity, ...prev]);
    return newActivity;
  };

  // DYNAMIC LOW-STOCK & OUT-OF-STOCK ALERT SYNCHRONIZATION
  // Automatically keeps alerts in sync with actual inventory levels
  useEffect(() => {
    setAlerts(prevAlerts => {
      // 1. Preserve non-stock alerts (Receipt, Delivery, Adjustment, Info)
      const nonStockAlerts = prevAlerts.filter(a => a.type !== 'Stock');

      // 2. Derive stock alerts for all products at or below minReorderPoint
      const stockAlerts = [];

      products.forEach(p => {
        const stock = Number(p.totalStock ?? 0);
        const reorder = Number(p.minReorderPoint ?? 0);

        // If stock > reorder threshold, no alert is needed (automatically cleared if restocked)
        if (stock > reorder) return;

        // Check if an existing stock alert exists to preserve read status and id
        const existing = prevAlerts.find(
          a => a.type === 'Stock' && (a.productId === p.id || a.sku === p.sku)
        );

        let severity = 'Warning';
        let title = `Low Stock: ${p.name}`;
        if (stock <= 0) {
          severity = 'Critical';
          title = `Out of Stock: ${p.name}`;
        } else if (stock < Math.min(10, reorder / 2)) {
          severity = 'Critical';
          title = `Critical Stock: ${p.name}`;
        }

        const message = stock <= 0
          ? `${p.name} has 0 ${p.unit || 'units'} remaining across all warehouses. Reorder threshold is ${reorder} ${p.unit || 'units'}.`
          : `${p.name} has ${stock} ${p.unit || 'units'} remaining. Reorder point: ${reorder} ${p.unit || 'units'}.`;

        const whLocations = Object.entries(p.stockByWarehouse || {})
          .filter(([_, qty]) => Number(qty) > 0)
          .map(([whId, qty]) => `${getWarehouseName(whId)}: ${qty}`)
          .join(', ');

        stockAlerts.push({
          id: existing?.id || `ALT-STK-${p.id}`,
          title,
          message,
          severity,
          type: 'Stock',
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          currentStock: stock,
          reorderPoint: reorder,
          unit: p.unit || 'units',
          locations: whLocations || 'All facilities depleted',
          timestamp: existing?.timestamp || 'Just now',
          date: existing?.date || new Date().toISOString().slice(0, 16).replace('T', ' '),
          isRead: existing && existing.severity === severity ? existing.isRead : false,
          actionText: 'View Product'
        });
      });

      // Avoid unnecessary state re-renders if alert list is unchanged
      const currentStockAlerts = prevAlerts.filter(a => a.type === 'Stock');
      const isIdentical =
        currentStockAlerts.length === stockAlerts.length &&
        stockAlerts.every(sa => {
          const cur = currentStockAlerts.find(c => c.productId === sa.productId);
          return (
            cur &&
            cur.severity === sa.severity &&
            cur.currentStock === sa.currentStock &&
            cur.title === sa.title &&
            cur.message === sa.message &&
            cur.isRead === sa.isRead
          );
        });

      if (isIdentical) {
        return prevAlerts;
      }

      return [...stockAlerts, ...nonStockAlerts];
    });
  }, [products]);

  // -------------------------------------------------------------
  // PRODUCT MANAGEMENT
  // -------------------------------------------------------------

  // ADD NEW PRODUCT
  // stockByWarehouse: optional map { [whId]: qty }. If omitted, uses initialStock in warehouseId.
  const addProduct = (productData) => {
    const newId = `PRD-${makeId('P')}`;

    // Build stockByWarehouse — start with zeros for all current warehouses,
    // then apply provided values.
    const baseStockMap = buildEmptyStockMap(warehouses);

    let initialWarehouseStock;
    if (productData.stockByWarehouse) {
      // Merge provided values into base map (ignores warehouses not in system)
      initialWarehouseStock = { ...baseStockMap, ...productData.stockByWarehouse };
    } else {
      // Place initialStock in the selected warehouse
      initialWarehouseStock = {
        ...baseStockMap,
        [productData.warehouseId || 'WH-MAIN']: Number(productData.initialStock || 0)
      };
    }

    const totalStock = Object.values(initialWarehouseStock).reduce((a, b) => Number(a) + Number(b), 0);
    const minReorder = Number(productData.minReorderPoint || 30);
    const status = calculateStockStatus(totalStock, minReorder);

    const newProduct = {
      id: newId,
      sku: productData.sku || `SKU-${makeId('S')}`,
      name: productData.name,
      category: productData.category || 'Raw Materials',
      unit: productData.unit || 'units',
      costPrice: Number(productData.costPrice || 10.0),
      sellingPrice: Number(productData.sellingPrice || 19.99),
      minReorderPoint: minReorder,
      barcode: productData.barcode || `890123450${Date.now().toString().slice(-3)}`,
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
        id: `LED-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        productName: newProduct.name,
        sku: newProduct.sku,
        operation: 'Initial Intake',
        reference: newProduct.sku,
        from: 'Direct Entry / System Setup',
        to: getWarehouseName(productData.warehouseId || 'WH-MAIN'),
        warehouse: getWarehouseName(productData.warehouseId || 'WH-MAIN'),
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

  // BATCH CSV IMPORT PRODUCTS
  const importProductsBatch = (newProductsList, defaultWh = 'WH-MAIN') => {
    if (!newProductsList || newProductsList.length === 0) return 0;

    const baseStockMap = buildEmptyStockMap(warehouses);

    const formattedProducts = newProductsList.map((item, idx) => {
      const newId = `PRD-${makeId('P')}-${idx}`;
      const whCode = item.warehouseId || item.warehouse || defaultWh;
      const initialStockQty = Number(item.totalStock !== undefined ? item.totalStock : (item.initialStock || item.stock || 0));

      const stockMap = {
        ...baseStockMap,
        [whCode]: initialStockQty
      };

      const totalStock = Object.values(stockMap).reduce((a, b) => Number(a) + Number(b), 0);
      const minReorder = Number(item.minReorderPoint || item.reorderLevel || 30);
      const status = calculateStockStatus(totalStock, minReorder);

      return {
        id: newId,
        sku: String(item.sku).trim().toUpperCase(),
        name: String(item.name).trim(),
        category: item.category || 'Raw Materials',
        unit: item.unit || 'units',
        costPrice: Number(item.costPrice || 10.0),
        sellingPrice: Number(item.sellingPrice || 19.99),
        minReorderPoint: minReorder,
        barcode: item.barcode || `890123450${Date.now().toString().slice(-3)}${idx}`,
        stockByWarehouse: stockMap,
        totalStock: totalStock,
        status: status,
        description: item.description || 'Imported via CSV catalog upload.',
        lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };
    });

    setProducts(prev => [...formattedProducts, ...prev]);

    // Create ledger entries for imported items with stock
    const ledgerEntries = formattedProducts
      .filter(p => p.totalStock > 0)
      .map((p, idx) => ({
        id: `LED-${Date.now().toString().slice(-6)}-${idx}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        productName: p.name,
        sku: p.sku,
        operation: 'CSV Import Intake',
        reference: p.sku,
        from: 'CSV File Upload',
        to: getWarehouseName(defaultWh),
        quantity: p.totalStock,
        unit: p.unit,
        user: 'Anish (Admin)',
        status: 'Completed'
      }));

    if (ledgerEntries.length > 0) {
      setLedger(prev => [...ledgerEntries, ...prev]);
    }

    toast.success(
      'CSV Catalog Import Complete',
      `Successfully added ${formattedProducts.length} new product(s) to inventory.`
    );

    return formattedProducts.length;
  };

  // UPDATE PRODUCT (metadata only — does NOT change stock levels)
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

  // -------------------------------------------------------------
  // STOCK OPERATIONS — Core rules enforced here
  // -------------------------------------------------------------

  /**
   * RECEIVE STOCK: Stock + quantity  (used by receipts & directly)
   * @param {string} productId
   * @param {string} warehouseId
   * @param {number} quantity
   * @param {string} [reference]
   * @param {string} [supplierName]
   */
  const receiveStock = (productId, warehouseId, quantity, reference = '', supplierName = 'Supplier') => {
    const qty = Number(quantity);
    if (qty <= 0) {
      toast.error('Invalid Quantity', 'Receive quantity must be greater than zero.');
      return false;
    }

    const whName = getWarehouseName(warehouseId);

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const currentWhStock = Number(p.stockByWarehouse?.[warehouseId] || 0);
        const newStockByWarehouse = {
          ...p.stockByWarehouse,
          [warehouseId]: currentWhStock + qty
        };
        const newTotalStock = Object.values(newStockByWarehouse).reduce((a, b) => Number(a) + Number(b), 0);
        const newStatus = calculateStockStatus(newTotalStock, p.minReorderPoint);

        return {
          ...p,
          stockByWarehouse: newStockByWarehouse,
          totalStock: newTotalStock,
          status: newStatus,
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return p;
    }));

    const prod = products.find(p => p.id === productId);

    // Ledger entry
    addLedgerEntry({
      productName: prod?.name || productId,
      sku: prod?.sku || '',
      operation: 'Receipt',
      reference: reference,
      from: supplierName,
      to: whName,
      quantity: qty,
      unit: prod?.unit || 'units'
    });

    // Activity
    addActivity({
      productName: prod?.name || productId,
      operation: 'Received',
      type: 'receipt',
      quantity: `+${qty} ${prod?.unit || 'units'}`,
      location: whName,
      status: 'success'
    });

    return true;
  };

  /**
   * DELIVER STOCK: Stock - quantity  (used by deliveries & directly)
   * @param {string} productId
   * @param {string} warehouseId
   * @param {number} quantity
   * @param {string} [reference]
   * @param {string} [customerName]
   */
  const deliverStock = (productId, warehouseId, quantity, reference = '', customerName = 'Customer') => {
    const qty = Number(quantity);
    if (qty <= 0) {
      toast.error('Invalid Quantity', 'Delivery quantity must be greater than zero.');
      return false;
    }

    const whName = getWarehouseName(warehouseId);
    const prod = products.find(p => p.id === productId);
    const currentWhStock = Number(prod?.stockByWarehouse?.[warehouseId] || 0);

    if (currentWhStock < qty) {
      toast.error(
        'Insufficient Stock',
        `Only ${currentWhStock} ${prod?.unit || 'units'} available in ${whName}. Cannot deliver ${qty}.`
      );
      return false;
    }

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const curStock = Number(p.stockByWarehouse?.[warehouseId] || 0);
        const newStockByWarehouse = {
          ...p.stockByWarehouse,
          [warehouseId]: Math.max(0, curStock - qty)
        };
        const newTotalStock = Object.values(newStockByWarehouse).reduce((a, b) => Number(a) + Number(b), 0);
        const newStatus = calculateStockStatus(newTotalStock, p.minReorderPoint);

        return {
          ...p,
          stockByWarehouse: newStockByWarehouse,
          totalStock: newTotalStock,
          status: newStatus,
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return p;
    }));

    // Ledger entry
    addLedgerEntry({
      productName: prod?.name || productId,
      sku: prod?.sku || '',
      operation: 'Delivery',
      reference: reference,
      from: whName,
      to: `${customerName} (Customer)`,
      quantity: -qty,
      unit: prod?.unit || 'units'
    });

    // Activity
    addActivity({
      productName: prod?.name || productId,
      operation: 'Delivered',
      type: 'delivery',
      quantity: `-${qty} ${prod?.unit || 'units'}`,
      location: whName,
      status: 'warning'
    });

    return true;
  };

  /**
   * TRANSFER STOCK: Source - qty, Destination + qty. Total unchanged.
   * @param {string} productId
   * @param {string} fromWarehouseId
   * @param {string} toWarehouseId
   * @param {number} quantity
   * @param {string} [reference]
   */
  const transferStock = (productId, fromWarehouseId, toWarehouseId, quantity, reference = '') => {
    const qty = Number(quantity);
    if (qty <= 0) {
      toast.error('Invalid Quantity', 'Transfer quantity must be greater than zero.');
      return false;
    }

    if (fromWarehouseId === toWarehouseId) {
      toast.error('Invalid Transfer', 'Source and destination warehouses cannot be the same location.');
      return false;
    }

    const prod = products.find(p => p.id === productId);
    const fromWhName = getWarehouseName(fromWarehouseId);
    const toWhName = getWarehouseName(toWarehouseId);
    const currentFromStock = Number(prod?.stockByWarehouse?.[fromWarehouseId] || 0);

    if (currentFromStock < qty) {
      toast.error(
        'Insufficient Stock',
        `Only ${currentFromStock} ${prod?.unit || 'units'} available in ${fromWhName}.`
      );
      return false;
    }

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const curFromStock = Number(p.stockByWarehouse?.[fromWarehouseId] || 0);
        const curToStock = Number(p.stockByWarehouse?.[toWarehouseId] || 0);

        const newStockByWarehouse = {
          ...p.stockByWarehouse,
          [fromWarehouseId]: Math.max(0, curFromStock - qty),
          [toWarehouseId]: curToStock + qty
        };
        // Total stock MUST remain the same for a transfer
        return {
          ...p,
          stockByWarehouse: newStockByWarehouse,
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return p;
    }));

    // Ledger entry
    addLedgerEntry({
      productName: prod?.name || productId,
      sku: prod?.sku || '',
      operation: 'Internal Transfer',
      reference: reference,
      from: fromWhName,
      to: toWhName,
      quantity: qty,
      unit: prod?.unit || 'units'
    });

    // Activity
    addActivity({
      productName: prod?.name || productId,
      operation: 'Transferred',
      type: 'transfer',
      quantity: `${qty} ${prod?.unit || 'units'}`,
      location: `${fromWhName} → ${toWhName}`,
      status: 'info'
    });

    return true;
  };

  /**
   * ADJUST STOCK: Sets stock to physical count for a specific warehouse.
   * Total stock = sum of all warehouse stocks after adjustment.
   * @param {string} productId
   * @param {string} warehouseId
   * @param {number} physicalQty  — the actual counted quantity
   * @param {string} [reason]
   */
  const adjustStock = (productId, warehouseId, physicalQty, reason = 'Cycle Count Variance') => {
    const physical = Number(physicalQty);
    if (physical < 0) {
      toast.error('Invalid Quantity', 'Physical quantity cannot be negative.');
      return false;
    }

    const prod = products.find(p => p.id === productId);
    const whName = getWarehouseName(warehouseId);
    const systemQty = Number(prod?.stockByWarehouse?.[warehouseId] || 0);
    const difference = physical - systemQty;

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newStockByWarehouse = {
          ...p.stockByWarehouse,
          [warehouseId]: physical
        };
        const newTotalStock = Object.values(newStockByWarehouse).reduce((a, b) => Number(a) + Number(b), 0);
        const newStatus = calculateStockStatus(newTotalStock, p.minReorderPoint);

        return {
          ...p,
          stockByWarehouse: newStockByWarehouse,
          totalStock: newTotalStock,
          status: newStatus,
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return p;
    }));

    // Ledger entry
    addLedgerEntry({
      productName: prod?.name || productId,
      sku: prod?.sku || '',
      operation: 'Adjustment',
      reference: `ADJ-${Date.now().toString().slice(-6)}`,
      from: whName,
      to: `${reason} (${difference >= 0 ? '+' : ''}${difference} ${prod?.unit || 'units'})`,
      quantity: difference,
      unit: prod?.unit || 'units'
    });

    // Activity
    addActivity({
      productName: prod?.name || productId,
      operation: 'Adjusted',
      type: 'adjustment',
      quantity: `${difference >= 0 ? '+' : ''}${difference} ${prod?.unit || 'units'}`,
      location: whName,
      status: difference >= 0 ? 'success' : 'neutral'
    });

    toast.info(
      '✓ Inventory Adjustment Applied',
      `Physical count of ${physical} recorded for ${prod?.name || productId} (${difference >= 0 ? '+' : ''}${difference}).`
    );

    return true;
  };

  /**
   * ADD LEDGER ENTRY directly (for other team members' custom operations)
   * @param {Object} entryData
   */
  const addLedgerEntry = (entryData) => {
    const newLedgerEntry = {
      id: `LED-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: entryData.productName || 'Unknown Product',
      sku: entryData.sku || '',
      operation: entryData.operation || 'Manual Entry',
      reference: entryData.reference || '',
      from: entryData.from || '',
      to: entryData.to || '',
      quantity: Number(entryData.quantity || 0),
      unit: entryData.unit || 'units',
      user: entryData.user || 'Anish',
      status: entryData.status || 'Completed'
    };
    setLedger(prev => [newLedgerEntry, ...prev]);
    return newLedgerEntry;
  };

  // -------------------------------------------------------------
  // RECEIPT OPERATIONS (document-based, validates to update stock)
  // -------------------------------------------------------------

  // 1. ADD RECEIPT (creates a receipt document, does NOT update stock yet)
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

  // 2. VALIDATE RECEIPT → Increases Stock & Adds Ledger Entry
  const validateReceipt = (receiptId) => {
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) return;
    if (receipt.status === 'Done') {
      toast.warning('Already Validated', `Receipt #${receipt.receiptNumber} has already been marked as Done.`);
      return;
    }

    const whId = receipt.warehouseId;
    const whName = receipt.warehouseName;

    // 1. Update Product Stocks (Stock + quantity)
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
      id: `LED-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: item.productName,
      sku: item.sku,
      operation: 'Receipt',
      reference: receipt.receiptNumber,
      from: receipt.supplier,
      to: whName,
      warehouse: whName,
      quantity: Number(item.qty),
      unit: item.unit || 'units',
      user: 'Anish (Validated)',
      status: 'Completed'
    }));
    setLedger(prev => [...newLedgerEntries, ...prev]);

    // 4. Create Recent Activity
    const firstItem = receipt.items[0];
    const totalQty = receipt.items.reduce((sum, i) => sum + Number(i.qty), 0);
    addActivity({
      productName: firstItem?.productName || 'Multiple Products',
      operation: 'Received',
      type: 'receipt',
      quantity: `+${totalQty} units`,
      location: whName,
      status: 'success'
    });

    // 5. Fire confetti & celebration
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (e) {
      // safe fallback
    }

    toast.success(
      '✓ Receipt Validated Successfully',
      `Stock updated by +${totalQty} units in ${whName}.`
    );
  };

  // -------------------------------------------------------------
  // DELIVERY OPERATIONS
  // -------------------------------------------------------------

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

  // 4. ADVANCE / VALIDATE DELIVERY → Decreases Stock & Adds Ledger Entry
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

    // 1. Update Product Stocks (Delivery: Stock - quantity)
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
      id: `LED-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: item.productName,
      sku: item.sku,
      operation: 'Delivery',
      reference: delivery.deliveryId,
      from: whName,
      to: `${delivery.customer} (Customer)`,
      warehouse: whName,
      quantity: -Number(item.qty),
      unit: item.unit || 'units',
      user: 'Anish (Dispatched)',
      status: 'Completed'
    }));
    setLedger(prev => [...newLedgerEntries, ...prev]);

    // 4. Create Activity
    const firstItem = delivery.items[0];
    const totalDeliveredQty = delivery.items.reduce((sum, i) => sum + Number(i.qty), 0);
    addActivity({
      productName: firstItem?.productName || 'Multiple Products',
      operation: 'Delivered',
      type: 'delivery',
      quantity: `-${totalDeliveredQty} units`,
      location: whName,
      status: 'warning'
    });

    toast.success(
      '✓ Delivery Completed & Validated',
      `Stock reduced by ${totalDeliveredQty} units from ${whName}. Out for delivery.`
    );
  };

  // -------------------------------------------------------------
  // TRANSFER OPERATIONS
  // -------------------------------------------------------------

  // 5. INTERNAL TRANSFER → Source Warehouse - Qty, Destination Warehouse + Qty, Total Stock UNCHANGED!
  const createTransfer = (transferData) => {
    const newId = `TRF-${3010 + transfers.length + 1}`;
    const qty = Number(transferData.qty || 1);
    const prod = products.find(p => p.id === transferData.productId || p.sku === transferData.sku);
    const fromWhId = transferData.fromWarehouseId || 'WH-MAIN';
    const toWhId = transferData.toWarehouseId || 'WH-PROD';
    // Default to Pending — stock moves only on explicit validateTransfer()
    const status = transferData.status || 'Pending';

    if (fromWhId === toWhId) {
      toast.error('Invalid Transfer', 'Source and destination warehouses cannot be the same location.');
      return null;
    }

    const fromWhName = getWarehouseName(fromWhId);
    const toWhName = getWarehouseName(toWhId);


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
      status,
      carrier: transferData.carrier || 'Internal Shuttle Logistics',
      initiatedBy: 'Anish (Supervisor)',
      notes: transferData.notes || 'Internal stock relocation and replenishment.'
    };

    setTransfers(prev => [newTransfer, ...prev]);

    toast.info(
      'Transfer Request Created',
      `Transfer #${newId} for ${qty} ${newTransfer.unit} of "${newTransfer.productName}" is pending validation.`
    );
    return newTransfer;
  };

  // 5b. VALIDATE TRANSFER -> Moves stock, writes ledger + activity (two-step workflow)
  const validateTransfer = (transferId) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) {
      toast.error('Transfer Not Found', `No transfer record with ID ${transferId} exists.`);
      return;
    }

    // Guard: already completed
    if (transfer.status === 'Completed') {
      toast.warning(
        'Already Validated',
        `Transfer #${transfer.transferNumber} has already been completed. Stock was not changed again.`
      );
      return;
    }

    // Guard: cancelled transfers cannot be validated
    if (transfer.status === 'Cancelled') {
      toast.error(
        'Transfer Cancelled',
        `Transfer #${transfer.transferNumber} was cancelled and cannot be validated.`
      );
      return;
    }

    const prod = products.find(p => p.id === transfer.productId);
    const fromWhId = transfer.fromWarehouseId;
    const toWhId = transfer.toWarehouseId;
    const qty = Number(transfer.qty);
    const fromWhName = transfer.fromWarehouseName;
    const toWhName = transfer.toWarehouseName;

    // Guard: insufficient source stock
    const availableAtSource = Number(prod?.stockByWarehouse?.[fromWhId] || 0);
    if (availableAtSource < qty) {
      toast.error(
        'Insufficient Source Stock',
        `Only ${availableAtSource} ${transfer.unit} available at ${fromWhName}. Cannot transfer ${qty} ${transfer.unit}.`
      );
      return;
    }

    // 1. Move stock: source decreases, destination increases, total unchanged
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
          const newTotalStock = Object.values(newStockByWarehouse).reduce((a, b) => Number(a) + Number(b), 0);
          const newStatus = calculateStockStatus(newTotalStock, p.minReorderPoint);
          return {
            ...p,
            stockByWarehouse: newStockByWarehouse,
            totalStock: newTotalStock,
            status: newStatus,
            lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
          };
        }
        return p;
      }));
    }

    // 2. Update transfer status to Completed
    setTransfers(prev => prev.map(t =>
      t.id === transferId
        ? { ...t, status: 'Completed', validatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
        : t
    ));

    // 3. Ledger entry
    const newLedgerEntry = {
      id: makeId('LED'),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: transfer.productName,
      sku: transfer.sku,
      operation: 'Internal Transfer',
      reference: transfer.transferNumber,
      from: fromWhName,
      to: toWhName,
      warehouse: fromWhName,
      quantity: qty,
      unit: transfer.unit,
      user: 'Anish (Validated)',
      status: 'Completed'
    };
    setLedger(prev => [newLedgerEntry, ...prev]);

    // 4. Activity entry
    addActivity({
      productName: transfer.productName,
      operation: 'Transferred',
      type: 'transfer',
      quantity: `${qty} ${transfer.unit}`,
      location: `${fromWhName} → ${toWhName}`,
      status: 'info'
    });

    toast.success(
      '✓ Transfer Validated & Executed',
      `${qty} ${transfer.unit} moved from ${fromWhName} to ${toWhName}. Total inventory unchanged.`
    );
  };

  // 5c. CANCEL TRANSFER -> Marks cancelled, no stock changes
  const cancelTransfer = (transferId) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    if (transfer.status === 'Completed') {
      toast.warning('Cannot Cancel', `Transfer #${transfer.transferNumber} is already completed and cannot be cancelled.`);
      return;
    }
    if (transfer.status === 'Cancelled') {
      toast.info('Already Cancelled', `Transfer #${transfer.transferNumber} is already cancelled.`);
      return;
    }

    setTransfers(prev => prev.map(t =>
      t.id === transferId ? { ...t, status: 'Cancelled' } : t
    ));
    toast.warning('Transfer Cancelled', `Transfer #${transfer.transferNumber} has been cancelled. No stock was moved.`);
  };

  // -------------------------------------------------------------
  // ADJUSTMENT OPERATIONS
  // -------------------------------------------------------------

  // 6. INVENTORY ADJUSTMENT → System Qty vs Physical Qty
  const applyAdjustment = (adjustmentData) => {
    const newId = `ADJ-${4000 + adjustments.length + 1}`;
    const prod = products.find(p => p.id === adjustmentData.productId || p.sku === adjustmentData.sku);
    const whId = adjustmentData.warehouseId || 'WH-MAIN';
    const whName = getWarehouseName(whId);

    const systemQty = Number(adjustmentData.systemQty !== undefined
      ? adjustmentData.systemQty
      : (prod?.stockByWarehouse?.[whId] || 0));
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
      id: `LED-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: newAdjustment.productName,
      sku: newAdjustment.sku,
      operation: 'Adjustment',
      reference: newAdjustment.adjustmentNumber,
      from: whName,
      to: `${newAdjustment.reason} (${difference > 0 ? '+' : ''}${difference} ${newAdjustment.unit})`,
      warehouse: whName,
      quantity: difference,
      unit: newAdjustment.unit,
      user: 'Anish (Auditor)',
      status: 'Completed'
    };
    setLedger(prev => [newLedgerEntry, ...prev]);

    // Activity Entry
    addActivity({
      productName: newAdjustment.productName,
      operation: 'Adjusted',
      type: 'adjustment',
      quantity: `${difference > 0 ? '+' : ''}${difference} ${newAdjustment.unit}`,
      location: whName,
      status: difference >= 0 ? 'success' : 'neutral'
    });

    toast.info(
      '✓ Inventory Adjustment Applied',
      `Physical count of ${physicalQty} recorded for ${newAdjustment.productName} (${difference > 0 ? '+' : ''}${difference} ${newAdjustment.unit}).`
    );
    return newAdjustment;
  };

  // 6b. APPROVE PENDING ADJUSTMENT -> applies stock for 'Pending Approval' records
  const approveAdjustment = (adjustmentId) => {
    const adjustment = adjustments.find(a => a.id === adjustmentId);
    if (!adjustment) {
      toast.error('Not Found', 'Adjustment record not found.');
      return;
    }
    if (adjustment.status === 'Applied') {
      toast.warning(
        'Already Applied',
        `Adjustment #${adjustment.adjustmentNumber} has already been applied. Stock was not changed again.`
      );
      return;
    }

    const prod = products.find(p => p.id === adjustment.productId);
    const whId = adjustment.warehouseId;
    const whName = adjustment.warehouseName;
    const physicalQty = Number(adjustment.physicalQty);
    const difference = Number(adjustment.difference);

    // Apply stock: set warehouse qty to the physical count
    if (prod) {
      setProducts(prev => prev.map(p => {
        if (p.id === prod.id) {
          const newStockByWarehouse = { ...p.stockByWarehouse, [whId]: physicalQty };
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

    // Mark adjustment as Applied
    setAdjustments(prev => prev.map(a =>
      a.id === adjustmentId
        ? { ...a, status: 'Applied', approvedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
        : a
    ));

    // Ledger entry
    const newLedgerEntry = {
      id: makeId('LED'),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      productName: adjustment.productName,
      sku: adjustment.sku,
      operation: 'Adjustment',
      reference: adjustment.adjustmentNumber,
      from: whName,
      to: `${adjustment.reason} (${difference > 0 ? '+' : ''}${difference} ${adjustment.unit})`,
      warehouse: whName,
      quantity: difference,
      unit: adjustment.unit,
      user: 'Anish (Approved)',
      status: 'Completed'
    };
    setLedger(prev => [newLedgerEntry, ...prev]);

    // Activity entry
    addActivity({
      productName: adjustment.productName,
      operation: 'Adjusted',
      type: 'adjustment',
      quantity: `${difference > 0 ? '+' : ''}${difference} ${adjustment.unit}`,
      location: whName,
      status: difference >= 0 ? 'success' : 'neutral'
    });

    toast.success(
      '✓ Adjustment Approved & Applied',
      `Stock updated to ${physicalQty} ${adjustment.unit} for "${adjustment.productName}" at ${whName} (${difference > 0 ? '+' : ''}${difference}).`
    );
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

  // -------------------------------------------------------------
  // ALERTS MANAGEMENT
  // -------------------------------------------------------------

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

  // -------------------------------------------------------------
  // SETTINGS
  // -------------------------------------------------------------

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    toast.success('Settings Saved', 'Application preferences updated successfully.');
  };

  // -------------------------------------------------------------
  // FACTORY RESET
  // -------------------------------------------------------------

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

  // -------------------------------------------------------------
  // REAL-TIME DASHBOARD KPIs
  // Computed fresh from live state every render — no stale values
  // -------------------------------------------------------------
  const kpiMetrics = {
    totalProducts: products.length,                                                          // ALL products in catalog
    totalProductsInStock: products.reduce((acc, p) => acc + (p.totalStock > 0 ? 1 : 0), 0), // products WITH stock
    totalUnitsInStock: products.reduce((acc, p) => acc + Number(p.totalStock || 0), 0),
    lowStockCount: products.filter(p => Number(p.totalStock) > 0 && Number(p.totalStock) <= Number(p.minReorderPoint)).length,
    outOfStockCount: products.filter(p => Number(p.totalStock) <= 0).length,
    pendingReceiptsCount: receipts.filter(r => ['Draft', 'Waiting', 'Ready'].includes(r.status)).length,
    pendingDeliveriesCount: deliveries.filter(d => ['Draft', 'Picking', 'Packing', 'Ready'].includes(d.status)).length,
    internalTransfersCount: transfers.length,
    unreadAlertsCount: alerts.filter(a => !a.isRead).length,
    activeWarehousesCount: warehouses.filter(w => w.status === 'Active').length
  };

  return (
    <InventoryContext.Provider
      value={{
        // State
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
        calculateStockStatus,

        // Product CRUD
        addProduct,
        importProductsBatch,
        updateProduct,
        deleteProduct,

        // Stock operation primitives (for Member 2 & 3 to call directly)
        receiveStock,
        deliverStock,
        transferStock,
        adjustStock,
        addLedgerEntry,

        // Document-based operations (Receipts, Deliveries, Transfers, Adjustments)
        addReceipt,
        validateReceipt,
        addDelivery,
        advanceDeliveryStatus,
        validateDelivery,
        createTransfer,
        validateTransfer,
        cancelTransfer,
        applyAdjustment,
        approveAdjustment,

        // Warehouse
        addWarehouse,

        // Alerts
        markAlertAsRead,
        markAllAlertsAsRead,
        dismissAlert,

        // Settings
        updateSettings,
        resetToDefaults,

        // Utilities
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
