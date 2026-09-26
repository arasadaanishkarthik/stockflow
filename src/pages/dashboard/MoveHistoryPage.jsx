import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';

export const MoveHistoryPage = () => {
  const { ledger, warehouses } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');

  // Filtered Ledger
  const filteredLedger = ledger.filter(entry => {
    const matchesQuery =
      entry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.user.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOperation = selectedOperation === 'All' || entry.operation === selectedOperation;

    let matchesWarehouse = true;
    if (selectedWarehouse !== 'All') {
      matchesWarehouse = entry.from.includes(selectedWarehouse) || entry.to.includes(selectedWarehouse);
    }

    return matchesQuery && matchesOperation && matchesWarehouse;
  });

  const handleExport = () => {
    const data = filteredLedger.map(l => ({
      ID: l.id,
      Date: l.date,
      Product: l.productName,
      SKU: l.sku,
      Operation: l.operation,
      Reference: l.reference,
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
          badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200'
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
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            {row.productName}
          </span>
          <p className="text-[10px] text-slate-400 font-mono">{row.sku}</p>
        </div>
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
      header: 'From (Origin)',
      accessor: 'from',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 max-w-[130px] truncate block">
          {row.from}
        </span>
      )
    },
    {
      header: 'To (Destination)',
      accessor: 'to',
      render: (row) => (
        <span className="text-xs text-slate-800 dark:text-slate-200 font-medium max-w-[130px] truncate block">
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
            Complete immutable audit log of every stock receipt, delivery order, internal relocation, and count adjustment.
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by product, SKU, reference ID, origin, destination, or auditor..."
          className="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Operation"
            value={selectedOperation}
            onChange={setSelectedOperation}
            options={['All', 'Receipt', 'Delivery', 'Internal Transfer', 'Adjustment', 'Initial Intake']}
            icon={Activity}
          />

          <FilterDropdown
            label="Facility"
            value={selectedWarehouse}
            onChange={setSelectedWarehouse}
            options={[
              { value: 'All', label: 'All Locations' },
              ...warehouses.map(w => ({ value: w.name, label: w.name }))
            ]}
            icon={Layers}
          />

          {(selectedOperation !== 'All' || selectedWarehouse !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedOperation('All');
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

      {/* Ledger Table */}
      <DataTable
        columns={columns}
        data={filteredLedger}
        keyField="id"
        pageSize={10}
        emptyTitle="No ledger movements found"
        emptyDescription="All stock receipts, dispatches, and transfers will be logged here in real-time."
      />
    </div>
  );
};
