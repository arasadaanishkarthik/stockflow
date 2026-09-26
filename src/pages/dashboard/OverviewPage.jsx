import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { StockMovementChart } from '../../components/dashboard/StockMovementChart';
import { CategoryDistributionChart } from '../../components/dashboard/CategoryDistributionChart';
import { WarehouseOverviewCard } from '../../components/dashboard/WarehouseOverviewCard';
import { RecentActivityTimeline } from '../../components/dashboard/RecentActivityTimeline';
import { AddReceiptModal } from '../../components/operations/AddReceiptModal';
import { AddDeliveryModal } from '../../components/operations/AddDeliveryModal';
import { AddTransferModal } from '../../components/operations/AddTransferModal';
import { AddProductModal } from '../../components/products/AddProductModal';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Package,
  AlertTriangle,
  AlertCircle,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  Plus,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  Building,
  Tags,
  Activity,
  FileText,
  RotateCcw,
  Layers,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';

export const OverviewPage = () => {
  const { user } = useAuth();
  const {
    products,
    categories,
    warehouses,
    receipts,
    deliveries,
    transfers,
    adjustments,
    kpiMetrics,
    validateReceipt,
    advanceDeliveryStatus,
    validateTransfer,
    approveAdjustment
  } = useInventory();

  const activeWarehouseCount = warehouses.filter(w => w.status === 'Active').length;
  const navigate = useNavigate();

  // Modals state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);

  // ── Dynamic Dashboard Filter State ─────────────────────────────────────────
  const [selectedDocType, setSelectedDocType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedDocType !== 'All') count++;
    if (selectedStatus !== 'All') count++;
    if (selectedWarehouse !== 'All') count++;
    if (selectedCategory !== 'All') count++;
    return count;
  }, [selectedDocType, selectedStatus, selectedWarehouse, selectedCategory]);

  const hasActiveFilters = activeFiltersCount > 0;

  const handleClearFilters = () => {
    setSelectedDocType('All');
    setSelectedStatus('All');
    setSelectedWarehouse('All');
    setSelectedCategory('All');
  };

  // ── Status Normalizer for multi-type filter matching ────────────────────────
  const matchesStatusFilter = (status, filter) => {
    if (!filter || filter === 'All') return true;
    const s = (status || '').toLowerCase();
    const f = filter.toLowerCase();

    if (f === 'draft') return s === 'draft';
    if (f === 'waiting/pending' || f === 'waiting' || f === 'pending') {
      return s === 'waiting' || s === 'pending' || s === 'in transit' || s === 'pending approval';
    }
    if (f === 'ready/packing' || f === 'ready' || f === 'packing') {
      return s === 'ready' || s === 'packing' || s === 'picking';
    }
    if (f === 'done/completed' || f === 'done' || f === 'completed') {
      return s === 'done' || s === 'completed' || s === 'applied';
    }
    if (f === 'canceled' || f === 'cancelled') {
      return s === 'canceled' || s === 'cancelled';
    }
    return s.includes(f);
  };

  // ── Dynamic Live KPI Calculations ──────────────────────────────────────────
  const dynamicMetrics = useMemo(() => {
    // 1. Filter products by category and warehouse
    const filteredProducts = products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      let matchWh = true;
      if (selectedWarehouse !== 'All') {
        matchWh = (p.stockByWarehouse?.[selectedWarehouse] || 0) > 0;
      }
      return matchCat && matchWh;
    });

    const totalProducts = filteredProducts.length;
    const totalUnitsInStock = filteredProducts.reduce((sum, p) => {
      if (selectedWarehouse !== 'All') {
        return sum + Number(p.stockByWarehouse?.[selectedWarehouse] || 0);
      }
      return sum + Number(p.totalStock || 0);
    }, 0);

    const lowStockCount = filteredProducts.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length;
    const outOfStockCount = filteredProducts.filter(p => p.status === 'Out of Stock' || (p.totalStock || 0) === 0).length;

    // 2. Filter Receipts
    const filteredReceipts = receipts.filter(r => {
      const matchWh = selectedWarehouse === 'All' || r.warehouseId === selectedWarehouse;
      const matchSt = matchesStatusFilter(r.status, selectedStatus);
      const matchCat = selectedCategory === 'All' || (r.items || []).some(item => {
        const prod = products.find(p => p.sku === item.sku || p.id === item.productId);
        return prod?.category === selectedCategory;
      });
      return matchWh && matchSt && matchCat;
    });
    const pendingReceiptsCount = filteredReceipts.filter(r => r.status !== 'Done' && r.status !== 'Canceled').length;

    // 3. Filter Deliveries
    const filteredDeliveries = deliveries.filter(d => {
      const matchWh = selectedWarehouse === 'All' || d.warehouseId === selectedWarehouse;
      const matchSt = matchesStatusFilter(d.status, selectedStatus);
      const matchCat = selectedCategory === 'All' || (d.items || []).some(item => {
        const prod = products.find(p => p.sku === item.sku || p.id === item.productId);
        return prod?.category === selectedCategory;
      });
      return matchWh && matchSt && matchCat;
    });
    const pendingDeliveriesCount = filteredDeliveries.filter(d => d.status !== 'Done' && d.status !== 'Canceled').length;

    // 4. Filter Internal Transfers
    const filteredTransfers = transfers.filter(t => {
      const matchWh = selectedWarehouse === 'All' || t.fromWarehouseId === selectedWarehouse || t.toWarehouseId === selectedWarehouse;
      const matchSt = matchesStatusFilter(t.status, selectedStatus);
      const matchCat = selectedCategory === 'All' || (() => {
        const prod = products.find(p => p.id === t.productId || p.sku === t.sku);
        return prod?.category === selectedCategory;
      })();
      return matchWh && matchSt && matchCat;
    });
    const internalTransfersCount = filteredTransfers.length;

    // 5. Filter Adjustments
    const filteredAdjustments = adjustments.filter(a => {
      const matchWh = selectedWarehouse === 'All' || a.warehouseId === selectedWarehouse;
      const matchSt = matchesStatusFilter(a.status, selectedStatus);
      const matchCat = selectedCategory === 'All' || (() => {
        const prod = products.find(p => p.id === a.productId || p.sku === a.sku);
        return prod?.category === selectedCategory;
      })();
      return matchWh && matchSt && matchCat;
    });

    return {
      totalProducts,
      totalUnitsInStock,
      lowStockCount,
      outOfStockCount,
      pendingReceiptsCount,
      pendingDeliveriesCount,
      internalTransfersCount,
      filteredReceipts,
      filteredDeliveries,
      filteredTransfers,
      filteredAdjustments
    };
  }, [products, receipts, deliveries, transfers, adjustments, selectedCategory, selectedWarehouse, selectedStatus]);

  // ── Unified Filtered Operations List for when specific document types or filters are applied ──
  const unifiedFilteredOperations = useMemo(() => {
    if (!hasActiveFilters && selectedDocType === 'All') return [];

    const list = [];

    // Receipts
    if (selectedDocType === 'All' || selectedDocType === 'Receipts') {
      dynamicMetrics.filteredReceipts.forEach(r => {
        list.push({
          id: `rec-${r.id}`,
          originalId: r.id,
          docType: 'Receipt',
          number: r.receiptNumber,
          date: r.date,
          party: r.supplier,
          location: r.warehouseName,
          status: r.status,
          itemCount: r.items?.length || 0,
          totalUnits: (r.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0),
          action: r.status !== 'Done' && r.status !== 'Canceled' ? () => validateReceipt(r.id) : null,
          actionLabel: 'Validate'
        });
      });
    }

    // Deliveries
    if (selectedDocType === 'All' || selectedDocType === 'Deliveries') {
      dynamicMetrics.filteredDeliveries.forEach(d => {
        list.push({
          id: `del-${d.id}`,
          originalId: d.id,
          docType: 'Delivery',
          number: d.deliveryId,
          date: d.date,
          party: d.customer,
          location: d.warehouseName,
          status: d.status,
          itemCount: d.items?.length || 0,
          totalUnits: (d.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0),
          action: d.status !== 'Done' && d.status !== 'Canceled' ? () => advanceDeliveryStatus(d.id) : null,
          actionLabel: d.status === 'Draft' ? 'Pick' : d.status === 'Picking' ? 'Pack' : 'Validate'
        });
      });
    }

    // Transfers
    if (selectedDocType === 'All' || selectedDocType === 'Transfers') {
      dynamicMetrics.filteredTransfers.forEach(t => {
        list.push({
          id: `trf-${t.id}`,
          originalId: t.id,
          docType: 'Transfer',
          number: t.transferNumber,
          date: t.date,
          party: t.productName,
          location: `${t.fromWarehouseName} → ${t.toWarehouseName}`,
          status: t.status,
          itemCount: 1,
          totalUnits: t.qty,
          action: (t.status === 'Pending' || t.status === 'In Transit') ? () => validateTransfer(t.id) : null,
          actionLabel: 'Validate'
        });
      });
    }

    // Adjustments
    if (selectedDocType === 'All' || selectedDocType === 'Adjustments') {
      dynamicMetrics.filteredAdjustments.forEach(a => {
        list.push({
          id: `adj-${a.id}`,
          originalId: a.id,
          docType: 'Adjustment',
          number: a.adjustmentNumber,
          date: a.date,
          party: a.productName,
          location: a.warehouseName,
          status: a.status,
          itemCount: 1,
          totalUnits: a.difference,
          action: a.status === 'Pending Approval' ? () => approveAdjustment(a.id) : null,
          actionLabel: 'Approve'
        });
      });
    }

    // Sort by date descending
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [hasActiveFilters, selectedDocType, dynamicMetrics, validateReceipt, advanceDeliveryStatus, validateTransfer, approveAdjustment]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Good morning, {user?.name || 'Anish'} 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your inventory today across {activeWarehouseCount} active {activeWarehouseCount === 1 ? 'facility' : 'facilities'}.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={Package}
            onClick={() => setIsProductOpen(true)}
          >
            Add Product
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={ArrowDownToLine}
            onClick={() => setIsReceiptOpen(true)}
          >
            Receive Stock
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Truck}
            onClick={() => setIsDeliveryOpen(true)}
          >
            New Delivery
          </Button>
        </div>
      </div>

      {/* Dynamic Dashboard Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/40">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Dashboard Dynamic Filter System
                </h3>
                {hasActiveFilters && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-300/60 animate-pulse">
                    {activeFiltersCount} {activeFiltersCount === 1 ? 'filter active' : 'filters active'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Filter metrics, operational movements, and facilities in real time
              </p>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer self-start md:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {/* 1. Document Type */}
          <FilterDropdown
            label="Document Type"
            value={selectedDocType}
            onChange={setSelectedDocType}
            options={[
              { value: 'All', label: 'All Document Types' },
              { value: 'Receipts', label: 'Inbound Receipts' },
              { value: 'Deliveries', label: 'Customer Deliveries' },
              { value: 'Transfers', label: 'Internal Transfers' },
              { value: 'Adjustments', label: 'Stock Adjustments' }
            ]}
            icon={FileText}
          />

          {/* 2. Status */}
          <FilterDropdown
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Waiting/Pending', label: 'Waiting / Pending' },
              { value: 'Ready/Packing', label: 'Ready / Packing' },
              { value: 'Done/Completed', label: 'Done / Completed' },
              { value: 'Canceled', label: 'Canceled' }
            ]}
            icon={Activity}
          />

          {/* 3. Warehouse */}
          <FilterDropdown
            label="Warehouse"
            value={selectedWarehouse}
            onChange={setSelectedWarehouse}
            options={[
              { value: 'All', label: 'All Warehouses' },
              ...warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code})` }))
            ]}
            icon={Building}
          />

          {/* 4. Product Category */}
          <FilterDropdown
            label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: 'All', label: 'All Categories' },
              ...categories.map(c => ({ value: c, label: c }))
            ]}
            icon={Tags}
          />
        </div>
      </div>

      {/* Smart Reorder Smart Recommendation Banner if low stock items exist */}
      {(dynamicMetrics.lowStockCount > 0 || dynamicMetrics.outOfStockCount > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Smart Reorder System Alert
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300/50">
                  {dynamicMetrics.lowStockCount + dynamicMetrics.outOfStockCount} Items Need Restocking
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Automated analysis detected products below optimal threshold in active view. View recommended PO quantities and restock priorities.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm shrink-0"
            onClick={() => navigate('/reorder')}
          >
            Open Smart Reorder
          </Button>
        </div>
      )}

      {/* 6 KPI Cards Grid — dynamically updated based on active filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Products"
          value={dynamicMetrics.totalProducts}
          subtitle={`${dynamicMetrics.totalUnitsInStock.toLocaleString()} units in stock`}
          change={hasActiveFilters ? 'Filtered view' : '+8.4%'}
          changeType="positive"
          icon={Package}
          colorScheme="blue"
          onClick={() => navigate('/products')}
        />

        <KpiCard
          title="Low Stock"
          value={dynamicMetrics.lowStockCount}
          subtitle="Below reorder lvl"
          change={dynamicMetrics.lowStockCount > 0 ? 'Action required' : 'Optimal'}
          changeType={dynamicMetrics.lowStockCount > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          colorScheme="amber"
          onClick={() => navigate('/products?status=Low Stock')}
        />

        <KpiCard
          title="Out of Stock"
          value={dynamicMetrics.outOfStockCount}
          subtitle="0 units on hand"
          change={dynamicMetrics.outOfStockCount > 0 ? 'Critical restock' : 'None'}
          changeType={dynamicMetrics.outOfStockCount > 0 ? 'negative' : 'neutral'}
          icon={AlertCircle}
          colorScheme="rose"
          onClick={() => navigate('/products?status=Out of Stock')}
        />

        <KpiCard
          title="Pending Receipts"
          value={dynamicMetrics.pendingReceiptsCount}
          subtitle="Inbound supplier POs"
          change={dynamicMetrics.pendingReceiptsCount > 0 ? `${dynamicMetrics.pendingReceiptsCount} awaiting` : 'All cleared'}
          changeType="positive"
          icon={ArrowDownToLine}
          colorScheme="emerald"
          onClick={() => navigate('/receipts')}
        />

        <KpiCard
          title="Pending Deliveries"
          value={dynamicMetrics.pendingDeliveriesCount}
          subtitle="Pick / Pack stage"
          change={dynamicMetrics.pendingDeliveriesCount > 0 ? `${dynamicMetrics.pendingDeliveriesCount} pending` : 'All shipped'}
          changeType="neutral"
          icon={Truck}
          colorScheme="cyan"
          onClick={() => navigate('/deliveries')}
        />

        <KpiCard
          title="Internal Moves"
          value={dynamicMetrics.internalTransfersCount}
          subtitle="Cross-dock & floor"
          change="100% on time"
          changeType="positive"
          icon={ArrowLeftRight}
          colorScheme="purple"
          onClick={() => navigate('/transfers')}
        />
      </div>

      {/* Filtered Operations Section (visible when dynamic filters are active) */}
      {hasActiveFilters && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Filtered Operational Records</span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  {unifiedFilteredOperations.length} found
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live operations matching Document Type: <strong>{selectedDocType}</strong> · Status: <strong>{selectedStatus}</strong> · Warehouse: <strong>{selectedWarehouse}</strong> · Category: <strong>{selectedCategory}</strong>
              </p>
            </div>
            <Link
              to="/ledger"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {unifiedFilteredOperations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No operational records match the current filter combination.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
              {unifiedFilteredOperations.map((op) => (
                <div
                  key={op.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold border ${
                      op.docType === 'Receipt'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                        : op.docType === 'Delivery'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
                        : op.docType === 'Transfer'
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                    }`}>
                      {op.docType === 'Receipt' && <ArrowDownToLine className="w-4 h-4" />}
                      {op.docType === 'Delivery' && <Truck className="w-4 h-4" />}
                      {op.docType === 'Transfer' && <ArrowLeftRight className="w-4 h-4" />}
                      {op.docType === 'Adjustment' && <SlidersHorizontal className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                          {op.number}
                        </span>
                        <span className="text-slate-400 font-normal">({op.docType})</span>
                        <StatusBadge status={op.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {op.party} · <span className="font-medium text-slate-700 dark:text-slate-300">{op.location}</span> · {formatDate(op.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {op.totalUnits > 0 ? `+${op.totalUnits}` : op.totalUnits} units
                    </span>
                    {op.action && (
                      <Button
                        variant="primary"
                        size="xs"
                        icon={CheckCircle2}
                        onClick={op.action}
                      >
                        {op.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StockMovementChart />
        </div>
        <div>
          <CategoryDistributionChart />
        </div>
      </div>

      {/* Bottom Row: Warehouses Overview & Recent Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WarehouseOverviewCard />
        <RecentActivityTimeline />
      </div>

      {/* Modals */}
      <AddProductModal isOpen={isProductOpen} onClose={() => setIsProductOpen(false)} />
      <AddReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} />
      <AddDeliveryModal isOpen={isDeliveryOpen} onClose={() => setIsDeliveryOpen(false)} />
      <AddTransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
    </div>
  );
};

