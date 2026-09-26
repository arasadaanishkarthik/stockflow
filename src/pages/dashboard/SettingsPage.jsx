import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Settings,
  Building,
  Sliders,
  Sun,
  Moon,
  Bell,
  Save,
  RotateCcw,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export const SettingsPage = () => {
  const { settings, updateSettings, resetToDefaults, warehouses } = useInventory();
  const { theme, setTheme, toggleTheme } = useTheme();

  const [formState, setFormState] = useState({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(formState);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            System Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure company profile, reorder thresholds, interface appearance, and alert frequencies.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Save}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. General Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                General Company Info
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Organization name, primary hub, and operating currency.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Legal Name"
              value={formState.companyName}
              onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
            />
            <Select
              label="Default Operating Warehouse"
              options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.city})` }))}
              value={formState.defaultWarehouse}
              onChange={(e) => setFormState({ ...formState, defaultWarehouse: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="System Currency"
              options={['USD ($)', 'EUR (€)', 'GBP (£)', 'CAD ($)', 'AUD ($)', 'JPY (¥)']}
              value={formState.currency}
              onChange={(e) => setFormState({ ...formState, currency: e.target.value })}
            />
            <Select
              label="Timezone"
              options={[
                'America/Chicago (CST)',
                'America/New_York (EST)',
                'America/Los_Angeles (PST)',
                'Europe/London (GMT)',
                'Asia/Tokyo (JST)'
              ]}
              value={formState.timezone}
              onChange={(e) => setFormState({ ...formState, timezone: e.target.value })}
            />
          </div>
        </div>

        {/* 2. Inventory & Reorder Rules */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Inventory Rules & Safety Thresholds
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage low-stock trigger rules and automatic calculation factors.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default Unit of Measure"
              options={['units', 'kg', 'meters', 'rolls', 'sheets', 'packs', 'boxes']}
              value={formState.defaultUnit}
              onChange={(e) => setFormState({ ...formState, defaultUnit: e.target.value })}
            />
            <Input
              label="Low Stock Alert Threshold (% of buffer)"
              type="number"
              min="5"
              max="50"
              value={formState.lowStockThresholdPct}
              onChange={(e) => setFormState({ ...formState, lowStockThresholdPct: Number(e.target.value) })}
              hint="Triggers warning alerts when stock is within this % of minReorderPoint"
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={formState.autoReorder}
              onChange={(e) => setFormState({ ...formState, autoReorder: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Automatic PO Suggestion Engine
              </span>
              <span className="text-slate-500">
                Automatically draft purchase orders when products reach Critical status.
              </span>
            </div>
          </label>
        </div>

        {/* 3. Appearance Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Appearance & Theme
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select your preferred color theme for high-contrast visibility.</p>
            </div>
          </div>

          {/* Switch Mode Quick Action Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Current System Appearance: <span className="text-blue-600 dark:text-blue-400 capitalize">{theme} Mode</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Toggle application theme instantly across all views, tables, forms, and cards.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant={theme === 'dark' ? 'outline' : 'primary'}
              size="sm"
              icon={theme === 'dark' ? Sun : Moon}
              onClick={toggleTheme}
              className="shrink-0 font-bold"
            >
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <span className="text-xs">Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-blue-500 bg-slate-800 text-blue-400 font-bold ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-6 h-6 text-blue-400" />
              <span className="text-xs">Dark Mode</span>
            </button>
          </div>
        </div>

        {/* 4. Notifications Preferences */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Operational Alert Notifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose which operational events trigger system alerts.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { key: 'emailAlerts', title: 'Low Stock & Shortage Warnings', desc: 'Notify immediately when item stock falls below safe buffer.' },
              { key: 'deliveryNotifications', title: 'Dispatch & Delivery Updates', desc: 'Alert when customer orders are marked ready for courier handover.' },
              { key: 'receiptNotifications', title: 'Supplier Receipt Arrivals', desc: 'Notify warehouse dock staff when incoming shipments arrive.' },
              { key: 'dailySummaryReport', title: 'Daily Inventory Ledger Digest', desc: 'Receive morning executive summary of all movements.' }
            ].map(item => (
              <label
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formState[item.key]}
                  onChange={(e) => setFormState({ ...formState, [item.key]: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {item.title}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 5. Danger Zone / Reset Mock State */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 p-6 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Reset Mock Data to Initial State
              </h3>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                Restores default hackathon products, receipts, warehouses, and move ledger. Useful for starting fresh demos.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={RotateCcw}
              onClick={() => setIsResetConfirmOpen(true)}
            >
              Reset Data
            </Button>
          </div>
        </div>
      </form>

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetToDefaults}
        title="Reset All Mock Data?"
        message="This will reset all created products, receipts, deliveries, transfers, and ledger entries back to initial defaults."
        confirmText="Reset to Defaults"
      />
    </div>
  );
};
