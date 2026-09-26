import React, { useState, useMemo, useCallback } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { formatCurrency } from '../../utils/formatters';
import {
  ShoppingCart, AlertTriangle, AlertCircle, Package,
  Search, Filter, X, ChevronUp, ChevronDown, ChevronsUpDown,
  ArrowDownToLine, Info, Sparkles, Settings2, CheckCircle2,
  RefreshCw, ExternalLink, Warehouse
} from 'lucide-react';

// ─── Reorder Calculation ─────────────────────────────────────────────────────
//
//  Rules (transparent & explainable):
//    targetStockLevel  = minReorderPoint × 2   (2× buffer — industry standard minimum)
//    suggestedQty      = targetStockLevel - currentStock
//    needsReorder      = currentStock <= minReorderPoint  AND  minReorderPoint > 0
//    noRule            = minReorderPoint === 0 (not configured)
//
//  Priority score for sorting (lower = more urgent):
//    0 = Out of Stock
//    1 = Critical (< half of reorder level)
//    2 = Low Stock / needs reorder
//    3 = In Stock but close (within 20% above reorder level)
//    4 = Healthy

const calcReorder = (product) => {
  const current = Number(product.totalStock || 0);
  const reorderLevel = Number(product.minReorderPoint || 0);
  const noRule = reorderLevel === 0;

  if (noRule) {
    return {
      current, reorderLevel, noRule: true,
      targetStock: null, suggestedQty: null,
      needsReorder: false, urgencyScore: 4,
      explanation: 'Reorder rule not configured — set a minimum reorder level to enable recommendations.',
      recommendation: null,
      reorderValue: null
    };
  }

  const targetStock = reorderLevel * 2;
  const suggestedQty = Math.max(0, targetStock - current);
  const needsReorder = current <= reorderLevel;
  const pctOfReorder = reorderLevel > 0 ? current / reorderLevel : 1;

  let urgencyScore = 4;
  if (current <= 0) urgencyScore = 0;
  else if (current < reorderLevel * 0.5) urgencyScore = 1;
  else if (current <= reorderLevel) urgencyScore = 2;
  else if (current <= reorderLevel * 1.2) urgencyScore = 3;

  let explanation = '';
  if (current <= 0) {
    explanation = `Out of stock. All ${reorderLevel} units of reorder level exceeded. Suggested ${suggestedQty} ${product.unit} to reach target of ${targetStock}.`;
  } else if (current <= reorderLevel) {
    explanation = `Current stock ${current} ${product.unit} is at or below reorder level of ${reorderLevel}. Replenishment of ${suggestedQty} ${product.unit} recommended to reach target level of ${targetStock}.`;
  } else if (current <= reorderLevel * 1.2) {
    explanation = `Stock ${current} ${product.unit} is within 20% of reorder level (${reorderLevel}). Consider proactive replenishment.`;
  } else {
    explanation = `Stock ${current} ${product.unit} is healthy above reorder level of ${reorderLevel}.`;
  }

  return {
    current, reorderLevel, noRule: false,
    targetStock, suggestedQty,
    needsReorder,
    urgencyScore,
    explanation,
    recommendation: needsReorder
      ? `Replenish ${suggestedQty} ${product.unit} → reaches target of ${targetStock} ${product.unit}`
      : null,
    reorderValue: suggestedQty > 0 ? suggestedQty * Number(product.costPrice || 0) : 0
  };
};

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'urgency',   label: 'Most Urgent First' },
  { value: 'stock_asc', label: 'Lowest Stock First' },
  { value: 'reorder_desc', label: 'Highest Reorder Qty' },
  { value: 'name_asc', label: 'Product Name A–Z' },
];

