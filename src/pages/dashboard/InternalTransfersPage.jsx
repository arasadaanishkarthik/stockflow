import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AddTransferModal } from '../../components/operations/AddTransferModal';
import { formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import {
  ArrowLeftRight,
  Plus,
  Download,
  Warehouse,
  ShieldCheck,
  Truck,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  PackageCheck,
  RotateCcw
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
export const InternalTransfersPage = () => {
  const { transfers, warehouses, validateTransfer, cancelTransfer, products } = useInventory();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSourceWh, setSelectedSourceWh] = useState('All');

  const [isAddOpen, setIsAddOpen] = useState(false);

  // Confirm dialogs
  const [validateTarget, setValidateTarget] = useState(null); // transfer object
  const [cancelTarget, setCancelTarget] = useState(null);     // transfer object

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = transfers.length;
    const completed = transfers.filter(t => t.status === 'Completed').length;
    const pending = transfers.filter(t => t.status === 'Pending' || t.status === 'In Transit').length;
    const cancelled = transfers.filter(t => t.status === 'Cancelled').length;
    return { total, completed, pending, cancelled };
  }, [transfers]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredTransfers = useMemo(() => transfers.filter(trf => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      trf.transferNumber.toLowerCase().includes(q) ||
      trf.productName.toLowerCase().includes(q) ||
      trf.sku.toLowerCase().includes(q) ||
      trf.fromWarehouseName.toLowerCase().includes(q) ||
      trf.toWarehouseName.toLowerCase().includes(q);

    const matchesStatus = selectedStatus === 'All' || trf.status === selectedStatus;
    const matchesSource = selectedSourceWh === 'All' || trf.fromWarehouseId === selectedSourceWh;

    return matchesQuery && matchesStatus && matchesSource;
  }), [transfers, searchQuery, selectedStatus, selectedSourceWh]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = filteredTransfers.map(t => ({
      TransferNumber: t.transferNumber,
      Product: t.productName,
      SKU: t.sku,
      Quantity: t.qty,
      Unit: t.unit,
      FromWarehouse: t.fromWarehouseName,
      ToWarehouse: t.toWarehouseName,
      Date: t.date,
      Status: t.status,
      Carrier: t.carrier,
      InitiatedBy: t.initiatedBy,
      Notes: t.notes
    }));
    exportToCSV(data, `stockflow-transfers-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // ── Available source stock helper (for confirm dialog messages) ────────────
  const getSourceStock = (transfer) => {
    const prod = products.find(p => p.id === transfer?.productId);
    return prod?.stockByWarehouse?.[transfer?.fromWarehouseId] ?? 0;
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      header: 'Transfer #',
      accessor: 'transferNumber',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs">
              {row.transferNumber}
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
      header: 'Quantity',
      accessor: 'qty',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400 font-mono">
          {row.qty} <span className="text-xs font-normal text-slate-500">{row.unit}</span>
        </span>
      )
    },
    {
      header: 'Transfer Route (From → To)',
      accessor: 'fromWarehouseName',
      render: (row) => (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
            {row.fromWarehouseName}
          </span>
          <ArrowLeftRight className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-medium whitespace-nowrap">
            {row.toWarehouseName}
          </span>
        </div>
      )
    },
    {
      header: 'Transport / AGV',
      accessor: 'carrier',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[130px]">{row.carrier || 'Standard Transit'}</span>
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
        const isPending = row.status === 'Pending' || row.status === 'In Transit';
        const isCompleted = row.status === 'Completed';
        const isCancelled = row.status === 'Cancelled';

        if (isCompleted) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Done
            </span>
          );
        }
        if (isCancelled) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
              <XCircle className="w-3.5 h-3.5" /> Cancelled
            </span>
          );
        }
        if (isPending) {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setValidateTarget(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                title="Validate this transfer — stock will move"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validate
              </button>
              <button
                onClick={() => setCancelTarget(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors"
                title="Cancel this transfer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
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
            Internal Stock Transfers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Transfer inventory between warehouses, production assembly floors, and buffer zones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAddOpen(true)}>
            New Transfer
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Transfers"
          value={stats.total}
          icon={ArrowLeftRight}
          color="bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
          sublabel="All time"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={PackageCheck}
          color="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
          sublabel="Stock moved"
        />
        <StatCard
          label="Awaiting Validation"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
          sublabel={stats.pending > 0 ? 'Action required' : 'None pending'}
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          icon={RotateCcw}
          color="bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400"
          sublabel="No stock moved"
        />
      </div>

      {/* ── Info Callout ──────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent border border-purple-200/60 dark:border-purple-900/40 flex items-center gap-3.5 text-xs text-purple-900 dark:text-purple-200">
        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-sm block text-slate-900 dark:text-slate-100">
            Two-Step Transfer Workflow
          </span>
          <span>
            Create a transfer (sets it to <strong>Pending</strong>) → click <strong>Validate</strong> to actually move stock.
            Total company inventory is never altered — only location distribution changes.
          </span>
        </div>
      </div>

      {/* ── Search & Filter Bar ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by transfer #, product, SKU, or warehouse..."
          className="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={['All', 'Pending', 'In Transit', 'Completed', 'Cancelled']}
            icon={Activity}
          />

          <FilterDropdown
            label="Source Warehouse"
            value={selectedSourceWh}
            onChange={setSelectedSourceWh}
            options={[
              { value: 'All', label: 'All Source Locations' },
              ...warehouses.map(w => ({ value: w.id, label: w.name }))
            ]}
            icon={Warehouse}
          />

          {(selectedStatus !== 'All' || selectedSourceWh !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus('All');
                setSelectedSourceWh('All');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Transfers Table ───────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={filteredTransfers}
        keyField="id"
        pageSize={8}
        emptyTitle="No internal transfers recorded"
        emptyDescription="Create a new transfer to move stock between facilities. Transfers start as Pending and must be validated to move stock."
      />

      {/* ── Create Transfer Modal ─────────────────────────────────────────── */}
      <AddTransferModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* ── Validate Confirm Dialog ───────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!validateTarget}
        onClose={() => setValidateTarget(null)}
        onConfirm={() => {
          validateTransfer(validateTarget.id);
          setValidateTarget(null);
        }}
        variant="primary"
        title="Validate & Execute Transfer"
        message={
          validateTarget
            ? `This will move ${validateTarget.qty} ${validateTarget.unit} of "${validateTarget.productName}" from ${validateTarget.fromWarehouseName} to ${validateTarget.toWarehouseName}.\n\nSource available: ${getSourceStock(validateTarget)} ${validateTarget.unit}.\n\nTotal company inventory remains unchanged. This action cannot be undone.`
            : ''
        }
        confirmText="Yes, Validate Transfer"
        cancelText="Not Yet"
      />

      {/* ── Cancel Confirm Dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          cancelTransfer(cancelTarget.id);
          setCancelTarget(null);
        }}
        variant="danger"
        title="Cancel Transfer"
        message={
          cancelTarget
            ? `Are you sure you want to cancel transfer ${cancelTarget.transferNumber}?\n\n"${cancelTarget.productName}" (${cancelTarget.qty} ${cancelTarget.unit}) from ${cancelTarget.fromWarehouseName} to ${cancelTarget.toWarehouseName} will NOT be moved. No stock is affected.`
            : ''
        }
        confirmText="Yes, Cancel Transfer"
        cancelText="Keep Pending"
      />
    </div>
  );
};
