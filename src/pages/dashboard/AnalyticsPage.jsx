import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Package, Warehouse, TrendingUp, TrendingDown,
  AlertTriangle, AlertCircle, DollarSign, Activity,
  ArrowDownToLine, Truck, ArrowLeftRight, SlidersHorizontal,
  BarChart2, Filter, X, RefreshCw, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Color palettes ───────────────────────────────────────────────────────────
const CAT_COLORS = {
  'Raw Materials':   '#2563EB',
  'Electronics':     '#8B5CF6',
  'Furniture':       '#06B6D4',
  'Office Supplies': '#F59E0B',
  'Finished Goods':  '#10B981',
};
const WH_COLORS  = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444'];
const STATUS_COLORS = {
  'In Stock':    '#10B981',
  'Low Stock':   '#F59E0B',
  'Critical':    '#EF4444',
  'Out of Stock':'#64748B',
};

// ─── Tiny reusable components ────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle, iconColor = 'text-blue-500' }) => (
  <div className="flex items-start gap-2.5 mb-5">
    <div className={`w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 ${iconColor}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const EmptyChart = ({ message = 'No data available' }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 dark:text-slate-500">
    <BarChart2 className="w-8 h-8" />
    <p className="text-xs font-medium">{message}</p>
  </div>
);

const KpiTile = ({ title, value, sub, icon: Icon, color, onClick }) => {
  const colorMap = {
    blue:    { bg: 'bg-blue-50 dark:bg-blue-950/40',    text: 'text-blue-600 dark:text-blue-400',    val: 'text-blue-700 dark:text-blue-300' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', val: 'text-emerald-700 dark:text-emerald-300' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-600 dark:text-amber-400',  val: 'text-amber-700 dark:text-amber-300' },
    rose:    { bg: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-600 dark:text-rose-400',    val: 'text-rose-700 dark:text-rose-300' },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', val: 'text-purple-700 dark:text-purple-300' },
    slate:   { bg: 'bg-slate-100 dark:bg-slate-800',    text: 'text-slate-500 dark:text-slate-400',  val: 'text-slate-700 dark:text-slate-300' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3.5 shadow-2xs ${onClick ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700/60 transition-colors' : ''}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
        <Icon className={`w-5 h-5 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">{title}</p>
        <p className={`text-xl font-extrabold tracking-tight mt-0.5 ${c.val}`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
};

// Custom tooltips
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span style={{ color: p.fill || p.color }} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill || p.color }} />
            {p.name}:
          </span>
          <span className="font-bold font-mono">{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.payload.color || d.fill }} />
        {d.name}
      </p>
      <p className="text-slate-500 mt-1">Units: <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{d.value?.toLocaleString()}</span></p>
      <p className="text-slate-400">Share: <span className="font-semibold">{d.payload.pct}%</span></p>
    </div>
  );
};

