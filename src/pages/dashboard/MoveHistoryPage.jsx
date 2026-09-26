import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import {
  History,
  Download,
  Printer,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  SlidersHorizontal,
  Activity,
  Layers,
  Package,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

// Stat Card component matching StockFlow design system
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorMap = {
    slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.slate}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtitle && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{subtitle}</span>
          {trend && <span className="font-semibold text-slate-700 dark:text-slate-300">{trend}</span>}
        </div>
      )}
    </div>
  );
};

// Helper to determine warehouse location from record
export const getEntryWarehouse = (entry) => {
  if (entry.warehouse) return entry.warehouse;
  if (entry.operation === 'Receipt') return entry.to;
  if (entry.operation === 'Delivery' || entry.operation === 'Adjustment') return entry.from;
  if (entry.operation === 'Internal Transfer') return `${entry.from} → ${entry.to}`;
  return entry.to || entry.from || 'N/A';
};

// Robust date parser for chronological sorting
const parseTimestamp = (dateStr) => {
  if (!dateStr) return 0;
  const ts = new Date(dateStr).getTime();
  return isNaN(ts) ? 0 : ts;
};

export const MoveHistoryPage = () => {
  const { ledger, warehouses, products } = useInventory();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // KPI Metrics calculation from single-source-of-truth ledger
  const kpis = useMemo(() => {
    const total = ledger.length;
    const receipts = ledger.filter(l => l.operation === 'Receipt');
    const deliveries = ledger.filter(l => l.operation === 'Delivery');
    const transfers = ledger.filter(l => l.operation === 'Internal Transfer');
    const adjustments = ledger.filter(l => l.operation === 'Adjustment');

    const totalInbound = receipts.reduce((sum, r) => sum + Math.max(0, Number(r.quantity) || 0), 0);
    const totalOutbound = deliveries.reduce((sum, d) => sum + Math.abs(Number(d.quantity) || 0), 0);

    return {
      total,
      receiptsCount: receipts.length,
      totalInbound,
      deliveriesCount: deliveries.length,
      totalOutbound,
      transfersCount: transfers.length,
      adjustmentsCount: adjustments.length
    };
  }, [ledger]);

  // Dynamic Product Filter options from products list and ledger entries
  const productOptions = useMemo(() => {
    const names = new Set();
    products.forEach(p => { if (p.name) names.add(p.name); });
    ledger.forEach(l => { if (l.productName) names.add(l.productName); });

    return [
      { value: 'All', label: 'All Products' },
      ...Array.from(names).sort().map(name => ({ value: name, label: name }))
    ];
  }, [products, ledger]);

  // Dynamic Warehouse Filter options
  const warehouseOptions = useMemo(() => {
    return [
      { value: 'All', label: 'All Warehouses' },
      ...warehouses.map(w => ({ value: w.name, label: w.name }))
    ];
  }, [warehouses]);

  // Operation Filter options
  const operationOptions = [
    { value: 'All', label: 'All Operations' },
    { value: 'Receipt', label: 'Receipt' },
    { value: 'Delivery', label: 'Delivery' },
    { value: 'Internal Transfer', label: 'Internal Transfer' },
    { value: 'Adjustment', label: 'Adjustment' }
  ];

  // Status Filter options based on actual statuses present
  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Completed', label: 'Completed' },
    { value: 'In Progress', label: 'In Progress' }
  ];

  // Filtered & Chronologically Sorted Ledger (newest records first)
  const filteredAndSortedLedger = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = ledger.filter(entry => {
      const wh = getEntryWarehouse(entry);

      // Search across product name, SKU, reference, warehouse, origin, destination, user, and operation
      const matchesQuery = !q || (
        (entry.productName || '').toLowerCase().includes(q) ||
        (entry.sku || '').toLowerCase().includes(q) ||
        (entry.reference || '').toLowerCase().includes(q) ||
        (wh || '').toLowerCase().includes(q) ||
        (entry.from || '').toLowerCase().includes(q) ||
        (entry.to || '').toLowerCase().includes(q) ||
        (entry.user || '').toLowerCase().includes(q) ||
        (entry.operation || '').toLowerCase().includes(q)
      );

      // Operation filter
      const matchesOperation = selectedOperation === 'All' || entry.operation === selectedOperation;

      // Product filter
      const matchesProduct = selectedProduct === 'All' || entry.productName === selectedProduct;

      // Warehouse filter
      let matchesWarehouse = true;
      if (selectedWarehouse !== 'All') {
        matchesWarehouse =
          wh.includes(selectedWarehouse) ||
          (entry.from || '').includes(selectedWarehouse) ||
          (entry.to || '').includes(selectedWarehouse);
      }

      // Status filter
      const matchesStatus = selectedStatus === 'All' || entry.status === selectedStatus;

      return matchesQuery && matchesOperation && matchesProduct && matchesWarehouse && matchesStatus;
    });

    // Chronological sorting: newest records first (using timestamp parsing, not array index)
    return filtered.sort((a, b) => {
      const timeA = parseTimestamp(a.date);
      const timeB = parseTimestamp(b.date);
      if (timeA !== timeB) return timeB - timeA;
      // Secondary tie-breaker by ID descending
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [ledger, searchQuery, selectedOperation, selectedProduct, selectedWarehouse, selectedStatus]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedOperation !== 'All' ||
    selectedProduct !== 'All' ||
    selectedWarehouse !== 'All' ||
    selectedStatus !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedOperation('All');
    setSelectedProduct('All');
    setSelectedWarehouse('All');
    setSelectedStatus('All');
  };

  const handleExport = () => {
    const data = filteredAndSortedLedger.map(l => ({
      ID: l.id,
      Date: l.date,
      Operation: l.operation,
      Product: l.productName,
      SKU: l.sku,
      Reference: l.reference,
      Warehouse: getEntryWarehouse(l),
      From: l.from,
      To: l.to,
      Quantity: l.quantity,
      Unit: l.unit,
      User: l.user,
      Status: l.status
    }));
    exportToCSV(data, `stockflow-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getOperationBadge = (op) => {
    switch (op) {
      case 'Receipt':
        return {
          icon: ArrowDownToLine,
          badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        };
      case 'Delivery':
        return {
          icon: Truck,
          badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        };
      case 'Internal Transfer':
        return {
          icon: ArrowLeftRight,
          badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
        };
      case 'Adjustment':
        return {
          icon: SlidersHorizontal,
          badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        };
      default:
        return {
          icon: History,
          badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        };
    }
  };

  const columns = [
    {
      header: 'Date & Time',
      accessor: 'date',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {formatDate(row.date)}
        </span>
      )
    },
    {
      header: 'Operation',
      accessor: 'operation',
      sortable: true,
      render: (row) => {
        const config = getOperationBadge(row.operation);
        const Icon = config.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${config.badge}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{row.operation}</span>
          </span>
        );
      }
    },
    {
      header: 'Product',
      accessor: 'productName',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
          {row.productName}
        </span>
      )
    },
    {
      header: 'SKU',
      accessor: 'sku',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
          {row.sku}
        </span>
      )
    },
    {
      header: 'Reference',
      accessor: 'reference',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.reference}
        </span>
      )
    },
    {
      header: 'Warehouse',
      accessor: 'warehouse',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[140px] truncate block" title={getEntryWarehouse(row)}>
          {getEntryWarehouse(row)}
        </span>
      )
    },
    {
      header: 'From (Origin)',
      accessor: 'from',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 max-w-[120px] truncate block" title={row.from}>
          {row.from}
        </span>
      )
    },
    {
      header: 'To (Destination)',
      accessor: 'to',
      render: (row) => (
        <span className="text-xs text-slate-800 dark:text-slate-200 font-medium max-w-[120px] truncate block" title={row.to}>
          {row.to}
        </span>
      )
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      sortable: true,
      align: 'right',
      render: (row) => {
        const isPos = row.quantity > 0;
        const isNeg = row.quantity < 0;
        return (
          <span className={`font-extrabold font-mono text-xs ${
            isPos ? 'text-emerald-600 dark:text-emerald-400' : isNeg ? 'text-rose-600 dark:text-rose-400' : 'text-purple-600 dark:text-purple-400'
          }`}>
            {isPos ? `+${row.quantity}` : row.quantity} {row.unit}
          </span>
        );
      }
    },
    {
      header: 'User',
      accessor: 'user',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {row.user}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Stock Ledger & Move History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete immutable audit log of every stock receipt, delivery dispatch, internal transfer, and count adjustment.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print Ledger
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Movements"
          value={kpis.total}
          subtitle="All logged operations"
          icon={History}
          color="slate"
        />
        <StatCard
          title="Inbound Receipts"
          value={kpis.receiptsCount}
          subtitle={`+${kpis.totalInbound.toLocaleString()} units received`}
          icon={ArrowDownToLine}
          color="emerald"
        />
        <StatCard
          title="Outbound Deliveries"
          value={kpis.deliveriesCount}
          subtitle={`-${kpis.totalOutbound.toLocaleString()} units dispatched`}
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="Transfers & Audits"
          value={kpis.transfersCount + kpis.adjustmentsCount}
          subtitle={`${kpis.transfersCount} transfers · ${kpis.adjustmentsCount} adjustments`}
          icon={ArrowLeftRight}
          color="purple"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by product, SKU, reference ID, warehouse, origin, destination, auditor..."
            className="flex-1 max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            {/* Operation Filter */}
            <FilterDropdown
              label="Operation"
              value={selectedOperation}
              onChange={setSelectedOperation}
              options={operationOptions}
              icon={Activity}
            />

            {/* Product Filter */}
            <FilterDropdown
              label="Product"
              value={selectedProduct}
              onChange={setSelectedProduct}
              options={productOptions}
              icon={Package}
            />

            {/* Warehouse Filter */}
            <FilterDropdown
              label="Warehouse"
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
              options={warehouseOptions}
              icon={Layers}
            />

            {/* Status Filter */}
            <FilterDropdown
              label="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions}
              icon={CheckCircle2}
            />

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold px-2 py-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results summary when filters are active */}
        {hasActiveFilters && (
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200 font-mono">{filteredAndSortedLedger.length}</strong> of{' '}
              <span className="font-mono">{ledger.length}</span> movements
            </span>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <DataTable
        columns={columns}
        data={filteredAndSortedLedger}
        keyField="id"
        pageSize={10}
        emptyTitle={ledger.length === 0 ? "No stock movements yet." : "No matching movements found"}
        emptyDescription={
          ledger.length === 0
            ? "Inventory movements will appear here when receipts, deliveries, transfers, or adjustments are completed."
            : "Try adjusting your search criteria or resetting filters to see more results."
        }
      />
    </div>
  );
};
