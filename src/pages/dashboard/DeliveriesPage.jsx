import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { AddDeliveryModal } from '../../components/operations/AddDeliveryModal';
import { DeliveryDetailModal } from '../../components/operations/DeliveryDetailModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import {
  Truck,
  Plus,
  Download,
  Eye,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Building,
  Package,
  Activity,
  Layers
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const DeliveriesPage = () => {
  const { deliveries, advanceDeliveryStatus, cancelDelivery, warehouses } = useInventory();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  // Filtered Deliveries
  const filteredDeliveries = deliveries.filter(del => {
    const matchesQuery =
      del.deliveryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()) || i.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'All' || del.status === selectedStatus;
    const matchesWarehouse = selectedWarehouse === 'All' || del.warehouseId === selectedWarehouse;

    return matchesQuery && matchesStatus && matchesWarehouse;
  });

  const handleExport = () => {
    const data = filteredDeliveries.map(d => ({
      DeliveryID: d.deliveryId,
      Customer: d.customer,
      Address: d.shippingAddress,
      Warehouse: d.warehouseName,
      Status: d.status,
      Priority: d.priority,
      Date: d.date,
      TotalAmount: d.totalAmount,
      Carrier: d.carrier,
      Tracking: d.trackingNumber
    }));
    exportToCSV(data, `stockflow-deliveries-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const columns = [
    {
      header: 'Delivery ID',
      accessor: 'deliveryId',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/40">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs hover:text-blue-600 dark:hover:text-blue-400">
              {row.deliveryId}
            </span>
            <p className="text-[10px] text-slate-400 font-mono">{formatDate(row.date)}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Customer & Address',
      accessor: 'customer',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            {row.customer}
          </span>
          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{row.shippingAddress}</p>
        </div>
      )
    },
    {
      header: 'Dispatched Items',
      accessor: 'items',
      render: (row) => {
        const totalUnits = (row.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
        return (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
              <span className="font-mono text-rose-600 dark:text-rose-400">-{totalUnits} units</span>
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
      header: 'Source WH',
      accessor: 'warehouseName',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs">
          {row.warehouseName}
        </span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
          row.priority === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
        }`}>
          {row.priority}
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
      render: (row) => {
        const getActionTitle = () => {
          if (row.status === 'Draft') return 'Pick';
          if (row.status === 'Picking') return 'Pack';
          if (row.status === 'Packing') return 'Validate';
          return null;
        };
        const actionTitle = getActionTitle();

        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setSelectedDelivery(row);
                setIsDetailOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {row.status !== 'Done' && row.status !== 'Canceled' && (
              <button
                onClick={() => cancelDelivery(row.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Cancel Delivery Order"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}

            {row.status !== 'Done' && row.status !== 'Canceled' && actionTitle && (
              <Button
                variant={row.status === 'Packing' ? 'primary' : 'secondary'}
                size="xs"
                icon={row.status === 'Packing' ? CheckCircle2 : ArrowRight}
                onClick={() => advanceDeliveryStatus(row.id)}
              >
                {actionTitle}
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Delivery Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage outgoing shipments to customers and progress through picking, packing, and validation stages.
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
            Create Delivery
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by delivery #, customer, warehouse, or SKU..."
          className="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={['All', 'Draft', 'Picking', 'Packing', 'Done', 'Canceled']}
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

      {/* Deliveries Table */}
      <DataTable
        columns={columns}
        data={filteredDeliveries}
        keyField="id"
        pageSize={8}
        emptyTitle="No delivery orders found"
        emptyDescription="Create a new delivery order to schedule customer shipment."
        onRowClick={(row) => {
          setSelectedDelivery(row);
          setIsDetailOpen(true);
        }}
      />

      {/* Create Delivery Modal */}
      <AddDeliveryModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* Delivery Detail Modal */}
      <DeliveryDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        delivery={selectedDelivery}
      />
    </div>
  );
};
