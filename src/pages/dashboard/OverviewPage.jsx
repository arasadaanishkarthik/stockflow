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
  const { kpiMetrics, resetToDefaults } = useInventory();
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
            Here's what's happening with your inventory today across 4 active facilities.
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

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Products"
          value={kpiMetrics.totalProductsInStock}
          subtitle={`${kpiMetrics.totalUnitsInStock.toLocaleString()} units`}
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
