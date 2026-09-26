import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useInventory } from '../../context/InventoryContext';
import { categoryColors } from '../../data/analytics';

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs z-50">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span className="font-bold text-slate-900 dark:text-slate-100">{data.name}</span>
        </div>
        <div className="text-slate-600 dark:text-slate-400">
          Units: <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{data.value}</span>
        </div>
        <div className="text-slate-500 text-[11px]">
          Share: <span className="font-semibold">{data.payload.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const CategoryDistributionChart = () => {
  const { products } = useInventory();

  // Compute category stock totals
  const categoryTotals = products.reduce((acc, prod) => {
    const cat = prod.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Number(prod.totalStock || 0);
    return acc;
  }, {});

  const totalStockUnits = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;

  const chartData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    value: categoryTotals[cat],
    percentage: Math.round((categoryTotals[cat] / totalStockUnits) * 100),
    color: categoryColors[cat] || '#64748B'
  }));

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Inventory by Category
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Unit distribution across material segments
        </p>
      </div>

      <div className="relative h-60 w-full flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomPieTooltip />} />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {totalStockUnits.toLocaleString()}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Units
          </span>
        </div>
      </div>

      {/* Category Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {chartData.map((cat, i) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                {cat.name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {cat.value} ({cat.percentage}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
