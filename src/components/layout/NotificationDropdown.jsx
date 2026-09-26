import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, AlertCircle, AlertTriangle, Info, ArrowRight, ExternalLink } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Link, useNavigate } from 'react-router-dom';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { alerts, markAlertAsRead, markAllAlertsAsRead } = useInventory();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadAlerts = alerts.filter(a => !a.isRead);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAlertIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  const handleAlertClick = (alert) => {
    markAlertAsRead(alert.id);
    setIsOpen(false);
    if (alert.type === 'Receipt') navigate('/receipts');
    else if (alert.type === 'Delivery') navigate('/deliveries');
    else if (alert.type === 'Adjustment') navigate('/adjustments');
    else navigate('/products');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Notifications & Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadAlerts.length > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Notifications
              </span>
              {unreadAlerts.length > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                  {unreadAlerts.length} new
                </span>
              )}
            </div>
            {unreadAlerts.length > 0 && (
              <button
                onClick={markAllAlertsAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No active notifications.
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-start gap-3 ${
                    !alert.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    {getAlertIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {alert.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/alerts"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View all alerts center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
