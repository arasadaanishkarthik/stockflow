import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  SlidersHorizontal,
  Warehouse,
  History,
  Bell,
  Settings,
  User,
  X,
  CornerDownLeft,
  Clock,
  ChevronRight,
  Hash,
  Tag,
  MapPin
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ─────────────────────────────────────────────────────────────────
const MAX_RECENT = 6;
const RECENT_KEY = 'stockflow_recent_searches';

const NAV_PAGES = [
  { title: 'Dashboard Overview', path: '/', icon: Package, hint: 'Dashboard' },
  { title: 'Products Catalog', path: '/products', icon: Package, hint: 'All SKUs' },
  { title: 'Goods Receipts', path: '/receipts', icon: ArrowDownToLine, hint: 'Inbound POs' },
  { title: 'Delivery Orders', path: '/deliveries', icon: Truck, hint: 'Outbound' },
  { title: 'Internal Transfers', path: '/transfers', icon: ArrowLeftRight, hint: 'Cross-dock' },
  { title: 'Inventory Adjustments', path: '/adjustments', icon: SlidersHorizontal, hint: 'Counts' },
  { title: 'Move History Ledger', path: '/ledger', icon: History, hint: 'Audit trail' },
  { title: 'Warehouses & Locations', path: '/warehouses', icon: Warehouse, hint: 'Facilities' },
  { title: 'Alerts Center', path: '/alerts', icon: Bell, hint: 'Notifications' },
  { title: 'System Settings', path: '/settings', icon: Settings, hint: 'Config' },
  { title: 'User Profile', path: '/profile', icon: User, hint: 'Account' }
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const hi = (text, query) => {
  if (!query || !text) return text;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {String(text).slice(0, idx)}
      <mark className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded px-0.5">
        {String(text).slice(idx, idx + query.length)}
      </mark>
      {String(text).slice(idx + query.length)}
    </>
  );
};

const statusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (['done', 'completed', 'in stock', 'active', 'applied'].includes(s))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50';
  if (['draft', 'waiting', 'pending', 'picking'].includes(s))
    return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50';
  if (['out of stock', 'critical', 'low stock', 'canceled', 'cancelled'].includes(s))
    return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50';
  return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
};

// ─── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ label, count }) => (
  <div className="flex items-center justify-between px-3 pt-3 pb-1">
    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
      {label}
    </span>
    {count !== undefined && (
      <span className="text-[10px] text-slate-400 dark:text-slate-500">{count} result{count !== 1 ? 's' : ''}</span>
    )}
  </div>
);

