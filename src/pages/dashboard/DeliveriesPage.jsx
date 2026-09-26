import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
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
  Building,
  Package,
  Activity,
  Layers,
  X,
  FilterX
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const DeliveriesPage = () => {
  const { deliveries, advanceDeliveryStatus, validateDelivery, warehouses, products } = useInventory();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState(null);

  const selectedDelivery = deliveries.find(d => d.id === selectedDeliveryId || d.deliveryId === selectedDeliveryId) || null;

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  // Combined Search and Filters
  const filteredDeliveries = deliveries.filter(del => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = !query || (
      String(del.deliveryId || del.id || '').toLowerCase().includes(query) ||
      String(del.customer || '').toLowerCase().includes(query) ||
      String(del.warehouseName || '').toLowerCase().includes(query) ||
      (del.items || []).some(item => {
        const prod = products?.find(p => p.id === item.productId || p.sku === item.sku);
        return (
          String(item.productName || '').toLowerCase().includes(query) ||
          String(item.sku || '').toLowerCase().includes(query) ||
          String(prod?.name || '').toLowerCase().includes(query) ||
          String(prod?.sku || '').toLowerCase().includes(query)
        );
      })
    );

    const matchesStatus = selectedStatus === 'All' || del.status === selectedStatus;
    const matchesWarehouse = selectedWarehouse === 'All' || del.warehouseId === selectedWarehouse || del.warehouseName === selectedWarehouse;

    return matchesQuery && matchesStatus && matchesWarehouse;
  });

  const isFiltered = Boolean(searchQuery.trim() || selectedStatus !== 'All' || selectedWarehouse !== 'All');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedWarehouse('All');
  };

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
              <span className="text-[11px] text-slate-400 font-normal">({row.items?.length || 0} SKUs)</span>
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
          row.priority === 'High' || row.priority === 'Urgent'
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
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
        const getActionConfig = () => {
          if (row.status === 'Draft') {
            return { title: 'Pick', icon: ArrowRight, variant: 'secondary', onClick: () => advanceDeliveryStatus(row.id) };
          }
          if (row.status === 'Picking') {
            return { title: 'Pack', icon: ArrowRight, variant: 'secondary', onClick: () => advanceDeliveryStatus(row.id) };
          }
          if (row.status === 'Packing' || row.status === 'Ready') {
            return { title: 'Validate', icon: CheckCircle2, variant: 'danger', onClick: () => setConfirmingDelivery(row) };
          }
          return null;
        };

        const actionConfig = getActionConfig();

        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setSelectedDeliveryId(row.id);
                setIsDetailOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {row.status !== 'Done' && row.status !== 'Canceled' && actionConfig && (
              <Button
                variant={actionConfig.variant}
                size="xs"
                icon={actionConfig.icon}
                onClick={actionConfig.onClick}
              >
                {actionConfig.title}
              </Button>
            )}

            {row.status === 'Done' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
              </span>
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
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by delivery #, customer, product, SKU, or warehouse..."
            className="flex-1 max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={['All', 'Draft', 'Picking', 'Packing', 'Ready', 'Done']}
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

            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                icon={X}
                onClick={handleResetFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Filters:
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatus !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                Status: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus('All')}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedWarehouse !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                Warehouse: {warehouses.find(w => w.id === selectedWarehouse)?.name || selectedWarehouse}
                <button
                  onClick={() => setSelectedWarehouse('All')}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Deliveries Table */}
      <DataTable
        columns={columns}
        data={filteredDeliveries}
        keyField="id"
        pageSize={8}
        emptyTitle={isFiltered ? 'No matching delivery orders found' : 'No delivery orders found'}
        emptyDescription={
          isFiltered
            ? 'No deliveries matched your search and filter criteria. Clear your filters to see all records.'
            : 'Create a new delivery order to schedule customer shipment.'
        }
        emptyActionLabel={isFiltered ? 'Reset All Filters' : 'Create Delivery'}
        onEmptyAction={isFiltered ? handleResetFilters : () => setIsAddOpen(true)}
        onRowClick={(row) => {
          setSelectedDeliveryId(row.id);
          setIsDetailOpen(true);
        }}
      />

      {/* Create Delivery Modal */}
      <AddDeliveryModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* Delivery Detail Modal */}
      <DeliveryDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDeliveryId(null);
        }}
        delivery={selectedDelivery}
      />

      {/* ConfirmDialog before row validation */}
      <ConfirmDialog
        isOpen={Boolean(confirmingDelivery)}
        onClose={() => setConfirmingDelivery(null)}
        onConfirm={() => {
          if (confirmingDelivery) {
            validateDelivery(confirmingDelivery.id);
            setConfirmingDelivery(null);
          }
        }}
        title="Validate & Dispatch Delivery?"
        message="Validating this delivery will decrease inventory stock. This action cannot be undone."
        confirmText="Validate & Dispatch"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
