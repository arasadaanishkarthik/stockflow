import React, { useState, useEffect, useRef } from 'react';
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
  PlusCircle,
  X,
  CornerDownLeft
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { motion, AnimatePresence } from 'framer-motion';

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { products, warehouses, receipts, deliveries } = useInventory();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const lowerQuery = query.toLowerCase().trim();

  // Filtered Results
  const matchedProducts = products.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.sku.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery)
  ).slice(0, 4);

  const matchedWarehouses = warehouses.filter(w =>
    w.name.toLowerCase().includes(lowerQuery) ||
    w.code.toLowerCase().includes(lowerQuery) ||
    w.city.toLowerCase().includes(lowerQuery)
  ).slice(0, 3);

  const pages = [
    { title: 'Dashboard Overview', path: '/', icon: Package, category: 'Navigation' },
    { title: 'Products Catalog', path: '/products', icon: Package, category: 'Navigation' },
    { title: 'Goods Receipts', path: '/receipts', icon: ArrowDownToLine, category: 'Navigation' },
    { title: 'Delivery Orders', path: '/deliveries', icon: Truck, category: 'Navigation' },
    { title: 'Internal Transfers', path: '/transfers', icon: ArrowLeftRight, category: 'Navigation' },
    { title: 'Inventory Adjustments', path: '/adjustments', icon: SlidersHorizontal, category: 'Navigation' },
    { title: 'Move History Ledger', path: '/ledger', icon: History, category: 'Navigation' },
    { title: 'Warehouses & Locations', path: '/warehouses', icon: Warehouse, category: 'Navigation' },
    { title: 'Alerts Center', path: '/alerts', icon: Bell, category: 'Navigation' },
    { title: 'System Settings', path: '/settings', icon: Settings, category: 'Navigation' },
    { title: 'User Profile', path: '/profile', icon: User, category: 'Navigation' }
  ];

  const matchedPages = pages.filter(p =>
    p.title.toLowerCase().includes(lowerQuery)
  ).slice(0, 4);

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, SKU, warehouses, or operations..."
                className="w-full bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-sm"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Body */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-4">
              {/* Products Section */}
              {matchedProducts.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Products
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchedProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelect('/products')}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Package className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mr-2">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {p.sku}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {p.totalStock} {p.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warehouses Section */}
              {matchedWarehouses.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Warehouses
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchedWarehouses.map(w => (
                      <div
                        key={w.id}
                        onClick={() => handleSelect('/warehouses')}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Warehouse className="w-4 h-4 text-cyan-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {w.name} ({w.city})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {w.code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Section */}
              {matchedPages.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Navigation
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchedPages.map((pg, idx) => {
                      const Icon = pg.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelect(pg.path)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {pg.title}
                            </span>
                          </div>
                          <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedProducts.length === 0 && matchedWarehouses.length === 0 && matchedPages.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No matching results found for "{query}".
                </div>
              )}
            </div>

            {/* Footer / Shortcut hints */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Type to search StockFlow</span>
              <div className="flex items-center gap-2">
                <span>Navigate: <kbd className="font-mono bg-white dark:bg-slate-800 border px-1 rounded">↑</kbd><kbd className="font-mono bg-white dark:bg-slate-800 border px-1 rounded">↓</kbd></span>
                <span>Select: <kbd className="font-mono bg-white dark:bg-slate-800 border px-1 rounded">↵</kbd></span>
                <span>Exit: <kbd className="font-mono bg-white dark:bg-slate-800 border px-1 rounded">ESC</kbd></span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