// ─── Result Row ────────────────────────────────────────────────────────────────
const ResultRow = ({ isActive, onClick, icon: Icon, iconColor, children, badge, badgeClass, right }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100 group ${
      isActive
        ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800/60'
        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
    }`}
  >
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-100 dark:bg-blue-900/60' : 'bg-slate-100 dark:bg-slate-800'}`}>
      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
    </div>
    <div className="flex-1 min-w-0">
      {children}
    </div>
    {badge && (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${badgeClass || statusColor(badge)}`}>
        {badge}
      </span>
    )}
    {right && (
      <span className="text-[10px] text-slate-400 shrink-0">{right}</span>
    )}
    <CornerDownLeft className={`w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch { return []; }
  });

  const { products, warehouses, receipts, deliveries, transfers, adjustments, ledger } = useInventory();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const activeRef = useRef(null);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setActiveIdx(0);
    }
  }, [isOpen]);

  // ⌘K global shortcut
  useEffect(() => {
    const handle = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  const q = query.toLowerCase().trim();

  // ── Build grouped results ──────────────────────────────────────────────────
  const results = useMemo(() => {
    const groups = [];

    if (!q) {
      // No query → show recent searches + nav pages
      if (recentSearches.length > 0) {
        groups.push({
          key: 'recent',
          label: 'Recent Searches',
          items: recentSearches.map(r => ({
            id: `recent-${r.query}`,
            type: 'recent',
            label: r.query,
            sub: r.label,
            path: r.path,
            icon: Clock,
            iconColor: 'text-slate-400'
          }))
        });
      }
      groups.push({
        key: 'nav',
        label: 'Quick Navigation',
        items: NAV_PAGES.map(p => ({
          id: `nav-${p.path}`,
          type: 'nav',
          label: p.title,
          sub: p.hint,
          path: p.path,
          icon: p.icon,
          iconColor: 'text-slate-500 dark:text-slate-400'
        }))
      });
      return groups;
    }

    // ── Products ──────────────────────────────────────────────────────────────
    const matchedProducts = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    ).slice(0, 5);

    if (matchedProducts.length > 0) {
      groups.push({
        key: 'products',
        label: 'Products',
        count: matchedProducts.length,
        items: matchedProducts.map(p => ({
          id: p.id,
          type: 'product',
          label: p.name,
          sub: p.sku,
          meta: p.category,
          stock: `${p.totalStock} ${p.unit}`,
          badge: p.status,
          path: '/products',
          searchPayload: { query: p.name, label: p.name, path: '/products' },
          icon: Package,
          iconColor: 'text-blue-500'
        }))
      });
    }

    // ── Warehouses ────────────────────────────────────────────────────────────
    const matchedWarehouses = warehouses.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.code.toLowerCase().includes(q) ||
      w.city.toLowerCase().includes(q) ||
      w.type?.toLowerCase().includes(q) ||
      w.manager?.toLowerCase().includes(q)
    ).slice(0, 3);

    if (matchedWarehouses.length > 0) {
      groups.push({
        key: 'warehouses',
        label: 'Warehouses',
        count: matchedWarehouses.length,
        items: matchedWarehouses.map(w => ({
          id: w.id,
          type: 'warehouse',
          label: w.name,
          sub: w.city,
          meta: w.code,
          badge: w.status,
          path: '/warehouses',
          searchPayload: { query: w.name, label: w.name, path: '/warehouses' },
          icon: Warehouse,
          iconColor: 'text-cyan-500'
        }))
      });
    }

    // ── Receipts ──────────────────────────────────────────────────────────────
    const matchedReceipts = receipts.filter(r =>
      r.receiptNumber?.toLowerCase().includes(q) ||
      r.supplier?.toLowerCase().includes(q) ||
      r.warehouseName?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q) ||
      r.items?.some(i => i.productName?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q))
    ).slice(0, 3);

    // ── Deliveries ────────────────────────────────────────────────────────────
    const matchedDeliveries = deliveries.filter(d =>
      d.deliveryId?.toLowerCase().includes(q) ||
      d.customer?.toLowerCase().includes(q) ||
      d.warehouseName?.toLowerCase().includes(q) ||
      d.status?.toLowerCase().includes(q) ||
      d.trackingNumber?.toLowerCase().includes(q) ||
      d.items?.some(i => i.productName?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q))
    ).slice(0, 3);

    // ── Transfers ─────────────────────────────────────────────────────────────
    const matchedTransfers = transfers.filter(t =>
      t.transferNumber?.toLowerCase().includes(q) ||
      t.productName?.toLowerCase().includes(q) ||
      t.sku?.toLowerCase().includes(q) ||
      t.fromWarehouseName?.toLowerCase().includes(q) ||
      t.toWarehouseName?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q)
    ).slice(0, 3);

    // ── Adjustments ───────────────────────────────────────────────────────────
    const matchedAdjustments = adjustments.filter(a =>
      a.adjustmentNumber?.toLowerCase().includes(q) ||
      a.productName?.toLowerCase().includes(q) ||
      a.sku?.toLowerCase().includes(q) ||
      a.warehouseName?.toLowerCase().includes(q) ||
      a.reason?.toLowerCase().includes(q)
    ).slice(0, 2);

    // ── Ledger entries ────────────────────────────────────────────────────────
    const matchedLedger = ledger.filter(l =>
      l.productName?.toLowerCase().includes(q) ||
      l.sku?.toLowerCase().includes(q) ||
      l.operation?.toLowerCase().includes(q) ||
      l.reference?.toLowerCase().includes(q) ||
      l.from?.toLowerCase().includes(q) ||
      l.to?.toLowerCase().includes(q)
    ).slice(0, 3);

    // Build operations group
    const opItems = [];
    matchedReceipts.forEach(r => opItems.push({
      id: r.id,
      type: 'receipt',
      label: r.receiptNumber,
      sub: r.supplier,
      meta: r.warehouseName,
      badge: r.status,
      right: r.date?.slice(0, 10),
      path: '/receipts',
      searchPayload: { query: r.receiptNumber, label: `Receipt ${r.receiptNumber}`, path: '/receipts' },
      icon: ArrowDownToLine,
      iconColor: 'text-emerald-500'
    }));
    matchedDeliveries.forEach(d => opItems.push({
      id: d.id,
      type: 'delivery',
      label: d.deliveryId,
      sub: d.customer,
      meta: d.warehouseName,
      badge: d.status,
      right: d.date?.slice(0, 10),
      path: '/deliveries',
      searchPayload: { query: d.deliveryId, label: `Delivery ${d.deliveryId}`, path: '/deliveries' },
      icon: Truck,
      iconColor: 'text-blue-500'
    }));
    matchedTransfers.forEach(t => opItems.push({
      id: t.id,
      type: 'transfer',
      label: t.transferNumber,
      sub: t.productName,
      meta: `${t.fromWarehouseName} → ${t.toWarehouseName}`,
      badge: t.status,
      right: `${t.qty} ${t.unit}`,
      path: '/transfers',
      searchPayload: { query: t.transferNumber, label: `Transfer ${t.transferNumber}`, path: '/transfers' },
      icon: ArrowLeftRight,
      iconColor: 'text-purple-500'
    }));
    matchedAdjustments.forEach(a => opItems.push({
      id: a.id,
      type: 'adjustment',
      label: a.adjustmentNumber,
      sub: a.productName,
      meta: a.warehouseName,
      badge: a.status,
      right: `${a.difference >= 0 ? '+' : ''}${a.difference} ${a.unit}`,
      path: '/adjustments',
      searchPayload: { query: a.adjustmentNumber, label: `Adjustment ${a.adjustmentNumber}`, path: '/adjustments' },
      icon: SlidersHorizontal,
      iconColor: 'text-amber-500'
    }));
    matchedLedger.forEach(l => opItems.push({
      id: l.id,
      type: 'ledger',
      label: l.reference || l.operation,
      sub: l.productName,
      meta: `${l.from} → ${l.to}`,
      badge: l.status,
      right: `${l.quantity >= 0 ? '+' : ''}${l.quantity} ${l.unit}`,
      path: '/ledger',
      searchPayload: { query: l.reference || l.productName, label: `Ledger: ${l.productName}`, path: '/ledger' },
      icon: History,
      iconColor: 'text-slate-500'
    }));

    if (opItems.length > 0) {
      groups.push({
        key: 'operations',
        label: 'Operations',
        count: opItems.length,
        items: opItems.slice(0, 8)
      });
    }

    // ── Navigation pages ──────────────────────────────────────────────────────
    const matchedNav = NAV_PAGES.filter(p =>
      p.title.toLowerCase().includes(q) || p.hint.toLowerCase().includes(q)
    ).slice(0, 3);

    if (matchedNav.length > 0) {
      groups.push({
        key: 'nav',
        label: 'Navigation',
        items: matchedNav.map(p => ({
          id: `nav-${p.path}`,
          type: 'nav',
          label: p.title,
          sub: p.hint,
          path: p.path,
          searchPayload: { query: p.title, label: p.title, path: p.path },
          icon: p.icon,
          iconColor: 'text-slate-500 dark:text-slate-400'
        }))
      });
    }

    return groups;
  }, [q, products, warehouses, receipts, deliveries, transfers, adjustments, ledger, recentSearches]);

  // Flat list of all items for keyboard nav
  const flatItems = useMemo(() =>
    results.flatMap(g => g.items),
    [results]
  );

  const totalCount = flatItems.length;

  // Clamp activeIdx
  useEffect(() => {
    setActiveIdx(prev => Math.min(prev, Math.max(0, totalCount - 1)));
  }, [totalCount]);

  // Scroll active item into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIdx]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(prev => Math.min(prev + 1, totalCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[activeIdx]) {
        handleSelect(flatItems[activeIdx]);
      }
    }
  }, [activeIdx, flatItems, totalCount]);

  // Save to recent
  const saveRecent = useCallback((item) => {
    if (!item.searchPayload) return;
    const { query: rq, label, path } = item.searchPayload;
    setRecentSearches(prev => {
      const filtered = prev.filter(r => r.query !== rq);
      const next = [{ query: rq, label, path }, ...filtered].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const handleSelect = useCallback((item) => {
    saveRecent(item);
    navigate(item.path);
    onClose();
  }, [navigate, onClose, saveRecent]);

  const clearRecent = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  };

  const removeRecentItem = (e, query) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const next = prev.filter(r => r.query !== query);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Flat index tracker across groups
  let globalIdx = 0;

  const hasResults = flatItems.length > 0;
  const showEmpty = q.length > 0 && !hasResults;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Palette Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden z-10 flex flex-col"
            style={{ maxHeight: 'min(580px, calc(100vh - 120px))' }}
          >
            {/* ── Search Input ──────────────────────────────────────────────── */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3 shrink-0">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search everything... products, SKU, receipts, warehouses"
                className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setActiveIdx(0); inputRef.current?.focus(); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Results Body ──────────────────────────────────────────────── */}
            <div ref={listRef} className="overflow-y-auto flex-1 p-2 pb-3">

              {/* Empty state */}
              {showEmpty && (
                <div className="py-12 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No results for "{query}"</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching a product name, SKU, receipt number, or warehouse</p>
                  </div>
                </div>
              )}

              {/* Result groups */}
              {results.map((group) => {
                // Recent group header with clear all
                const isRecentGroup = group.key === 'recent';

                return (
                  <div key={group.key} className="mb-1">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {group.label}
                        {group.count !== undefined && (
                          <span className="ml-1.5 font-normal normal-case tracking-normal">{group.count} result{group.count !== 1 ? 's' : ''}</span>
                        )}
                      </span>
                      {isRecentGroup && (
                        <button
                          onClick={clearRecent}
                          className="text-[10px] text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const myIdx = globalIdx++;
                        const isActive = myIdx === activeIdx;

                        // Recent search item
                        if (item.type === 'recent') {
                          return (
                            <div
                              key={item.id}
                              ref={isActive ? activeRef : null}
                              onClick={() => handleSelect(item)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-100 group ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800/60'
                                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-100 dark:bg-blue-900/60' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{item.label}</p>
                                <p className="text-[10px] text-slate-400 truncate">{item.sub}</p>
                              </div>
                              <button
                                onClick={(e) => removeRecentItem(e, item.label)}
                                className="p-1 rounded text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <CornerDownLeft className={`w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                            </div>
                          );
                        }

                        // Nav item
                        if (item.type === 'nav') {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.id}
                              ref={isActive ? activeRef : null}
                              onClick={() => handleSelect(item)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-100 group ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800/60'
                                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-100 dark:bg-blue-900/60' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{hi(item.label, q)}</p>
                                <p className="text-[10px] text-slate-400 truncate">{item.sub}</p>
                              </div>
                              <ChevronRight className={`w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                            </div>
                          );
                        }

                        // Product item
                        if (item.type === 'product') {
                          return (
                            <div
                              key={item.id}
                              ref={isActive ? activeRef : null}
                              onClick={() => handleSelect(item)}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100 group ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800/60'
                                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${isActive ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-500'}`}>
                                {item.label.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{hi(item.label, q)}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-mono text-slate-400">{hi(item.sub, q)}</span>
                                  <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                                  <span className="text-[10px] text-slate-400">{hi(item.meta, q)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">{item.stock}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(item.badge)}`}>
                                  {item.badge}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        // Warehouse item
                        if (item.type === 'warehouse') {
                          return (
                            <div
                              key={item.id}
                              ref={isActive ? activeRef : null}
                              onClick={() => handleSelect(item)}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100 group ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800/60'
                                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-cyan-100 dark:bg-cyan-900/40' : 'bg-cyan-50 dark:bg-cyan-950/30'}`}>
                                <Warehouse className="w-4 h-4 text-cyan-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{hi(item.label, q)}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5 text-slate-300" />
                                  <span className="text-[10px] text-slate-400">{hi(item.sub, q)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono text-slate-400">{item.meta}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(item.badge)}`}>
                                  {item.badge}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        // Operations items (receipt, delivery, transfer, adjustment, ledger)
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.id}
                            ref={isActive ? activeRef : null}
                            onClick={() => handleSelect(item)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100 group ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800/60'
                                : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800'}`}>
                              <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono truncate">{hi(item.label, q)}</p>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {hi(item.sub, q)}
                                {item.meta && <span className="text-slate-300 dark:text-slate-600"> • {item.meta}</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {item.right && (
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{item.right}</span>
                              )}
                              {item.badge && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(item.badge)}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span className="hidden sm:inline">
                {q ? `${flatItems.length} result${flatItems.length !== 1 ? 's' : ''} for "${q}"` : 'Type to search StockFlow'}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  Navigate:
                  <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded text-slate-500">↑</kbd>
                  <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded text-slate-500">↓</kbd>
                </span>
                <span className="flex items-center gap-1">
                  Select: <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded text-slate-500">↵</kbd>
                </span>
                <span className="flex items-center gap-1">
                  Close: <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded text-slate-500">ESC</kbd>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
