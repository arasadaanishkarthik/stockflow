import React, { useState } from 'react';
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
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const AlertsPage = () => {
  const { alerts, markAlertAsRead, markAllAlertsAsRead, dismissAlert } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  const filteredAlerts = alerts.filter(alert => {
    const matchesQuery =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverity === 'All' || alert.severity === selectedSeverity;
    const matchesType = selectedType === 'All' || alert.type === selectedType;

    return matchesQuery && matchesSeverity && matchesType;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Alerts & Notifications Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time threshold alerts for reorder requirements, out-of-stock shortages, and awaiting validations.
          </p>
        </div>

        {unreadCount > 0 && (
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search alerts by title or message keyword..."
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

          {(selectedSeverity !== 'All' || selectedType !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSeverity('All');
                setSelectedType('All');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="All systems optimal"
            description="There are no active alerts matching your current filter criteria."
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
