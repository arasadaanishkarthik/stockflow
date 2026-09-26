import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { AddReceiptModal } from '../../components/operations/AddReceiptModal';
import { ReceiptDetailModal } from '../../components/operations/ReceiptDetailModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import {
  ArrowDownToLine,
  Plus,
  Download,
  Eye,
  CheckCircle2,
  Building,
  Calendar,
  Layers,
  Activity
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const ReceiptsPage = () => {
  const { receipts, validateReceipt, warehouses } = useInventory();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  // Filtered Receipts
  const filteredReceipts = receipts.filter(rec => {
    const matchesQuery =
      rec.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()) || i.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'All' || rec.status === selectedStatus;
    const matchesWarehouse = selectedWarehouse === 'All' || rec.warehouseId === selectedWarehouse;

    return matchesQuery && matchesStatus && matchesWarehouse;
  });

  const handleExport = () => {
    const data = filteredReceipts.map(r => ({
      ReceiptNumber: r.receiptNumber,
      Supplier: r.supplier,
      Warehouse: r.warehouseName,
      Status: r.status,
      Date: r.date,
      TotalAmount: r.totalAmount,
      TotalItems: r.items.reduce((s, i) => s + i.qty, 0),
      ReceivedBy: r.receivedBy
    }));
    exportToCSV(data, `stockflow-receipts-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const columns = [
    {
      header: 'Receipt #',
      accessor: 'receiptNumber',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <ArrowDownToLine className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs hover:text-blue-600 dark:hover:text-blue-400">
              {row.receiptNumber}
            </span>
            <p className="text-[10px] text-slate-400 font-mono">{formatDate(row.date)}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            {row.supplier}
          </span>
          <p className="text-[10px] text-slate-400">{row.supplierEmail}</p>
        </div>
      )
    },
    {
      header: 'Items & Units',
      accessor: 'items',
      render: (row) => {
        const totalUnits = (row.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
        return (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
              <span className="font-mono text-emerald-600 dark:text-emerald-400">+{totalUnits} units</span>
              <span className="text-[11px] text-slate-400 font-normal">({row.items?.length} SKUs)</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
              {row.items?.map(i => i.productName).join(', ')}
            </p>
          </div>
        );
      }
    },
    {
      header: 'Destination WH',
      accessor: 'warehouseName',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs">
          {row.warehouseName}
        </span>
      )
    },
    {
      header: 'Total Value',
      accessor: 'totalAmount',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-bold font-mono text-xs text-slate-900 dark:text-slate-100">
          {formatCurrency(row.totalAmount)}
        </span>
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
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedReceipt(row);
              setIsDetailOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {row.status !== 'Done' && (
            <Button
              variant="success"
              size="xs"
              icon={CheckCircle2}
              onClick={() => validateReceipt(row.id)}
            >
              Validate
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Inbound Goods Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage incoming purchase orders from vendors and validate stock increments into warehouse facilities.
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
            Create Receipt
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by receipt #, supplier, warehouse, or item name..."
          className="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={['All', 'Draft', 'Waiting', 'Ready', 'Done', 'Canceled']}
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
            icon={Building}
          />

          {(selectedStatus !== 'All' || selectedWarehouse !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus('All');
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

      {/* Receipts Table */}
      <DataTable
        columns={columns}
        data={filteredReceipts}
        keyField="id"
        pageSize={8}
        emptyTitle="No goods receipts found"
        emptyDescription="Create a new receipt to schedule incoming inventory from a vendor."
        onRowClick={(row) => {
          setSelectedReceipt(row);
          setIsDetailOpen(true);
        }}
      />

      {/* Create Receipt Modal */}
      <AddReceiptModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* Receipt Detail Modal */}
      <ReceiptDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
};
