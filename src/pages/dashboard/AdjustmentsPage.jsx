import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AddAdjustmentModal } from '../../components/operations/AddAdjustmentModal';
import { formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import {
  SlidersHorizontal,
  Plus,
  Download,
  Warehouse,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ClipboardList,
  Activity,
  Clock
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sublabel }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
        {label}
      </p>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
        {value}
      </p>
      {sublabel && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sublabel}</p>
      )}
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export const AdjustmentsPage = () => {
  const { adjustments, warehouses, approveAdjustment } = useInventory();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null); // adjustment object

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = adjustments.length;
    const applied = adjustments.filter(a => a.status === 'Applied').length;
    const pending = adjustments.filter(a => a.status === 'Pending Approval').length;
    // Net variance from all applied adjustments
    const netVariance = adjustments
      .filter(a => a.status === 'Applied')
      .reduce((sum, a) => sum + Number(a.difference || 0), 0);
    return { total, applied, pending, netVariance };
  }, [adjustments]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredAdjustments = useMemo(() => adjustments.filter(adj => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      adj.adjustmentNumber.toLowerCase().includes(q) ||
      adj.productName.toLowerCase().includes(q) ||
      adj.sku.toLowerCase().includes(q) ||
      adj.reason.toLowerCase().includes(q) ||
      adj.warehouseName.toLowerCase().includes(q);

    const matchesWarehouse = selectedWarehouse === 'All' || adj.warehouseId === selectedWarehouse;
    const matchesStatus = selectedStatus === 'All' || adj.status === selectedStatus;

    return matchesQuery && matchesWarehouse && matchesStatus;
  }), [adjustments, searchQuery, selectedWarehouse, selectedStatus]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = filteredAdjustments.map(a => ({
      AdjustmentNumber: a.adjustmentNumber,
      Product: a.productName,
      SKU: a.sku,
      Warehouse: a.warehouseName,
      SystemQty: a.systemQty,
      PhysicalQty: a.physicalQty,
      VarianceDifference: a.difference,
      Unit: a.unit,
      Reason: a.reason,
      Status: a.status,
      Date: a.date,
      Auditor: a.auditor,
      Notes: a.notes
    }));
    exportToCSV(data, `stockflow-adjustments-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      header: 'Adjustment #',
      accessor: 'adjustmentNumber',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs">
              {row.adjustmentNumber}
            </span>
            <p className="text-[10px] text-slate-400 font-mono">{formatDate(row.date)}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Product',
      accessor: 'productName',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            {row.productName}
          </span>
          <p className="text-[10px] text-slate-400 font-mono">{row.sku}</p>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'warehouseName',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs whitespace-nowrap">
          {row.warehouseName}
        </span>
      )
    },
    {
      header: 'System → Physical',
      accessor: 'systemQty',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">
            {row.systemQty}
          </span>
          <span className="text-slate-300 dark:text-slate-600 mx-1.5 text-xs">→</span>
          <span className="font-bold font-mono text-slate-900 dark:text-slate-100 text-xs">
            {row.physicalQty} {row.unit}
          </span>
        </div>
      )
    },
    {
      header: 'Variance',
      accessor: 'difference',
      sortable: true,
      align: 'right',
      render: (row) => {
        const isPositive = row.difference > 0;
        const isNegative = row.difference < 0;
        const DiffIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : null;
        return (
          <span className={`inline-flex items-center gap-1 font-extrabold font-mono text-xs px-2 py-0.5 rounded-md ${
            isPositive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
              : isNegative
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
          }`}>
            {DiffIcon && <DiffIcon className="w-3 h-3" />}
            {isPositive ? `+${row.difference}` : row.difference} {row.unit}
          </span>
        );
      }
    },
    {
      header: 'Reason',
      accessor: 'reason',
      sortable: true,
      render: (row) => (
        <div className="max-w-[180px]">
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
            {row.reason}
          </span>
          {row.notes && (
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{row.notes}</p>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      render: (row) => {
        if (row.status === 'Applied') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Applied
            </span>
          );
        }
        if (row.status === 'Pending Approval') {
          return (
            <button
              onClick={() => setApproveTarget(row)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              title="Approve and apply this adjustment"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </button>
          );
        }
        return null;
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory Adjustments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reconcile physical inventory discrepancies, cycle count variances, damage write-offs, and quality scrap.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAddOpen(true)}>
            New Adjustment
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Adjustments"
          value={stats.total}
          icon={ClipboardList}
          color="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
          sublabel="All records"
        />
        <StatCard
          label="Applied"
          value={stats.applied}
          icon={CheckCircle2}
          color="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
          sublabel="Stock updated"
        />
        <StatCard
          label="Pending Approval"
          value={stats.pending}
          icon={Clock}
          color="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
          sublabel={stats.pending > 0 ? 'Awaiting action' : 'None pending'}
        />
        <StatCard
          label="Net Variance"
          value={`${stats.netVariance > 0 ? '+' : ''}${stats.netVariance}`}
          icon={stats.netVariance >= 0 ? TrendingUp : TrendingDown}
          color={
            stats.netVariance > 0
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : stats.netVariance < 0
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }
          sublabel="Applied adjustments total"
        />
      </div>

      {/* ── Info Callout ──────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-3.5 text-xs text-amber-900 dark:text-amber-200">
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
          <SlidersHorizontal className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-sm block text-slate-900 dark:text-slate-100">
            Physical Count Reconciliation
          </span>
          <span>
            System quantity is read directly from InventoryContext. Enter physical count →
            variance is auto-calculated. Adjustments update stock, ledger, and activity instantly.
          </span>
        </div>
      </div>

      {/* ── Search & Filter Bar ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by adjustment #, product, reason, or SKU..."
          className="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={['All', 'Applied', 'Pending Approval']}
            icon={Activity}
          />

          <FilterDropdown
            label="Warehouse"
            value={selectedWarehouse}
            onChange={setSelectedWarehouse}
            options={[
              { value: 'All', label: 'All Warehouses' },
              ...warehouses.map(w => ({ value: w.id, label: w.name }))
            ]}
            icon={Warehouse}
          />

          {(selectedWarehouse !== 'All' || selectedStatus !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedWarehouse('All');
                setSelectedStatus('All');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Adjustments Table ─────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={filteredAdjustments}
        keyField="id"
        pageSize={8}
        emptyTitle="No inventory adjustments found"
        emptyDescription="Create an adjustment to record physical inventory count variances and cycle count discrepancies."
      />

      {/* ── Create Adjustment Modal ───────────────────────────────────────── */}
      <AddAdjustmentModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* ── Approve Confirm Dialog ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => {
          approveAdjustment(approveTarget.id);
          setApproveTarget(null);
        }}
        variant="primary"
        title="Approve & Apply Adjustment"
        message={
          approveTarget
            ? `This will apply adjustment ${approveTarget.adjustmentNumber}:\n\n` +
              `"${approveTarget.productName}" at ${approveTarget.warehouseName}\n` +
              `System: ${approveTarget.systemQty} → Physical: ${approveTarget.physicalQty} ${approveTarget.unit} ` +
              `(Variance: ${approveTarget.difference > 0 ? '+' : ''}${approveTarget.difference} ${approveTarget.unit})\n\n` +
              `This will permanently update the stock record and cannot be undone.`
            : ''
        }
        confirmText="Yes, Approve & Apply"
        cancelText="Not Yet"
      />
    </div>
  );
};
