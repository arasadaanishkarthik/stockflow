import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { AddAdjustmentModal } from '../../components/operations/AddAdjustmentModal';
import { formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import {
  SlidersHorizontal,
  Plus,
  Download,
  Warehouse,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const AdjustmentsPage = () => {
  const { adjustments, warehouses } = useInventory();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');

  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  // Filtered Adjustments
  const filteredAdjustments = adjustments.filter(adj => {
    const matchesQuery =
      adj.adjustmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.warehouseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWarehouse = selectedWarehouse === 'All' || adj.warehouseId === selectedWarehouse;

    return matchesQuery && matchesWarehouse;
  });

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
      Date: a.date,
      Auditor: a.auditor
    }));
    exportToCSV(data, `stockflow-adjustments-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const columns = [
    {
      header: 'Adjustment #',
      accessor: 'adjustmentNumber',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-100 dark:border-amber-900/40">
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
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs">
          {row.warehouseName}
        </span>
      )
    },
    {
      header: 'System Recorded',
      accessor: 'systemQty',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-mono text-slate-600 dark:text-slate-400 text-xs">
          {row.systemQty} {row.unit}
        </span>
      )
    },
    {
      header: 'Physical Counted',
      accessor: 'physicalQty',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-bold font-mono text-slate-900 dark:text-slate-100 text-xs">
          {row.physicalQty} {row.unit}
        </span>
      )
    },
    {
      header: 'Variance Difference',
      accessor: 'difference',
      sortable: true,
      align: 'right',
      render: (row) => {
        const isPositive = row.difference > 0;
        const isNegative = row.difference < 0;
        return (
          <span className={`inline-flex items-center font-extrabold font-mono text-xs px-2 py-0.5 rounded-md ${
            isPositive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
              : isNegative
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
          }`}>
            {isPositive ? `+${row.difference}` : row.difference} {row.unit}
          </span>
        );
      }
    },
    {
      header: 'Reason / Incident',
      accessor: 'reason',
      sortable: true,
      render: (row) => (
        <div className="max-w-[200px]">
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
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExport}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddOpen(true)}
          >
            New Adjustment
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by adjustment #, product, reason, or SKU..."
          className="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
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

          {(selectedWarehouse !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedWarehouse('All');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Adjustments Table */}
      <DataTable
        columns={columns}
        data={filteredAdjustments}
        keyField="id"
        pageSize={8}
        emptyTitle="No inventory adjustments found"
        emptyDescription="Create an adjustment to record physical inventory count variances."
      />

      {/* Create Adjustment Modal */}
      <AddAdjustmentModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
};
