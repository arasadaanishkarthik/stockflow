import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const KpiCard = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'positive', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  colorScheme = 'blue', // 'blue' | 'amber' | 'rose' | 'emerald' | 'purple' | 'cyan'
  onClick
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/40',
      glow: 'group-hover:border-blue-300 dark:group-hover:border-blue-700/60',
      bar: 'bg-blue-600'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/40',
      glow: 'group-hover:border-amber-300 dark:group-hover:border-amber-700/60',
      bar: 'bg-amber-500'
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/40',
      glow: 'group-hover:border-rose-300 dark:group-hover:border-rose-700/60',
      bar: 'bg-rose-500'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/40',
      glow: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700/60',
      bar: 'bg-emerald-600'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-900/40',
      glow: 'group-hover:border-purple-300 dark:group-hover:border-purple-700/60',
      bar: 'bg-purple-600'
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/50',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-100 dark:border-cyan-900/40',
      glow: 'group-hover:border-cyan-300 dark:group-hover:border-cyan-700/60',
      bar: 'bg-cyan-600'
    }
  };

  const scheme = colorMap[colorScheme] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs ${scheme.glow} transition-all duration-200 flex flex-col justify-between h-full min-h-[165px] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* 1. TOP ROW: Icon + KPI Title (wrapping cleanly, zero truncation) */}
      <div className="flex items-start gap-2.5 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${scheme.bg} ${scheme.text} shadow-2xs group-hover:scale-105 transition-transform`}>
          {Icon && <Icon className="w-4.5 h-4.5" />}
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-snug break-words min-w-0 flex-1">
          {title}
        </h4>
      </div>

      {/* 2. MIDDLE SECTION: Main KPI Value + Subtitle / Description */}
      <div className="my-2.5">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono leading-none">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 leading-snug break-words">
            {subtitle}
          </p>
        )}
      </div>

      {/* 3. BOTTOM SECTION: Supporting Information / Change Badge */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs mt-auto">
        {change && (
          <div className="flex items-center gap-1.5 w-full justify-between">
            <span
              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[11px] ${
                changeType === 'positive'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                  : changeType === 'negative'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
              }`}
            >
              {changeType === 'positive' && <TrendingUp className="w-3 h-3" />}
              {changeType === 'negative' && <TrendingDown className="w-3 h-3" />}
              {change}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