// ─── Filter bar ──────────────────────────────────────────────────────────────
const FilterBar = ({ warehouses, categories, products, filters, onChange }) => {
  const hasActive = filters.warehouse !== 'All' || filters.category !== 'All' || filters.product !== 'All';
  return (
    <div className="flex flex-wrap items-center gap-2.5 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <Filter className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Filter:</span>

      {/* Warehouse */}
      <select
        value={filters.warehouse}
        onChange={e => onChange({ ...filters, warehouse: e.target.value })}
        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
      >
        <option value="All">All Warehouses</option>
        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>

      {/* Category */}
      <select
        value={filters.category}
        onChange={e => onChange({ ...filters, category: e.target.value })}
        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
      >
        <option value="All">All Categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Product */}
      <select
        value={filters.product}
        onChange={e => onChange({ ...filters, product: e.target.value })}
        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer max-w-[180px]"
      >
        <option value="All">All Products</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {hasActive && (
        <button
          onClick={() => onChange({ warehouse: 'All', category: 'All', product: 'All' })}
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          <X className="w-3 h-3" /> Reset
        </button>
      )}
    </div>
  );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export const AnalyticsPage = () => {
  const {
    products, warehouses, categories,
    receipts, deliveries, transfers, adjustments, ledger
  } = useInventory();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ warehouse: 'All', category: 'All', product: 'All' });

  // ── Apply filters ──────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (filters.warehouse !== 'All' && !(p.stockByWarehouse?.[filters.warehouse] > 0)) return false;
      if (filters.category !== 'All' && p.category !== filters.category) return false;
      if (filters.product !== 'All' && p.id !== filters.product) return false;
      return true;
    });
  }, [products, filters]);

  // ── KPI Calculations ────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalStock = filteredProducts.reduce((s, p) => s + Number(p.totalStock || 0), 0);
    const totalValue = filteredProducts.reduce((s, p) => s + (Number(p.totalStock || 0) * Number(p.costPrice || 0)), 0);
    const lowStock   = filteredProducts.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length;
    const outOfStock = filteredProducts.filter(p => p.status === 'Out of Stock' || p.totalStock <= 0).length;
    const inStock    = filteredProducts.filter(p => p.status === 'In Stock').length;
    const totalReceivedQty  = receipts.filter(r => r.status === 'Done')
      .reduce((s, r) => s + r.items.reduce((a, i) => a + Number(i.qty || 0), 0), 0);
    const totalDeliveredQty = deliveries.filter(d => d.status === 'Done')
      .reduce((s, d) => s + d.items.reduce((a, i) => a + Number(i.qty || 0), 0), 0);
    return { totalStock, totalValue, lowStock, outOfStock, inStock, totalReceivedQty, totalDeliveredQty };
  }, [filteredProducts, receipts, deliveries]);

  // ── Category Distribution ───────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const map = {};
    filteredProducts.forEach(p => {
      const cat = p.category || 'Other';
      map[cat] = (map[cat] || 0) + Number(p.totalStock || 0);
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map).map(([name, value]) => ({
      name, value,
      pct: Math.round((value / total) * 100),
      color: CAT_COLORS[name] || '#64748B'
    })).sort((a, b) => b.value - a.value);
  }, [filteredProducts]);

  // ── Warehouse stock distribution ────────────────────────────────────────────
  const warehouseData = useMemo(() => {
    const whFilter = filters.warehouse !== 'All' ? [filters.warehouse] : warehouses.map(w => w.id);
    return warehouses
      .filter(w => whFilter.includes(w.id))
      .map((wh, i) => {
        const stock = filteredProducts.reduce((s, p) => s + Number(p.stockByWarehouse?.[wh.id] || 0), 0);
        const capacity = wh.capacity || null;
        const utilPct = capacity ? Math.min(100, Math.round((stock / capacity) * 100)) : null;
        return { name: wh.name.split(' ').slice(0, 2).join(' '), fullName: wh.name, stock, capacity, utilPct, color: WH_COLORS[i % WH_COLORS.length] };
      })
      .filter(w => w.stock > 0 || filters.warehouse !== 'All');
  }, [filteredProducts, warehouses, filters.warehouse]);

  // ── Receipts vs Deliveries (by warehouse, actual validated operations) ──────
  const inOutData = useMemo(() => {
    const whList = filters.warehouse !== 'All'
      ? warehouses.filter(w => w.id === filters.warehouse)
      : warehouses;
    return whList.map(wh => {
      const incoming = receipts
        .filter(r => r.status === 'Done' && r.warehouseId === wh.id)
        .reduce((s, r) => s + r.items.reduce((a, i) => a + Number(i.qty || 0), 0), 0);
      const outgoing = deliveries
        .filter(d => d.status === 'Done' && d.warehouseId === wh.id)
        .reduce((s, d) => s + d.items.reduce((a, i) => a + Number(i.qty || 0), 0), 0);
      const net = incoming - outgoing;
      return { name: wh.name.split(' ').slice(0, 2).join(' '), fullName: wh.name, incoming, outgoing, net };
    }).filter(d => d.incoming > 0 || d.outgoing > 0);
  }, [receipts, deliveries, warehouses, filters.warehouse]);

  // ── Ledger trend (stock movement by date) ──────────────────────────────────
  const ledgerTrend = useMemo(() => {
    const dateMap = {};
    ledger.forEach(entry => {
      const day = entry.date?.slice(0, 10);
      if (!day) return;
      if (!dateMap[day]) dateMap[day] = { date: day, in: 0, out: 0, adj: 0 };
      const qty = Number(entry.quantity || 0);
      if (entry.operation === 'Receipt' || entry.operation === 'Initial Intake') {
        dateMap[day].in += qty;
      } else if (entry.operation === 'Delivery') {
        dateMap[day].out += Math.abs(qty);
      } else if (entry.operation === 'Adjustment') {
        dateMap[day].adj += qty;
      }
    });
    return Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // last 14 days
  }, [ledger]);

  // ── Health summary ─────────────────────────────────────────────────────────
  const healthData = useMemo(() => {
    const counts = { 'In Stock': 0, 'Low Stock': 0, 'Critical': 0, 'Out of Stock': 0 };
    filteredProducts.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] }))
      .filter(d => d.value > 0);
  }, [filteredProducts]);

  // ── Low stock table ────────────────────────────────────────────────────────
  const lowStockItems = useMemo(() =>
    filteredProducts
      .filter(p => p.status === 'Low Stock' || p.status === 'Critical' || p.status === 'Out of Stock')
      .map(p => ({
        ...p,
        shortage: Math.max(0, p.minReorderPoint - p.totalStock)
      }))
      .sort((a, b) => b.shortage - a.shortage),
    [filteredProducts]
  );

  // ── Warehouse utilization (only where capacity exists) ─────────────────────
  const utilizationData = useMemo(() =>
    warehouseData.filter(w => w.capacity !== null),
    [warehouseData]
  );

  // ── Transfer activity ───────────────────────────────────────────────────────
  const transferSummary = useMemo(() => {
    const map = {};
    transfers.forEach(t => {
      const key = t.fromWarehouseName;
      if (!map[key]) map[key] = { name: key, sent: 0, received: 0 };
      map[key].sent += Number(t.qty || 0);
      const toKey = t.toWarehouseName;
      if (!map[toKey]) map[toKey] = { name: toKey, sent: 0, received: 0 };
      map[toKey].received += Number(t.qty || 0);
    });
    return Object.values(map).filter(d => (filters.warehouse === 'All') || (
      d.name === warehouses.find(w => w.id === filters.warehouse)?.name
    ));
  }, [transfers, warehouses, filters.warehouse]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-blue-600" />
            Inventory Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Management-level insights calculated live from inventory data.
            {filteredProducts.length !== products.length && (
              <span className="ml-1.5 text-blue-600 dark:text-blue-400 font-medium">
                Showing {filteredProducts.length} of {products.length} products
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => setFilters({ warehouse: 'All', category: 'All', product: 'All' })}
        >
          Reset All
        </Button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        warehouses={warehouses}
        categories={categories}
        products={products}
        filters={filters}
        onChange={setFilters}
      />

      {/* ── SECTION 1: KPI Overview ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiTile title="Total Products" value={filteredProducts.length} sub={`${products.length} in catalog`} icon={Package} color="blue" onClick={() => navigate('/products')} />
        <KpiTile title="Total Stock" value={kpis.totalStock.toLocaleString()} sub="units on hand" icon={Activity} color="emerald" />
        <KpiTile title="Inventory Value" value={formatCurrency(kpis.totalValue)} sub="at cost price" icon={DollarSign} color="purple" />
        <KpiTile title="Low / Critical" value={kpis.lowStock} sub="need reorder" icon={AlertTriangle} color="amber" onClick={() => navigate('/products?status=Low Stock')} />
        <KpiTile title="Out of Stock" value={kpis.outOfStock} sub="zero units" icon={AlertCircle} color="rose" onClick={() => navigate('/products?status=Out of Stock')} />
        <KpiTile title="Warehouses" value={warehouses.filter(w => w.status === 'Active').length} sub="active facilities" icon={Warehouse} color="slate" onClick={() => navigate('/warehouses')} />
      </div>

      {/* Operations Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownToLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Received</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{kpis.totalReceivedQty.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">units from validated receipts</p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Delivered</span>
          </div>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{kpis.totalDeliveredQty.toLocaleString()}</p>
          <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">units from completed deliveries</p>
        </div>
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50">
          <div className="flex items-center gap-2 mb-1">
            <ArrowLeftRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Transfers</span>
          </div>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{transfers.length}</p>
          <p className="text-[11px] text-purple-600/70 dark:text-purple-400/70 mt-0.5">internal moves logged</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50">
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Adjustments</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{adjustments.length}</p>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">count corrections applied</p>
        </div>
      </div>

      {/* ── SECTION 2: Category & Health ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <SectionTitle icon={Package} title="Stock by Category" subtitle="Unit distribution across product categories" iconColor="text-blue-500" />
          {categoryData.length === 0 ? <EmptyChart message="No category data available" /> : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-slate-800" stroke="currentColor" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <RechartTooltip content={<BarTooltip />} />
                    <Bar dataKey="value" name="Units" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Category breakdown list */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{cat.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{cat.value.toLocaleString()} ({cat.pct}%)</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Inventory Health Donut */}
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={Activity} title="Inventory Health" subtitle="Product status breakdown" iconColor="text-emerald-500" />
          {healthData.length === 0 ? <EmptyChart message="No product data" /> : (
            <>
              <div className="relative h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartTooltip content={<PieTooltip />} />
                    <Pie data={healthData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {healthData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{filteredProducts.length}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">products</span>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {healthData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{d.name}</span>
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── SECTION 3: Warehouse Stock ──────────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <SectionTitle icon={Warehouse} title="Stock by Warehouse" subtitle="Current unit quantities across all active facilities" iconColor="text-cyan-500" />
        {warehouseData.length === 0 ? <EmptyChart message="No warehouse stock data to display" /> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouseData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-slate-800" stroke="currentColor" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <RechartTooltip content={<BarTooltip />} />
                <Bar dataKey="stock" name="Stock Units" radius={[6, 6, 0, 0]} maxBarSize={52}>
                  {warehouseData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── SECTION 4: Incoming vs Outgoing ──────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <SectionTitle icon={TrendingUp} title="Incoming vs Outgoing Stock" subtitle="Validated receipts vs completed deliveries per warehouse" iconColor="text-emerald-500" />
        {inOutData.length === 0 ? (
          <EmptyChart message="No validated receipts or completed deliveries yet" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inOutData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-slate-800" stroke="currentColor" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <RechartTooltip content={<BarTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                <Bar dataKey="incoming" name="Incoming (Receipts)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="outgoing" name="Outgoing (Deliveries)" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── SECTION 5: Stock Movement Trend (Ledger) ─────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <SectionTitle icon={Activity} title="Stock Movement Trend" subtitle="Inbound, outbound and adjustment activity from ledger (last 14 days)" iconColor="text-purple-500" />
        {ledgerTrend.length === 0 ? (
          <EmptyChart message="No ledger entries with date data available" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ledgerTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAdj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-slate-800" stroke="currentColor" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <RechartTooltip content={<BarTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="in" name="Incoming" stroke="#10B981" strokeWidth={2} fill="url(#gIn)" />
                <Area type="monotone" dataKey="out" name="Outgoing" stroke="#2563EB" strokeWidth={2} fill="url(#gOut)" />
                <Area type="monotone" dataKey="adj" name="Adjustments" stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#gAdj)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── SECTION 6 & 7: Low Stock Table + Warehouse Utilization ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Low Stock Analysis */}
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={AlertTriangle} title="Low Stock Analysis" subtitle="Products requiring reorder action" iconColor="text-amber-500" />
          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All products are well-stocked</p>
              <p className="text-xs text-slate-400">No items below reorder threshold</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs min-w-[420px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left pb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Product / SKU</th>
                    <th className="text-right pb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock</th>
                    <th className="text-right pb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Reorder</th>
                    <th className="text-right pb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Shortage</th>
                    <th className="text-center pb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {lowStockItems.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{p.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{p.sku}</p>
                      </td>
                      <td className="py-2.5 px-1 text-right font-bold font-mono text-slate-900 dark:text-slate-100">{p.totalStock}</td>
                      <td className="py-2.5 px-1 text-right font-mono text-slate-500">{p.minReorderPoint}</td>
                      <td className="py-2.5 px-1 text-right font-bold font-mono text-rose-600 dark:text-rose-400">
                        {p.shortage > 0 ? `-${p.shortage}` : '—'}
                      </td>
                      <td className="py-2.5 px-1 text-center">
                        <StatusBadge status={p.status} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lowStockItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => navigate('/products?status=Low Stock')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                  >
                    View all in Products <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Warehouse Utilization */}
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={Warehouse} title="Warehouse Utilization" subtitle="Capacity usage where data is available" iconColor="text-cyan-500" />
          {utilizationData.length === 0 ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Capacity data is available for all warehouses. Current stock vs capacity is shown below.
              </p>
              {warehouseData.map((wh, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{wh.fullName}</span>
                    <span className="text-slate-400 font-mono">{wh.stock.toLocaleString()} units</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: '0%', background: wh.color }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">Capacity not configured — add capacity to warehouse settings</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {utilizationData.map((wh, i) => {
                const pct = wh.utilPct || 0;
                const barColor = pct > 85 ? '#EF4444' : pct > 65 ? '#F59E0B' : wh.color;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{wh.fullName}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-slate-500">{wh.stock.toLocaleString()}/{wh.capacity.toLocaleString()}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${pct > 85 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : pct > 65 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── SECTION 8: Transfer Activity ─────────────────────────────────────── */}
      {transferSummary.length > 0 && (
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={ArrowLeftRight} title="Internal Transfer Activity" subtitle="Units sent and received per warehouse" iconColor="text-purple-500" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transferSummary} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-slate-200 dark:text-slate-800" stroke="currentColor" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <RechartTooltip content={<BarTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="sent" name="Sent Out" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="received" name="Received" fill="#06B6D4" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Footer note ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <Activity className="w-3.5 h-3.5 shrink-0" />
        <span>All analytics are calculated live from <strong className="text-slate-700 dark:text-slate-300">InventoryContext</strong>. They update automatically when products are added, stock is received, delivered, transferred or adjusted.</span>
      </div>
    </div>
  );
};
