import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { AlertCard } from '../../components/alerts/AlertCard';
import { Button } from '../../components/common/Button';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { SearchBar } from '../../components/common/SearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Package,
  CheckCircle2
} from 'lucide-react';

// Stat Card component matching StockFlow design system
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const colorMap = {
    slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.slate}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtitle && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export const AlertsPage = () => {
  const { alerts, markAlertAsRead, markAllAlertsAsRead, dismissAlert } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedReadStatus, setSelectedReadStatus] = useState('All');

  // KPI Metrics derived from single-source-of-truth alerts
  const kpiData = useMemo(() => {
    const total = alerts.length;
    const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
    const warningCount = alerts.filter(a => a.severity === 'Warning').length;
    const unreadCount = alerts.filter(a => !a.isRead).length;

    return { total, criticalCount, warningCount, unreadCount };
  }, [alerts]);

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return alerts.filter(alert => {
      const matchesQuery = !q || (
        (alert.title || '').toLowerCase().includes(q) ||
        (alert.message || '').toLowerCase().includes(q) ||
        (alert.productName || '').toLowerCase().includes(q) ||
        (alert.sku || '').toLowerCase().includes(q)
      );

      const matchesSeverity = selectedSeverity === 'All' || alert.severity === selectedSeverity;
      const matchesType = selectedType === 'All' || alert.type === selectedType;
      const matchesReadStatus =
        selectedReadStatus === 'All' ||
        (selectedReadStatus === 'Unread' ? !alert.isRead : alert.isRead);

      return matchesQuery && matchesSeverity && matchesType && matchesReadStatus;
    });
  }, [alerts, searchQuery, selectedSeverity, selectedType, selectedReadStatus]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedSeverity !== 'All' ||
    selectedType !== 'All' ||
    selectedReadStatus !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('All');
    setSelectedType('All');
    setSelectedReadStatus('All');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Alerts & Notifications Center
            </h1>
            {kpiData.unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold animate-pulse">
                {kpiData.unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time threshold alerts for reorder requirements, out-of-stock shortages, and awaiting validations.
          </p>
        </div>

        {kpiData.unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            icon={CheckCheck}
            onClick={markAllAlertsAsRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Alerts"
          value={kpiData.total}
          subtitle="All active notifications"
          icon={Bell}
          color="slate"
        />
        <StatCard
          title="Critical / Out of Stock"
          value={kpiData.criticalCount}
          subtitle="Immediate action required"
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          title="Reorder Warnings"
          value={kpiData.warningCount}
          subtitle="At or below minimum threshold"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Unread Messages"
          value={kpiData.unreadCount}
          subtitle="Awaiting acknowledgment"
          icon={Info}
          color="blue"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search alerts by product, SKU, keyword, or message..."
            className="flex-1 max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Severity"
              value={selectedSeverity}
              onChange={setSelectedSeverity}
              options={['All', 'Critical', 'Warning', 'Info']}
              icon={AlertTriangle}
            />

            <FilterDropdown
              label="Type"
              value={selectedType}
              onChange={setSelectedType}
              options={['All', 'Stock', 'Receipt', 'Delivery', 'Adjustment']}
              icon={Bell}
            />

            <FilterDropdown
              label="Status"
              value={selectedReadStatus}
              onChange={setSelectedReadStatus}
              options={[
                { value: 'All', label: 'All Status' },
                { value: 'Unread', label: 'Unread Only' },
                { value: 'Read', label: 'Read Only' }
              ]}
              icon={CheckCircle2}
            />

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold px-2 py-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200 font-mono">{filteredAlerts.length}</strong> of{' '}
              <span className="font-mono">{alerts.length}</span> alerts
            </span>
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={alerts.length === 0 ? "All systems optimal" : "No matching alerts found"}
            description={
              alerts.length === 0
                ? "There are no active inventory shortages or pending order alerts. Stock levels are healthy."
                : "Try adjusting your search criteria or resetting filters to view all active alerts."
            }
          />
        ) : (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={markAlertAsRead}
              onDismiss={dismissAlert}
            />
          ))
        )}
      </div>
    </div>
  );
};
