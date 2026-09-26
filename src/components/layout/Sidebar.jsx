import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Warehouse,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Boxes,
  ExternalLink,
  BarChart2,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, userRole, isManager, isStaff, switchRole, logout } = useAuth();
  const { kpiMetrics } = useInventory();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOperationsOpen, setIsOperationsOpen] = useState(true);

  const isOperationsActive = [
    '/receipts',
    '/deliveries',
    '/transfers',
    '/adjustments',
    '/ledger'
  ].some(path => location.pathname.startsWith(path));

  const navItemStyles = ({ isActive }) => `
    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group relative
    ${isActive
      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-semibold'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }
  `;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobile = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/90 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Brand */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
            <NavLink
              to="/"
              onClick={closeMobile}
              className="flex items-center gap-3 overflow-hidden group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Stock<span className="text-blue-600">Flow</span>
                    </span>
                    <span className="px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md uppercase border border-blue-200/50 dark:border-blue-800/50">
                      v2.0
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                    {userRole === 'staff' ? 'Warehouse Staff View' : 'Smart Inventory Platform'}
                  </span>
                </div>
              )}
            </NavLink>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items List */}
          <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {/* Dashboard */}
            <NavLink to="/" onClick={closeMobile} className={navItemStyles} end>
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>

            {/* Management Only: Analytics */}
            {isManager && (
              <NavLink to="/analytics" onClick={closeMobile} className={navItemStyles}>
                <BarChart2 className="w-5 h-5 shrink-0 text-purple-500" />
                {!isCollapsed && <span>Analytics</span>}
              </NavLink>
            )}

            {/* Management Only: Smart Reorder */}
            {isManager && (
              <NavLink to="/reorder" onClick={closeMobile} className={navItemStyles}>
                <ShoppingCart className="w-5 h-5 shrink-0 text-amber-500" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Smart Reorder</span>
                    {kpiMetrics.lowStockCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 animate-pulse">
                        {kpiMetrics.lowStockCount}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            )}

            {/* Products */}
            <NavLink to="/products" onClick={closeMobile} className={navItemStyles}>
              <Package className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>Products</span>
                  {kpiMetrics.lowStockCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
                      {kpiMetrics.lowStockCount}
                    </span>
                  )}
                </div>
              )}
            </NavLink>

            {/* Operations Section */}
            <div className="pt-2">
              {!isCollapsed && (
                <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center justify-between">
                  <span>Operations</span>
                  <button
                    onClick={() => setIsOperationsOpen(!isOperationsOpen)}
                    className="hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOperationsOpen ? '' : '-rotate-90'}`} />
                  </button>
                </div>
              )}

              {(isOperationsOpen || isCollapsed) && (
                <div className="space-y-1 pl-0">
                  <NavLink to="/receipts" onClick={closeMobile} className={navItemStyles}>
                    <ArrowDownToLine className="w-5 h-5 shrink-0 text-emerald-500" />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1">
                        <span>Receipts</span>
                        {kpiMetrics.pendingReceiptsCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                            {kpiMetrics.pendingReceiptsCount}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>

                  <NavLink to="/deliveries" onClick={closeMobile} className={navItemStyles}>
                    <Truck className="w-5 h-5 shrink-0 text-blue-500" />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1">
                        <span>Deliveries</span>
                        {kpiMetrics.pendingDeliveriesCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400">
                            {kpiMetrics.pendingDeliveriesCount}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>

                  <NavLink to="/transfers" onClick={closeMobile} className={navItemStyles}>
                    <ArrowLeftRight className="w-5 h-5 shrink-0 text-purple-500" />
                    {!isCollapsed && <span>Internal Transfers</span>}
                  </NavLink>

                  <NavLink to="/adjustments" onClick={closeMobile} className={navItemStyles}>
                    <SlidersHorizontal className="w-5 h-5 shrink-0 text-amber-500" />
                    {!isCollapsed && <span>Adjustments</span>}
                  </NavLink>

                  <NavLink to="/ledger" onClick={closeMobile} className={navItemStyles}>
                    <History className="w-5 h-5 shrink-0 text-slate-500" />
                    {!isCollapsed && <span>Move History</span>}
                  </NavLink>
                </div>
              )}
            </div>

            {/* Management Section */}
            <div className="pt-2">
              {!isCollapsed && (
                <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {isStaff ? 'System' : 'Management'}
                </div>
              )}

              {/* Management Only: Warehouses */}
              {isManager && (
                <NavLink to="/warehouses" onClick={closeMobile} className={navItemStyles}>
                  <Warehouse className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>Warehouses</span>}
                </NavLink>
              )}

              {/* Common: Alerts */}
              <NavLink to="/alerts" onClick={closeMobile} className={navItemStyles}>
                <Bell className="w-5 h-5 shrink-0 text-rose-500" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Alerts</span>
                    {kpiMetrics.unreadAlertsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                        {kpiMetrics.unreadAlertsCount}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>

              {/* Management Only: Settings */}
              {isManager && (
                <NavLink to="/settings" onClick={closeMobile} className={navItemStyles}>
                  <Settings className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>Settings</span>}
                </NavLink>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Profile Footer & Role Badge */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          {/* Quick Demo Role Switcher Bar */}
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 py-1 bg-slate-200/50 dark:bg-slate-800/60 rounded-lg text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Role:</span>
              <button
                onClick={() => switchRole(userRole === 'manager' ? 'staff' : 'manager')}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Click to toggle between Inventory Manager and Warehouse Staff"
              >
                <span>{userRole === 'manager' ? '👑 Manager' : '📦 Staff'}</span>
                <span className="text-[9px] text-slate-400">(Switch)</span>
              </button>
            </div>
          )}

          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <NavLink
              to="/profile"
              onClick={closeMobile}
              className="flex items-center gap-2.5 min-w-0 p-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex-1"
            >
              <div className="relative shrink-0">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.name || 'User'}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/30"
                />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${userRole === 'staff' ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {user?.fullName || user?.name || 'Anish'}
                  </span>
                  <span className={`text-[10px] font-bold truncate ${userRole === 'staff' ? 'text-cyan-600 dark:text-cyan-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {userRole === 'staff' ? 'Warehouse Staff' : 'Inventory Manager'}
                  </span>
                </div>
              )}
            </NavLink>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