// ─── Configure Reorder Modal ─────────────────────────────────────────────────
const ConfigureReorderModal = ({ isOpen, onClose, product, onSave }) => {
  const [form, setForm] = useState({
    minReorderPoint: product?.minReorderPoint || 0,
  });
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (product) {
      setForm({ minReorderPoint: product.minReorderPoint || 0 });
      setError('');
    }
  }, [product]);

  const handleSave = () => {
    const val = Number(form.minReorderPoint);
    if (isNaN(val) || val < 0) {
      setError('Reorder level must be a non-negative number.');
      return;
    }
    onSave(product.id, { minReorderPoint: val });
    onClose();
  };

  if (!product) return null;

  const preview = calcReorder({ ...product, minReorderPoint: Number(form.minReorderPoint) || 0 });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Reorder Rule — ${product.name}`}
      subtitle={`Set the minimum stock level that triggers a reorder recommendation for ${product.sku}.`}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" icon={CheckCircle2} onClick={handleSave}>Save Rule</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Minimum Reorder Level *"
          type="number"
          min="0"
          value={form.minReorderPoint}
          onChange={e => setForm({ minReorderPoint: e.target.value })}
          error={error}
          hint={`Current stock: ${product.totalStock} ${product.unit}. When stock drops to this level, a reorder is triggered.`}
        />

        {/* Live preview */}
        {Number(form.minReorderPoint) > 0 && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-semibold">Preview:</p>
            <p>Reorder level: <strong>{form.minReorderPoint} {product.unit}</strong></p>
            <p>Target stock (2×): <strong>{Number(form.minReorderPoint) * 2} {product.unit}</strong></p>
            <p>Suggested reorder qty: <strong>{preview.suggestedQty} {product.unit}</strong></p>
            <p className={preview.needsReorder ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400'}>
              {preview.needsReorder ? '⚠ Reorder needed now' : '✓ Currently in stock'}
            </p>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <p><strong>Calculation method:</strong></p>
          <p className="mt-1">Target Stock = Reorder Level × 2</p>
          <p>Suggested Qty = Target Stock − Current Stock</p>
        </div>
      </div>
    </Modal>
  );
};

// ─── Urgency badge ────────────────────────────────────────────────────────────
const UrgencyBadge = ({ score }) => {
  if (score === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />CRITICAL</span>;
  if (score === 1) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />REORDER NOW</span>;
  if (score === 2) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />REORDER</span>;
  if (score === 3) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />WATCH</span>;
  return null;
};

// ─── Sortable column header ───────────────────────────────────────────────────
const SortHeader = ({ label, sortKey, currentSort, onSort }) => {
  const active = currentSort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none whitespace-nowrap"
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? (currentSort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </div>
    </th>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export const SmartReorderPage = () => {
  const { products, warehouses, categories, updateProduct } = useInventory();
  const navigate = useNavigate();

  const [search, setSearch]             = useState('');
  const [filterWH, setFilterWH]         = useState('All');
  const [filterCat, setFilterCat]       = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sort, setSort]                 = useState({ key: 'urgency', dir: 'asc' });
  const [configProduct, setConfigProduct] = useState(null);

  // Sort handler — toggle direction if same key
  const handleSort = useCallback((key) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    );
  }, []);

  // Build enriched rows
  const rows = useMemo(() => {
    return products.map(p => ({
      ...p,
      ...calcReorder(p),
      // The "primary" warehouse is the one with the highest stock
      primaryWarehouse: Object.entries(p.stockByWarehouse || {})
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
    }));
  }, [products]);

  // Summary KPIs
  const summary = useMemo(() => {
    const needsReorder   = rows.filter(r => r.needsReorder).length;
    const outOfStock     = rows.filter(r => r.current <= 0).length;
    const critical       = rows.filter(r => r.urgencyScore <= 1).length;
    const totalSuggestedQty = rows.filter(r => r.needsReorder)
      .reduce((s, r) => s + (r.suggestedQty || 0), 0);
    const totalReorderValue  = rows.filter(r => r.needsReorder)
      .reduce((s, r) => s + (r.reorderValue || 0), 0);
    const noRule = rows.filter(r => r.noRule).length;
    return { needsReorder, outOfStock, critical, totalSuggestedQty, totalReorderValue, noRule };
  }, [rows]);

  // Filter + Search + Sort
  const filtered = useMemo(() => {
    let result = rows;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q)
      );
    }
    if (filterWH !== 'All') {
      result = result.filter(r => (r.stockByWarehouse?.[filterWH] || 0) > 0 || r.primaryWarehouse === filterWH);
    }
    if (filterCat !== 'All') {
      result = result.filter(r => r.category === filterCat);
    }
    if (filterStatus !== 'All') {
      if (filterStatus === 'needs_reorder') result = result.filter(r => r.needsReorder);
      else if (filterStatus === 'out_of_stock') result = result.filter(r => r.current <= 0);
      else if (filterStatus === 'critical') result = result.filter(r => r.urgencyScore <= 1);
      else if (filterStatus === 'in_stock') result = result.filter(r => r.urgencyScore >= 3);
      else if (filterStatus === 'no_rule') result = result.filter(r => r.noRule);
    }

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      switch (sort.key) {
        case 'urgency':     return (a.urgencyScore - b.urgencyScore) * dir;
        case 'stock_asc':   return (a.current - b.current) * dir;
        case 'reorder_desc':return ((b.suggestedQty || 0) - (a.suggestedQty || 0)) * dir;
        case 'name':        return a.name.localeCompare(b.name) * dir;
        default:            return 0;
      }
    });

    return result;
  }, [rows, search, filterWH, filterCat, filterStatus, sort]);

  const hasFilters = search || filterWH !== 'All' || filterCat !== 'All' || filterStatus !== 'All';

  const resetFilters = () => {
    setSearch(''); setFilterWH('All'); setFilterCat('All'); setFilterStatus('All');
  };

  const handleSaveReorderRule = useCallback((productId, fields) => {
    updateProduct(productId, fields);
  }, [updateProduct]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            Smart Reorder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI-assisted replenishment recommendations based on live inventory levels.
            Updates automatically after every transaction.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={ArrowDownToLine}
          onClick={() => navigate('/receipts?action=new')}
        >
          Create Receipt
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Needs Reorder */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${summary.needsReorder > 0 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${summary.needsReorder > 0 ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-emerald-100 dark:bg-emerald-900/50'}`}>
            {summary.needsReorder > 0
              ? <AlertTriangle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
              : <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            }
          </div>
          <div>
            <p className={`text-2xl font-extrabold ${summary.needsReorder > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{summary.needsReorder}</p>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${summary.needsReorder > 0 ? 'text-amber-600/80 dark:text-amber-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
              {summary.needsReorder > 0 ? 'Need Reorder' : 'All Stocked'}
            </p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${summary.outOfStock > 0 ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${summary.outOfStock > 0 ? 'bg-rose-100 dark:bg-rose-900/50' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <AlertCircle className={`w-4.5 h-4.5 ${summary.outOfStock > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className={`text-2xl font-extrabold ${summary.outOfStock > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400'}`}>{summary.outOfStock}</p>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${summary.outOfStock > 0 ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-slate-500'}`}>Out of Stock</p>
          </div>
        </div>

        {/* Total Suggested Qty */}
        <div className="p-4 rounded-2xl border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
            <Package className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{summary.totalSuggestedQty.toLocaleString()}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600/80 dark:text-blue-400/80">Units to Order</p>
          </div>
        </div>

        {/* Estimated Reorder Value */}
        <div className="p-4 rounded-2xl border bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-base font-extrabold text-purple-700 dark:text-purple-300 leading-tight">{formatCurrency(summary.totalReorderValue)}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-600/80 dark:text-purple-400/80">Est. Reorder Cost</p>
          </div>
        </div>

        {/* No Rule */}
        <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Settings2 className="w-4.5 h-4.5 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-600 dark:text-slate-400">{summary.noRule}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">No Rule Set</p>
          </div>
        </div>
      </div>

      {/* ── Calculation methodology note ──────────────────────────────────── */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">How recommendations are calculated:</strong>
          <span className="ml-1">
            Target Stock Level = Reorder Level × 2.
            Suggested Reorder Qty = Target Stock − Current Stock.
            Triggered when Current Stock ≤ Reorder Level.
            Estimated Cost = Suggested Qty × Cost Price.
          </span>
        </div>
      </div>

      {/* ── Filters & Search ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          {/* Warehouse */}
          <select
            value={filterWH}
            onChange={e => setFilterWH(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>

          {/* Category */}
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="critical">Critical / Out of Stock</option>
            <option value="needs_reorder">Needs Reorder</option>
            <option value="in_stock">In Stock</option>
            <option value="no_rule">No Rule Configured</option>
          </select>

          {/* Sort */}
          <select
            value={sort.key}
            onChange={e => setSort({ key: e.target.value, dir: 'asc' })}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5">
          Showing <strong className="text-slate-600 dark:text-slate-400">{filtered.length}</strong> of {products.length} products
          {summary.needsReorder > 0 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
              · {summary.needsReorder} need reorder action
            </span>
          )}
        </p>
      </div>

      {/* ── Recommendation Table ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No products match your filters</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting the search or filter criteria</p>
            </div>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={resetFilters}>Reset Filters</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <SortHeader label="Product / SKU" sortKey="name" currentSort={sort} onSort={handleSort} />
                  <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                  <SortHeader label="Current Stock" sortKey="stock_asc" currentSort={sort} onSort={handleSort} />
                  <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Reorder Level</th>
                  <SortHeader label="Suggested Qty" sortKey="reorder_desc" currentSort={sort} onSort={handleSort} />
                  <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Cost</th>
                  <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <SortHeader label="Urgency" sortKey="urgency" currentSort={sort} onSort={handleSort} />
                  <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {filtered.map(row => {
                  const isUrgent = row.urgencyScore <= 1;
                  const isReorder = row.urgencyScore === 2;
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${isUrgent ? 'bg-rose-50/30 dark:bg-rose-950/10' : isReorder ? 'bg-amber-50/30 dark:bg-amber-950/10' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/20'}`}
                    >
                      {/* Product */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isUrgent ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600' : isReorder ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {row.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[160px] truncate">{row.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{row.sku}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">{row.category}</span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-2">
                        <div>
                          <span className={`text-xs font-bold font-mono ${row.current <= 0 ? 'text-rose-600 dark:text-rose-400' : row.needsReorder ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {row.current.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">{row.unit}</span>
                        </div>
                        {/* Mini stock bar */}
                        {!row.noRule && row.reorderLevel > 0 && (
                          <div className="mt-1 w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                            <div
                              className={`h-full rounded-full transition-all ${row.current <= 0 ? 'bg-rose-500' : row.needsReorder ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, (row.current / (row.reorderLevel * 2)) * 100)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Reorder Level */}
                      <td className="py-3 px-2">
                        {row.noRule ? (
                          <span className="text-[10px] italic text-slate-400">Not configured</span>
                        ) : (
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                            {row.reorderLevel.toLocaleString()} {row.unit}
                          </span>
                        )}
                      </td>

                      {/* Suggested Qty */}
                      <td className="py-3 px-2">
                        {row.noRule ? (
                          <span className="text-[10px] italic text-slate-400">—</span>
                        ) : row.suggestedQty > 0 ? (
                          <div>
                            <span className={`text-xs font-bold font-mono ${isUrgent ? 'text-rose-600 dark:text-rose-400' : isReorder ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                              +{row.suggestedQty.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">{row.unit}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Sufficient</span>
                        )}
                      </td>

                      {/* Estimated Cost */}
                      <td className="py-3 px-2">
                        {row.reorderValue > 0 ? (
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 font-mono">
                            {formatCurrency(row.reorderValue)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="py-3 px-2">
                        <StatusBadge status={row.status} size="xs" />
                      </td>

                      {/* Urgency */}
                      <td className="py-3 px-2">
                        <UrgencyBadge score={row.urgencyScore} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          {row.needsReorder && (
                            <button
                              onClick={() => navigate('/receipts?action=new')}
                              title="Create Reorder Receipt"
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 transition-colors"
                            >
                              <ArrowDownToLine className="w-3 h-3" /> Reorder
                            </button>
                          )}
                          <button
                            onClick={() => setConfigProduct(row)}
                            title="Configure Reorder Rule"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate('/products')}
                            title="View in Products"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Explanation panel (for selected/hovered product) ─────────────── */}
      {filtered.some(r => r.needsReorder) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Reorder Explanations
          </h3>
          <div className="space-y-2">
            {filtered.filter(r => r.needsReorder).slice(0, 5).map(r => (
              <div key={r.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs border ${r.urgencyScore <= 1 ? 'border-rose-200/80 dark:border-rose-800/50 bg-rose-50/60 dark:bg-rose-950/20' : 'border-amber-200/80 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${r.urgencyScore <= 1 ? 'bg-rose-200 dark:bg-rose-800' : 'bg-amber-200 dark:bg-amber-800'}`}>
                  <AlertTriangle className={`w-3 h-3 ${r.urgencyScore <= 1 ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{r.name} <span className="font-mono font-normal text-slate-400 text-[10px]">({r.sku})</span></p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{r.explanation}</p>
                </div>
              </div>
            ))}
            {filtered.filter(r => r.needsReorder).length > 5 && (
              <p className="text-[11px] text-slate-400 text-center pt-1">
                +{filtered.filter(r => r.needsReorder).length - 5} more products need reorder action
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Configure Reorder Modal ───────────────────────────────────────── */}
      <ConfigureReorderModal
        isOpen={!!configProduct}
        onClose={() => setConfigProduct(null)}
        product={configProduct}
        onSave={handleSaveReorderRule}
      />
    </div>
  );
};
