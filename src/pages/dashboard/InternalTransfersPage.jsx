import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
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
  Activity
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const InternalTransfersPage = () => {
  const { transfers, warehouses } = useInventory();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSourceWh, setSelectedSourceWh] = useState('All');

  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  // Filtered Transfers
  const filteredTransfers = transfers.filter(trf => {
    const matchesQuery =
      trf.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trf.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trf.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trf.fromWarehouseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trf.toWarehouseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'All' || trf.status === selectedStatus;
    const matchesSource = selectedSourceWh === 'All' || trf.fromWarehouseId === selectedSourceWh;

    return matchesQuery && matchesStatus && matchesSource;
  });

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
      InitiatedBy: t.initiatedBy
    }));
    exportToCSV(data, `stockflow-transfers-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const columns = [
    {
      header: 'Transfer #',
      accessor: 'transferNumber',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-100 dark:border-purple-900/40">
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
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            {row.fromWarehouseName}
          </span>
          <ArrowLeftRight className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-medium">
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
          <Truck className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.carrier || 'Standard Transit'}</span>
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
            Internal Stock Transfers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Transfer inventory between warehouses, production assembly floors, and buffer zones.
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
            New Transfer
          </Button>
        </div>
      </div>

      {/* Info Highlight Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent border border-purple-200/60 dark:border-purple-900/40 flex items-center gap-3.5 text-xs text-purple-900 dark:text-purple-200">
        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-sm block text-slate-900 dark:text-slate-100">
            Inventory-Neutral Movement Rule
          </span>
          <span>
            Internal transfers adjust source and destination storage locations without modifying total company stock.
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by transfer #, product, or warehouse..."
          className="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={['All', 'Completed', 'In Transit', 'Pending']}
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

      {/* Transfers Table */}
      <DataTable
        columns={columns}
        data={filteredTransfers}
        keyField="id"
        pageSize={8}
        emptyTitle="No internal transfers recorded"
        emptyDescription="Create a new transfer to move stock between facilities."
      />

      {/* Create Transfer Modal */}
      <AddTransferModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
};
