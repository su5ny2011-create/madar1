/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MaintenanceRequest, FinancialTransaction, Language } from '../types';
import { translations } from '../translations';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Download,
  Users,
  Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardProps {
  requests: MaintenanceRequest[];
  transactions: FinancialTransaction[];
  morningCash: number;
  lang: Language;
  onNavigate: (tab: string) => void;
  onExportMaintenance: () => void;
  onExportFinance: () => void;
}

export default function Dashboard({
  requests,
  transactions,
  morningCash,
  lang,
  onNavigate,
  onExportMaintenance,
  onExportFinance,
}: DashboardProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Statistics calculations
  const totalReq = requests.length;
  const urgentReq = requests.filter((r) => r.isUrgent).length;
  const readyReq = requests.filter((r) => r.status === 'ready').length;
  const pendingReq = requests.filter((r) => r.status !== 'ready').length;

  // Financial calculations
  // income is from transactions + any maintenance request amount that is paid ('cash' or 'click')
  const totalIncomeFromLedger = transactions
    .filter((tr) => tr.type === 'income')
    .reduce((sum, tr) => sum + tr.amount, 0);

  // Let's make sure we count all income:
  const totalIncome = totalIncomeFromLedger;

  const totalExpenses = transactions
    .filter((tr) => tr.type === 'expense')
    .reduce((sum, tr) => sum + tr.amount, 0);

  const netCash = morningCash + totalIncome - totalExpenses;

  // Chart data: Financial Summary (Income vs Expense)
  const financialData = [
    {
      name: isRtl ? 'الكاش الصباحي' : 'Morning Cash',
      [isRtl ? 'المبلغ' : 'Amount']: morningCash,
    },
    {
      name: isRtl ? 'الإيرادات' : 'Income',
      [isRtl ? 'المبلغ' : 'Amount']: totalIncome,
    },
    {
      name: isRtl ? 'المصاريف' : 'Expenses',
      [isRtl ? 'المبلغ' : 'Amount']: totalExpenses,
    },
    {
      name: isRtl ? 'صافي المتوفر' : 'Net Drawer',
      [isRtl ? 'المبلغ' : 'Amount']: netCash,
    },
  ];

  // Chart data: Expense categories distribution
  const expenseCategoriesCount: Record<string, number> = {};
  transactions
    .filter((tr) => tr.type === 'expense')
    .forEach((tr) => {
      let label = '';
      if (tr.category === 'petrol') label = t.petrol;
      else if (tr.category === 'car_repair') label = t.carRepair;
      else if (tr.category === 'maintenance_return') label = t.compensation;
      else if (tr.category === 'other') label = tr.notes ? `${t.other} (${tr.notes.slice(0, 10)}...)` : t.other;
      else label = tr.category;

      expenseCategoriesCount[label] = (expenseCategoriesCount[label] || 0) + tr.amount;
    });

  const expensePieData = Object.keys(expenseCategoriesCount).map((key) => ({
    name: key,
    value: expenseCategoriesCount[key],
  }));

  // Chart data: Maintenance status distribution
  const statusCounts = {
    not_ready: requests.filter((r) => r.status === 'not_ready').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    ready: requests.filter((r) => r.status === 'ready').length,
  };

  const statusPieData = [
    { name: t.notReady, value: statusCounts.not_ready, color: '#EF4444' }, // Red
    { name: t.inProgress, value: statusCounts.in_progress, color: '#F59E0B' }, // Yellow/Amber
    { name: t.ready, value: statusCounts.ready, color: '#10B981' }, // Green/Emerald
  ];

  // Top Customers by Maintenance count
  const customerCounts: Record<string, { count: number; phone: string; totalSpent: number }> = {};
  requests.forEach((r) => {
    if (!customerCounts[r.customerName]) {
      customerCounts[r.customerName] = { count: 0, phone: r.phoneNumber, totalSpent: 0 };
    }
    customerCounts[r.customerName].count += 1;
    customerCounts[r.customerName].totalSpent += r.amount;
  });

  const topCustomers = Object.keys(customerCounts)
    .map((name) => ({
      name,
      phone: customerCounts[name].phone,
      count: customerCounts[name].count,
      totalSpent: customerCounts[name].totalSpent,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Colors for charts
  const COLORS = ['#024B83', '#E5941A', '#1C7C43', '#1A98D3', '#EF4444', '#8B5CF6'];

  // Daily Snapshot Calculations
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().slice(0, 10);
  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().slice(0, 10);

  const todayCompletedReq = requests.filter((r) => r.status === 'ready' && r.date === todayStr).length;
  const yesterdayCompletedReq = requests.filter((r) => r.status === 'ready' && r.date === yesterdayStr).length;
  const completedReqDiff = todayCompletedReq - yesterdayCompletedReq;

  const todayIncomeOnly = transactions
    .filter((tr) => tr.type === 'income' && tr.date === todayStr)
    .reduce((sum, tr) => sum + tr.amount, 0);
  const yesterdayIncomeOnly = transactions
    .filter((tr) => tr.type === 'income' && tr.date === yesterdayStr)
    .reduce((sum, tr) => sum + tr.amount, 0);
  const incomeDiff = todayIncomeOnly - yesterdayIncomeOnly;

  const todayExpensesOnly = transactions
    .filter((tr) => tr.type === 'expense' && tr.date === todayStr)
    .reduce((sum, tr) => sum + tr.amount, 0);
  const yesterdayExpensesOnly = transactions
    .filter((tr) => tr.type === 'expense' && tr.date === yesterdayStr)
    .reduce((sum, tr) => sum + tr.amount, 0);

  const todayNetCashOnly = morningCash + todayIncomeOnly - todayExpensesOnly;
  const yesterdayNetCashOnly = (morningCash /* fallback approx */) + yesterdayIncomeOnly - yesterdayExpensesOnly;
  const netCashDiff = todayNetCashOnly - yesterdayNetCashOnly;

  return (
    <div className="space-y-8 font-sans pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Title Header with Export buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-[#024B83] font-arabic flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#E5941A]" />
            {t.navDashboard}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-arabic">
            {t.appSubTitle}
          </p>
        </div>

        {/* Quick Export Panel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onExportMaintenance}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#1C7C43]" />
            <span>{t.exportMaintenance}</span>
          </button>
          <button
            onClick={onExportFinance}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#E5941A]" />
            <span>{t.exportFinance}</span>
          </button>
        </div>
      </div>

      {/* Daily Snapshot */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 font-arabic mb-4">{t.dailySummary}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2 border-b sm:border-b-0 sm:border-r sm:border-slate-100 pb-4 sm:pb-0 sm:pr-4">
            <span className="text-xs text-slate-500 font-arabic">{t.todayCompleted}</span>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-black text-[#1C7C43] font-mono">{todayCompletedReq}</span>
              <span className={`text-xs font-bold font-mono mb-1 flex items-center ${completedReqDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {completedReqDiff >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5 ml-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5 ml-0.5" />}
                {Math.abs(completedReqDiff)} {t.vsYesterday}
              </span>
            </div>
          </div>
          
          <div className="space-y-2 border-b sm:border-b-0 sm:border-r sm:border-slate-100 pb-4 sm:pb-0 sm:pr-4">
            <span className="text-xs text-slate-500 font-arabic">{t.todayIncomeOnly}</span>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-black text-[#E5941A] font-mono">{todayIncomeOnly.toFixed(2)}</span>
              <span className={`text-xs font-bold font-mono mb-1 flex items-center ${incomeDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {incomeDiff >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5 ml-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5 ml-0.5" />}
                {Math.abs(incomeDiff).toFixed(2)} {t.vsYesterday}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <span className="text-xs text-slate-500 font-arabic">{t.todayNetCashOnly}</span>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-black text-[#024B83] font-mono">{todayNetCashOnly.toFixed(2)}</span>
              <span className={`text-xs font-bold font-mono mb-1 flex items-center ${netCashDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {netCashDiff >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5 ml-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5 ml-0.5" />}
                {Math.abs(netCashDiff).toFixed(2)} {t.vsYesterday}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid statistics summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total maintenance requests */}
        <div
          onClick={() => onNavigate('maintenance')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.totalRequests}
            </p>
            <h3 className="text-2xl font-black text-[#024B83] font-mono">{totalReq}</h3>
          </div>
          <div className="p-3 bg-[#024B83]/10 rounded-xl text-[#024B83]">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Urgent requests */}
        <div
          onClick={() => onNavigate('maintenance')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.urgentRequests}
            </p>
            <h3 className="text-2xl font-black text-red-600 font-mono">{urgentReq}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Ready orders */}
        <div
          onClick={() => onNavigate('maintenance')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.readyRequests}
            </p>
            <h3 className="text-2xl font-black text-[#1C7C43] font-mono">{readyReq}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-[#1C7C43]">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Pending / In preparation */}
        <div
          onClick={() => onNavigate('maintenance')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.pendingRequests}
            </p>
            <h3 className="text-2xl font-black text-amber-500 font-mono">{pendingReq}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Financial drawer box summaries */}
      <div className="bg-gradient-to-br from-[#024B83] via-[#024B83]/95 to-[#1A98D3] text-white rounded-3xl p-6 md:p-8 shadow-lg border border-[#024B83]/30">
        <div className="flex items-center gap-2 mb-6">
          <Wallet className="w-6 h-6 text-[#E5941A]" />
          <h3 className="text-lg font-bold font-arabic">{t.financialSummary}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1 backdrop-blur-xs">
            <span className="text-xs text-blue-100 font-medium font-arabic">{t.morningCash}</span>
            <div className="text-2xl font-black font-mono">
              {morningCash.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
            </div>
          </div>

          <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/10 space-y-1 backdrop-blur-xs">
            <span className="text-xs text-emerald-100 font-medium font-arabic flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              {t.totalIncome}
            </span>
            <div className="text-2xl font-black font-mono text-emerald-300">
              +{totalIncome.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
            </div>
          </div>

          <div className="bg-red-500/20 p-4 rounded-2xl border border-red-500/10 space-y-1 backdrop-blur-xs">
            <span className="text-xs text-red-100 font-medium font-arabic flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-300" />
              {t.totalExpenses}
            </span>
            <div className="text-2xl font-black font-mono text-red-300">
              -{totalExpenses.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
            </div>
          </div>

          <div className="bg-amber-500/20 p-4 rounded-2xl border border-amber-500/20 space-y-1 backdrop-blur-xs relative overflow-hidden">
            <span className="text-xs text-amber-100 font-medium font-arabic">{t.netCash}</span>
            <div className="text-2xl font-black font-mono text-amber-300">
              {netCash.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
            </div>
            {/* Soft decorative ring behind */}
            <div className="absolute right-[-10px] bottom-[-10px] w-12 h-12 rounded-full bg-white/5" />
          </div>
        </div>
      </div>

      {/* Visual Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Financial Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
          <h3 className="text-sm font-bold text-[#024B83] mb-4 font-arabic">
            {t.chartsTitle}
          </h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{
                    direction: isRtl ? 'rtl' : 'ltr',
                    textAlign: isRtl ? 'right' : 'left',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey={isRtl ? 'المبلغ' : 'Amount'} radius={[6, 6, 0, 0]}>
                  {financialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance request status distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="text-sm font-bold text-[#024B83] mb-4 font-arabic">
            {isRtl ? 'توزيع حالات طلبات الصيانة' : 'Maintenance Status Share'}
          </h3>
          <div className="h-60 w-full relative">
            {totalReq === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-arabic text-xs">
                {t.noActivity}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Legend indicators */}
          <div className="mt-4 flex justify-center gap-4 flex-wrap text-[11px] font-semibold text-slate-600">
            {statusPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row lists: Top Active Customers & Expense Categories Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Customers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#024B83] font-arabic flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#1A98D3]" />
              {t.topCustomers}
            </h3>
            <button
              onClick={() => onNavigate('settings')}
              className="text-[#1A98D3] hover:text-[#024B83] text-xs font-bold cursor-pointer font-arabic flex items-center gap-0.5"
            >
              <span>{isRtl ? 'إدارة الزبائن' : 'Manage Customers'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topCustomers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-arabic">
              {isRtl ? 'لا يوجد زبائن مسجلين حالياً.' : 'No registered customers.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topCustomers.map((c, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800">{c.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono" dir="ltr">{c.phone}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#024B83]/10 text-[#024B83]">
                      {c.count} {isRtl ? 'طلبات' : 'orders'}
                    </span>
                    <p className="text-xs font-bold text-[#1C7C43] font-mono">
                      {c.totalSpent.toFixed(2)} {t.jod}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses categories distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="text-sm font-bold text-[#024B83] mb-4 font-arabic flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#E5941A]" />
            {isRtl ? 'تصنيف وقيم المصاريف' : 'Expense Categories Distribution'}
          </h3>

          {expensePieData.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-arabic">
              {isRtl ? 'لا توجد مصاريف مسجلة حتى الآن.' : 'No expenses logged.'}
            </div>
          ) : (
            <div className="space-y-3">
              {expensePieData.map((item, idx) => {
                const percent = ((item.value / totalExpenses) * 100).toFixed(0);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <span className="font-mono font-bold text-[#024B83]">
                        {item.value.toFixed(2)} {t.jod} ({percent}%)
                      </span>
                    </div>
                    {/* Visual Progress bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#E5941A] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* First Page details table - Recent Active Maintenance requests */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-[#024B83] font-arabic flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-[#1C7C43]" />
            {t.recentActivity}
          </h3>
          <button
            onClick={() => onNavigate('maintenance')}
            className="text-[#024B83] hover:text-[#0b4c80] text-xs font-bold cursor-pointer font-arabic flex items-center gap-0.5"
          >
            <span>{isRtl ? 'عرض الجدول بالكامل' : 'View Maintenance Log'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-arabic">
            {t.noActivity}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.customerName}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.phoneNumber}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.time}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.problemType}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.isUrgent}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.status}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.amountJOD}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {requests.slice(0, 5).map((req) => {
                  let statusBg = '';
                  let statusText = '';
                  let statusColor = '';

                  switch (req.status) {
                    case 'ready':
                      statusBg = 'bg-emerald-50 text-[#1C7C43] border border-emerald-100';
                      statusText = t.ready;
                      statusColor = 'text-[#1C7C43]';
                      break;
                    case 'in_progress':
                      statusBg = 'bg-amber-50 text-amber-600 border border-amber-100';
                      statusText = t.inProgress;
                      statusColor = 'text-amber-500';
                      break;
                    case 'not_ready':
                      statusBg = 'bg-red-50 text-red-600 border border-red-100';
                      statusText = t.notReady;
                      statusColor = 'text-red-600';
                      break;
                  }

                  const paid = req.paidAmount ?? (req.paymentMethod !== 'none' ? req.amount : 0);
                  const isPaidFull = paid >= req.amount && req.amount > 0;
                  const isPaidPartial = paid > 0 && paid < req.amount;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-800 text-center">
                        {req.customerName}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-center" dir="ltr">
                        {req.phoneNumber}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-500 font-mono">
                        {req.date} / {req.time}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-600 truncate max-w-xs font-arabic">
                        {req.problemType}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {req.isUrgent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700">
                            {t.urgent}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                            {t.normal}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold ${statusBg}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800 font-mono">
                        {req.amount} {t.jod}
                        {isPaidFull && (
                          <div className="text-[10px] text-emerald-600 font-arabic font-black mt-0.5">
                            {t.paidFull}
                          </div>
                        )}
                        {isPaidPartial && (
                          <div className="text-[10px] text-amber-600 font-arabic font-black mt-0.5">
                            {t.paidPartial} ({paid} {t.jod})
                          </div>
                        )}
                        {!isPaidFull && !isPaidPartial && (
                          <div className="text-[10px] text-red-500 font-arabic font-black mt-0.5">
                            {t.unpaid}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
