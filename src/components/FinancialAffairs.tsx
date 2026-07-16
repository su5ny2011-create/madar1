// @refresh reset
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinancialTransaction, Language, CustomExpenseCategory } from '../types';
import { translations } from '../translations';
import {
  Wallet,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  DollarSign,
  PenTool,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';

interface FinancialAffairsProps {
  transactions: FinancialTransaction[];
  morningCash: number;
  customCategories: CustomExpenseCategory[];
  lang: Language;
  onSetMorningCash: (amount: number) => void;
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id'>) => void;
  onUpdateTransaction?: (tx: FinancialTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  canEdit: boolean;
}

export default function FinancialAffairs({
  transactions,
  morningCash,
  customCategories,
  lang,
  onSetMorningCash,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  canEdit,
}: FinancialAffairsProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Local state for morning cash setting
  const [morningCashInput, setMorningCashInput] = useState<string>(morningCash.toString());
  const [showMorningCashSuccess, setShowMorningCashSuccess] = useState(false);

  // Form state for new transaction
  const [showForm, setShowForm] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState<string>('petrol');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txNotes, setTxNotes] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Calculated totals
  const totalIncome = transactions
    .filter((tr) => tr.type === 'income')
    .reduce((sum, tr) => sum + tr.amount, 0);

  const totalExpenses = transactions
    .filter((tr) => tr.type === 'expense')
    .reduce((sum, tr) => sum + tr.amount, 0);

  const currentNetDrawer = morningCash + totalIncome - totalExpenses;

  // Handle morning cash save
  const handleSaveMorningCash = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(morningCashInput);
    if (!isNaN(parsedAmount) && parsedAmount >= 0) {
      onSetMorningCash(parsedAmount);
      setShowMorningCashSuccess(true);
      setTimeout(() => setShowMorningCashSuccess(false), 3000);
    }
  };

  // Handle new or edit transaction submit
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(txAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (editingTxId && onUpdateTransaction) {
      onUpdateTransaction({
        id: editingTxId,
        type: txType,
        category: txCategory,
        amount: parsedAmount,
        date: txDate,
        notes: txNotes,
      });
    } else {
      onAddTransaction({
        type: txType,
        category: txCategory,
        amount: parsedAmount,
        date: txDate,
        notes: txNotes,
      });
    }

    // Reset Form
    setTxAmount('');
    setTxNotes('');
    setTxCategory('petrol');
    setTxType('expense');
    setEditingTxId(null);
    setShowForm(false);
  };

  const handleEditClick = (tx: FinancialTransaction) => {
    setEditingTxId(tx.id);
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxAmount(tx.amount.toString());
    setTxDate(tx.date);
    setTxNotes(tx.notes);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الحركة؟' : 'Are you sure you want to delete this transaction?')) {
      onDeleteTransaction?.(id);
    }
  };

  // Get localized category name helper
  const getCategoryLabel = (cat: string) => {
    if (cat === 'maintenance_return') return t.compensation;
    if (cat === 'petrol') return t.petrol;
    if (cat === 'car_repair') return t.carRepair;
    if (cat === 'other') return t.other;

    // Search inside custom registered categories
    const foundCustom = customCategories.find((c) => c.id === cat || c.nameEn === cat || c.nameAr === cat);
    if (foundCustom) {
      return isRtl ? foundCustom.nameAr : foundCustom.nameEn;
    }

    return cat;
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  return (
    <div className="space-y-6 pb-12 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-[#024B83] font-arabic flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#E5941A]" />
            {t.financialManagement}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-arabic">
            {isRtl
              ? 'تثبيت رأس المال اليومي، إدارة المصاريف التشغيلية ومقبوضات عقود الصيانة والزيارات'
              : 'Audit morning register balance, record company business expenses and service payments'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all font-arabic"
          >
            <Plus className="w-4 h-4 text-[#E5941A]" />
            <span>{t.addTransaction}</span>
          </button>
        )}
      </div>

      {/* Morning Cash config card & calculations drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Morning cash manager form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#024B83] font-arabic flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Wallet className="w-4 h-4 text-[#E5941A]" />
            {t.setMorningCash}
          </h3>

          <form onSubmit={handleSaveMorningCash} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                {t.morningCash} ({t.jod})
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold font-mono">
                  {t.jod}
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  disabled={!canEdit}
                  value={morningCashInput}
                  onChange={(e) => setMorningCashInput(e.target.value)}
                  placeholder={t.morningCashPlaceholder}
                  className="block w-full py-2 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-black font-mono focus:outline-hidden focus:ring-1 focus:ring-[#024B83] focus:border-[#024B83]"
                />
              </div>
            </div>

            {canEdit && (
              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#E5941A] hover:bg-[#d28c1c] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors font-arabic"
              >
                {t.save}
              </button>
            )}

            {showMorningCashSuccess && (
              <div className="p-2 text-center text-[11px] font-extrabold text-[#1C7C43] bg-emerald-50 rounded-md border border-emerald-100 font-arabic">
                {t.morningCashSaved}
              </div>
            )}
          </form>
        </div>

        {/* Real-time statistics summaries */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4 lg:col-span-2 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-[#024B83] font-arabic flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <ClipboardList className="w-4 h-4 text-[#1C7C43]" />
            {isRtl ? 'الحساب الختامي للصندوق الحالي' : 'Live Balance Breakdown'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
            {/* Morning starting */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold font-arabic">{t.morningCash}</span>
              <p className="text-lg font-black text-slate-700 font-mono">
                {morningCash.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
              </p>
            </div>

            {/* Income */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-1">
              <span className="text-[10px] text-[#1C7C43] font-bold font-arabic flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {t.totalIncome}
              </span>
              <p className="text-lg font-black text-[#1C7C43] font-mono">
                +{totalIncome.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
              </p>
            </div>

            {/* Expenses */}
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-1">
              <span className="text-[10px] text-red-600 font-bold font-arabic flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                {t.totalExpenses}
              </span>
              <p className="text-lg font-black text-red-600 font-mono">
                -{totalExpenses.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
              </p>
            </div>
          </div>

          <div className="bg-[#024B83]/10 p-4 rounded-xl border border-[#024B83]/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#024B83] font-arabic">{t.netCash}</p>
              <p className="text-[10px] text-slate-500 font-arabic">
                {isRtl ? '(كاش صباحي + مقبوضات - مصاريف البنزين والصيانة والأخرى)' : '(Morning Cash + Income - Operational Expenses)'}
              </p>
            </div>
            <div className="text-xl font-extrabold text-[#024B83] font-mono">
              {currentNetDrawer.toFixed(2)} {t.jod}
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction expandable form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border-2 border-[#024B83]/30 shadow-md">
          <h3 className="text-sm font-bold text-[#024B83] mb-6 border-b border-slate-100 pb-3 font-arabic flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-[#E5941A]" />
            {t.addTransaction}
          </h3>

          <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type selector (Income vs Expense) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                  {t.transactionType}
                </label>
                <select
                  value={txType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setTxType(val);
                    if (val === 'income') {
                      setTxCategory('maintenance_return');
                    } else {
                      setTxCategory('petrol');
                    }
                  }}
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                >
                  <option value="expense">🔴 {t.expense}</option>
                  <option value="income">🟢 {t.income}</option>
                </select>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                  {t.expenseType}
                </label>
                {txType === 'income' ? (
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                  >
                    <option value="maintenance_return">💵 {t.compensation}</option>
                  </select>
                ) : (
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                  >
                    <option value="petrol">⛽ {t.petrol}</option>
                    <option value="car_repair">🚗 {t.carRepair}</option>
                    {customCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        📦 {isRtl ? cat.nameAr : cat.nameEn}
                      </option>
                    ))}
                    <option value="other">⚙️ {t.other}</option>
                  </select>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                  {t.amount}
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono font-bold">
                    {t.jod}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="block w-full py-2 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-extrabold font-mono focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                  {t.date}
                </label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                />
              </div>
            </div>

            {/* Notes/Comments area */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                {t.notes}
              </label>
              <textarea
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
                placeholder={isRtl ? 'مثال: بنزين لسيارة مهندس سامر لزيارة شركة الصقر أو ملاحظات المصروف التفصيلية' : 'Type description here...'}
                rows={2}
                className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTxId(null);
                  setTxAmount('');
                  setTxNotes('');
                  setTxCategory('petrol');
                  setTxType('expense');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-200 transition-colors font-arabic"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#024B83] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer hover:bg-[#0b4c80] transition-colors font-arabic"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Table filter options */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#024B83] font-arabic uppercase tracking-wider flex items-center gap-1">
            <ClipboardList className="w-3.5 h-3.5" />
            {t.financialLedger}
          </h3>

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                filterType === 'all' ? 'bg-[#024B83] text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isRtl ? 'عرض الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                filterType === 'income' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              💵 {isRtl ? 'المقبوضات' : 'Income'}
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                filterType === 'expense' ? 'bg-red-600 text-white' : 'bg-white text-red-600 hover:bg-red-50'
              }`}
            >
              ⛽ {isRtl ? 'المصاريف' : 'Expenses'}
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-arabic">
            {isRtl ? 'لا توجد حركات مالية مسجلة لهذه الفئة.' : 'No transactions found for this selection.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-2 py-2 md:px-4 md:py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    ID
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.transactionType}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.category}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.amount}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.date}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                    {t.notes}
                  </th>
                  {canEdit && (
                    <th className="px-2 py-2 md:px-4 md:py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                      إجراءات
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-2 py-2 md:px-4 md:py-3 text-center text-slate-400 font-mono">
                        {tx.id}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isIncome ? t.income : t.expense}
                        </span>
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-center font-bold text-slate-800 font-arabic">
                        {getCategoryLabel(tx.category)}
                      </td>
                      <td
                        className={`px-2 py-2 md:px-4 md:py-3 text-center font-extrabold font-mono text-xs ${
                          isIncome ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {tx.amount.toFixed(2)} {t.jod}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-center text-slate-400 font-mono">
                        {tx.date}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 text-center text-slate-500 max-w-xs truncate font-arabic">
                        {tx.notes || '-'}
                      </td>
                      {canEdit && (
                        <td className="px-2 py-2 md:px-4 md:py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(tx)}
                              className="p-1 text-slate-400 hover:text-[#024B83] transition-colors"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(tx.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
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
