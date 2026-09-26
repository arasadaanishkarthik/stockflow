import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export const OverviewPage = () => {
  const { user } = useAuth();
  const { kpiMetrics, warehouses } = useInventory();
  const activeWarehouseCount = warehouses.filter(w => w.status === 'Active').length;
  const navigate = useNavigate();

  // Modals state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);

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

      {/* Smart Reorder Smart Recommendation Banner if low stock items exist */}
      {(kpiMetrics.lowStockCount > 0 || kpiMetrics.outOfStockCount > 0) && (
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
                  {kpiMetrics.lowStockCount + kpiMetrics.outOfStockCount} Items Need Restocking
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Automated analysis detected products below optimal threshold. View recommended PO quantities and restock priorities.
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

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Products"
          value={kpiMetrics.totalProducts}
          subtitle={`${kpiMetrics.totalUnitsInStock.toLocaleString()} units in stock`}
          change="+8.4%"
          changeType="positive"
          icon={Package}
          colorScheme="blue"
          onClick={() => navigate('/products')}
        />

        <KpiCard
          title="Low Stock"
          value={kpiMetrics.lowStockCount}
          subtitle="Below reorder lvl"
          change={kpiMetrics.lowStockCount > 0 ? 'Action required' : 'Optimal'}
          changeType={kpiMetrics.lowStockCount > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          colorScheme="amber"
          onClick={() => navigate('/products?status=Low Stock')}
        />

        <KpiCard
          title="Out of Stock"
          value={kpiMetrics.outOfStockCount}
          subtitle="0 units on hand"
          change={kpiMetrics.outOfStockCount > 0 ? 'Critical restock' : 'None'}
          changeType={kpiMetrics.outOfStockCount > 0 ? 'negative' : 'neutral'}
          icon={AlertCircle}
          colorScheme="rose"
          onClick={() => navigate('/products?status=Out of Stock')}
        />

        <KpiCard
          title="Pending Receipts"
          value={kpiMetrics.pendingReceiptsCount}
          subtitle="Inbound supplier POs"
          change="+2 new today"
          changeType="positive"
          icon={ArrowDownToLine}
          colorScheme="emerald"
          onClick={() => navigate('/receipts')}
        />

        <KpiCard
          title="Pending Deliveries"
          value={kpiMetrics.pendingDeliveriesCount}
          subtitle="Pick / Pack stage"
          change="3 high priority"
          changeType="neutral"
          icon={Truck}
          colorScheme="cyan"
          onClick={() => navigate('/deliveries')}
        />

        <KpiCard
          title="Internal Moves"
          value={kpiMetrics.internalTransfersCount}
          subtitle="Cross-dock & floor"
          change="100% on time"
          changeType="positive"
          icon={ArrowLeftRight}
          colorScheme="purple"
          onClick={() => navigate('/transfers')}
        />
      </div>

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
