/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Part, CustomExpenseCategory, Language, User, MaintenanceRequest, FinancialTransaction } from '../types';
import { translations } from '../translations';
import {
  Settings,
  Users,
  Wrench,
  Coins,
  Plus,
  Trash2,
  FolderPlus,
  Phone,
  FileJson,
  Upload,
  Download,
} from 'lucide-react';

interface SettingsPanelProps {
  customers: Customer[];
  parts: Part[];
  customExpenseCategories: CustomExpenseCategory[];
  lang: Language;
  onAddCustomer: (name: string, phone: string) => void;
  onDeleteCustomer: (id: string) => void;
  onAddPart: (name: string, price: number) => void;
  onDeletePart: (id: string) => void;
  onAddExpenseCategory: (nameAr: string, nameEn: string) => void;
  onDeleteExpenseCategory: (id: string) => void;
  canEdit: boolean;
  currentUser: User | null;
  requests: MaintenanceRequest[];
  users: User[];
  transactions: FinancialTransaction[];
  onRestoreBackup?: (backupData: any) => Promise<boolean> | boolean;
}

export default function SettingsPanel({
  customers,
  parts,
  customExpenseCategories,
  lang,
  onAddCustomer,
  onDeleteCustomer,
  onAddPart,
  onDeletePart,
  onAddExpenseCategory,
  onDeleteExpenseCategory,
  canEdit,
  currentUser,
  requests,
  users,
  transactions,
  onRestoreBackup,
}: SettingsPanelProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // State forms inputs
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [partNameInput, setPartNameInput] = useState('');
  const [partPriceInput, setPartPriceInput] = useState('');
  const [expNameAr, setExpNameAr] = useState('');
  const [expNameEn, setExpNameEn] = useState('');

  // Notifications
  const [message, setMessage] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const showNotification = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleDownloadBackup = () => {
    try {
      const backupData = {
        backup_version: "1.0",
        exported_at: new Date().toISOString(),
        exported_by: currentUser?.username || 'admin',
        requests,
        users,
        customers,
        parts,
        customExpenseCategories,
        transactions,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `almadar-backup-${dateStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification(isRtl ? 'تم تحميل النسخة الاحتياطية بنجاح!' : 'Backup downloaded successfully!');
    } catch (error) {
      console.error('Backup download error:', error);
      showNotification(isRtl ? 'فشل تحميل النسخة الاحتياطية!' : 'Failed to download backup!');
    }
  };

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmMsg = isRtl
      ? 'هل أنت متأكد من استرجاع هذه النسخة الاحتياطية؟ سيتم دمج وتحديث السجلات الحالية.'
      : 'Are you sure you want to restore this backup? Existing records will be updated and merged.';
    
    if (!window.confirm(confirmMsg)) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (onRestoreBackup) {
        const success = await onRestoreBackup(parsed);
        if (success) {
          showNotification(t.restoreSuccess);
        } else {
          showNotification(t.restoreFailed);
        }
      }
    } catch (err) {
      console.error('Error parsing backup JSON:', err);
      showNotification(t.restoreFailed);
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  const handleAddCust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) return;

    // Validate phone number format (between 9 and 15 digits)
    const cleaned = custPhone.replace(/[\s\-\(\)\+]/g, '');
    const isValid = /^\d{9,15}$/.test(cleaned);
    if (!isValid) {
      showNotification(t.phoneLengthError);
      return;
    }

    // Check if duplicate
    const exists = customers.some((c) => c.name.toLowerCase() === custName.trim().toLowerCase());
    if (exists) {
      showNotification(t.alreadyExists);
      return;
    }

    onAddCustomer(custName.trim(), custPhone.trim());
    setCustName('');
    setCustPhone('');
    showNotification(t.addSuccess);
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(partPriceInput);
    if (!partNameInput.trim() || isNaN(price)) return;

    const exists = parts.some((p) => p.name.toLowerCase() === partNameInput.trim().toLowerCase());
    if (exists) {
      showNotification(t.alreadyExists);
      return;
    }

    onAddPart(partNameInput.trim(), price);
    setPartNameInput('');
    setPartPriceInput('');
    showNotification(t.addSuccess);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expNameAr.trim() || !expNameEn.trim()) return;

    const exists = customExpenseCategories.some(
      (c) =>
        c.nameAr.toLowerCase() === expNameAr.trim().toLowerCase() ||
        c.nameEn.toLowerCase() === expNameEn.trim().toLowerCase()
    );
    if (exists) {
      showNotification(t.alreadyExists);
      return;
    }

    onAddExpenseCategory(expNameAr.trim(), expNameEn.trim());
    setExpNameAr('');
    setExpNameEn('');
    showNotification(t.addSuccess);
  };

  return (
    <div className="space-y-8 pb-12 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <h2 className="text-xl font-extrabold text-[#024B83] font-arabic flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#E5941A]" />
          {t.settingsManagement}
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-arabic">
          {isRtl
            ? 'تغذية وتعديل قواعد البيانات الرئيسية للزبائن الدائمين، مخزن قطع الغيار المسعرة، وبنود المصاريف المخصصة'
            : 'Pre-register regular customer list, hardware replacement catalog with prices, and custom expense accounts'}
        </p>

        {message && (
          <div className="mt-4 p-2.5 text-center text-xs font-bold text-white bg-[#1C7C43] rounded-lg shadow-sm font-arabic transition-all">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Register Customers */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#024B83] font-arabic flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Users className="w-4 h-4 text-[#1A98D3]" />
              {t.addCustomer}
            </h3>

            <form onSubmit={handleAddCust} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-arabic">
                  {t.customerNameAr}
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder={isRtl ? 'مثال: شركة النسر العربي' : 'Customer name'}
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-arabic">
                  {t.phoneNumber}
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="079XXXXXXX"
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                />
              </div>

              {canEdit && (
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors font-arabic"
                >
                  <Plus className="w-4 h-4 text-[#E5941A]" />
                  <span>{isRtl ? 'تسجيل الزبون' : 'Add Customer'}</span>
                </button>
              )}
            </form>
          </div>

          {/* Customer list table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#024B83] font-arabic uppercase tracking-wider">
              {t.customerList} ({customers.length})
            </h4>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {customers.length === 0 ? (
                <p className="py-4 text-center text-slate-400 text-xs font-arabic">{t.noItems}</p>
              ) : (
                customers.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {c.phoneNumber}
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => onDeleteCustomer(c.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title={isRtl ? 'حذف الزبون' : 'Delete Customer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Spare parts stock */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#024B83] font-arabic flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Wrench className="w-4 h-4 text-[#1C7C43]" />
              {t.addPart}
            </h3>

            <form onSubmit={handleAddPart} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-arabic">
                  {t.partName}
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={partNameInput}
                  onChange={(e) => setPartNameInput(e.target.value)}
                  placeholder={isRtl ? 'مثال: باور سبلاي CORSAIR 550W' : 'Part description'}
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-arabic">
                  {t.partPrice}
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono font-bold">
                    {t.jod}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={!canEdit}
                    value={partPriceInput}
                    onChange={(e) => setPartPriceInput(e.target.value)}
                    placeholder="0.00"
                    className="block w-full py-2 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-extrabold font-mono focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                  />
                </div>
              </div>

              {canEdit && (
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors font-arabic"
                >
                  <Plus className="w-4 h-4 text-[#E5941A]" />
                  <span>{isRtl ? 'تسجيل القطعة بالمخزن' : 'Add Spare Part'}</span>
                </button>
              )}
            </form>
          </div>

          {/* Spare parts stock table list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#024B83] font-arabic uppercase tracking-wider">
              {t.partsList} ({parts.length})
            </h4>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {parts.length === 0 ? (
                <p className="py-4 text-center text-slate-400 text-xs font-arabic">{t.noItems}</p>
              ) : (
                parts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-[#1C7C43] font-extrabold font-mono">
                        {p.price.toFixed(2)} {t.jod}
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => onDeletePart(p.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title={isRtl ? 'حذف القطعة' : 'Delete Part'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Custom expense categories registration */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#024B83] font-arabic flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FolderPlus className="w-4 h-4 text-[#E5941A]" />
              {t.addExpenseCat}
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-arabic">
                  {t.expenseCatAr}
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={expNameAr}
                  onChange={(e) => setExpNameAr(e.target.value)}
                  placeholder="مثال: رواتب فنيين"
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-arabic">
                  {t.expenseCatEn}
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={expNameEn}
                  onChange={(e) => setExpNameEn(e.target.value)}
                  placeholder="e.g. Technician Salaries"
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                />
              </div>

              {canEdit && (
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors font-arabic"
                >
                  <Plus className="w-4 h-4 text-[#E5941A]" />
                  <span>{isRtl ? 'تسجيل بند المصروف' : 'Add Expense Account'}</span>
                </button>
              )}
            </form>
          </div>

          {/* Expense accounts registry list table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#024B83] font-arabic uppercase tracking-wider">
              {t.expenseCatList} ({customExpenseCategories.length + 3})
            </h4>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {/* Pre-seeded non-deletable system categories */}
              <div className="py-2.5 flex items-center justify-between text-xs opacity-70">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600">⛽ {t.petrol}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">System Account (Petrol)</p>
                </div>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs opacity-70">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600">🚗 {t.carRepair}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">System Account (Car Maintenance)</p>
                </div>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs opacity-70">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-600">💵 {t.compensation}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">System Account (Income / بدل صيانة)</p>
                </div>
              </div>

              {customExpenseCategories.map((cat) => (
                <div key={cat.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">{isRtl ? `📦 ${cat.nameAr}` : `📦 ${cat.nameEn}`}</p>
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">{cat.nameEn}</p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => onDeleteExpenseCategory(cat.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      title={isRtl ? 'حذف البند' : 'Delete Category'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Backup & Restore Panel */}
      {currentUser?.role === 'admin' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#024B83] font-arabic flex items-center gap-2">
                <FileJson className="w-5 h-5 text-[#E5941A]" />
                {t.backupTitle}
              </h3>
              <p className="text-xs text-slate-500 font-arabic">
                {t.backupDesc}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Restore Button with Hidden File Input */}
              <label className="flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors font-arabic whitespace-nowrap">
                <Upload className="w-4 h-4 text-amber-700" />
                <span>{isRestoring ? (isRtl ? 'جاري الاسترجاع...' : 'Restoring...') : t.restoreBackupBtn}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleRestoreFileChange}
                  disabled={isRestoring}
                />
              </label>

              {/* Download Backup Button */}
              <button
                onClick={handleDownloadBackup}
                className="flex items-center justify-center gap-2 py-2.5 px-5 bg-[#1C7C43] hover:bg-[#156133] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors font-arabic whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-white" />
                <span>{t.downloadBackupBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
