// @refresh reset
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaintenanceRequest, MaintenancePayment, Language, Customer, Part } from '../types';
import { translations } from '../translations';
import {
  Trash2,
  Wrench,
  Search,
  PlusCircle,
  Edit2,
  Phone,
  Calendar,
  Clock,
  AlertOctagon,
  CheckCircle2,
  Clock3,
  XCircle,
  HelpCircle,
  Coins,
  DollarSign,
  CreditCard,
  Receipt,
  X,
  History,
  Check,
  ChevronDown,
} from 'lucide-react';

interface MaintenanceManagerProps {
  requests: MaintenanceRequest[];
  customers: Customer[];
  parts: Part[];
  lang: Language;
  onAddRequest: (req: Omit<MaintenanceRequest, 'id'>) => void;
  onUpdateRequest: (id: string, req: Partial<MaintenanceRequest>) => void;
  onBulkUpdateRequests?: (ids: string[], req: Partial<MaintenanceRequest>) => void;
  canEdit: boolean;
  onDeleteRequest: (id: string) => void;
  onAddPaymentToRequest?: (requestId: string, payment: { amount: number; paymentMethod: 'cash' | 'click' | 'cheque'; date: string; notes?: string }) => void;
  onDeletePaymentFromRequest?: (requestId: string, paymentId: string) => void;
  prefilledDate?: string;
  onClearPrefilledDate?: () => void;
}

export default function MaintenanceManager({
  requests,
  customers,
  parts,
  lang,
  onAddRequest,
  onUpdateRequest,
  onBulkUpdateRequests,
  onDeleteRequest,
  onAddPaymentToRequest,
  onDeletePaymentFromRequest,
  canEdit,
  prefilledDate,
  onClearPrefilledDate,
}: MaintenanceManagerProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Dedicated Payment Modal State
  const [paymentModalReq, setPaymentModalReq] = useState<MaintenanceRequest | null>(null);
  const [newDepositAmount, setNewDepositAmount] = useState<string>('');
  const [newDepositMethod, setNewDepositMethod] = useState<'cash' | 'click' | 'cheque'>('cash');
  const [newDepositDate, setNewDepositDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newDepositNotes, setNewDepositNotes] = useState<string>('');
  const [paymentSuccessToast, setPaymentSuccessToast] = useState(false);

  // Form fields
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [problemType, setProblemType] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [requiredParts, setRequiredParts] = useState('');
  const [status, setStatus] = useState<MaintenanceRequest['status']>('in_progress');
  const [failureReason, setFailureReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<MaintenanceRequest['paymentMethod']>('none');
  const [amount, setAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Prefill date effect from calendar
  React.useEffect(() => {
    if (prefilledDate) {
      setCustomerName(customers[0]?.name || '');
      setPhoneNumber(customers[0]?.phoneNumber || '');
      setDate(prefilledDate);
      setTime('10:00');
      setProblemType('');
      setIsUrgent(false);
      setActionTaken('');
      setSelectedParts([]);
      setRequiredParts('');
      setStatus('in_progress');
      setFailureReason('');
      setPaymentMethod('none');
      setAmount(0);
      setPaidAmount(0);
      setEditingId(null);
      setShowForm(true);
      if (onClearPrefilledDate) {
        onClearPrefilledDate();
      }
    }
  }, [prefilledDate]);

  // Keep payment modal request in sync with parent requests updates
  React.useEffect(() => {
    if (paymentModalReq) {
      const updated = requests.find((r) => r.id === paymentModalReq.id);
      if (updated) {
        setPaymentModalReq(updated);
      }
    }
  }, [requests]);

  // Search/Filter logic
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.phoneNumber.includes(searchTerm) ||
      req.problemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.id && req.id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesUrgency =
      urgencyFilter === 'all' ||
      (urgencyFilter === 'urgent' && req.isUrgent) ||
      (urgencyFilter === 'normal' && !req.isUrgent);

    const paid = req.paidAmount ?? (req.paymentMethod !== 'none' ? req.amount : 0);
    const isPaidFull = paid >= req.amount && req.amount > 0;
    const isPaidPartial = paid > 0 && paid < req.amount;
    const isUnpaid = paid === 0 || !paid;

    const matchesPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'paid_full' && isPaidFull) ||
      (paymentFilter === 'paid_partial' && isPaidPartial) ||
      (paymentFilter === 'unpaid' && isUnpaid);

    return matchesSearch && matchesStatus && matchesUrgency && matchesPayment;
  });

  // Financial statistics from filtered requests
  const totalAmountSum = filteredRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalPaidSum = filteredRequests.reduce(
    (sum, r) => sum + (r.paidAmount ?? (r.paymentMethod !== 'none' ? r.amount : 0)),
    0
  );
  const totalRemainingSum = Math.max(0, totalAmountSum - totalPaidSum);

  // Handle Select All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRequests.map((req) => req.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle Single Item Select
  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  // Handle Bulk Status Update
  const handleBulkStatusUpdate = (newStatus: MaintenanceRequest['status']) => {
    if (onBulkUpdateRequests) {
      onBulkUpdateRequests(selectedIds, { status: newStatus });
    } else {
      selectedIds.forEach((id) => {
        onUpdateRequest(id, { status: newStatus });
      });
    }
    setSelectedIds([]);
  };

  // Handle open form for creating new order
  const handleOpenNewForm = () => {
    setCustomerName(customers[0]?.name || '');
    setIsCustomCustomer(false);
    setPhoneNumber(customers[0]?.phoneNumber || '');
    setPhoneError('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('10:00');
    setProblemType('');
    setIsUrgent(false);
    setActionTaken('');
    setSelectedParts([]);
    setRequiredParts('');
    setStatus('in_progress');
    setFailureReason('');
    setPaymentMethod('none');
    setAmount(0);
    setPaidAmount(0);
    setEditingId(null);
    setShowForm(true);
  };

  // Handle open form for editing existing order
  const handleOpenEditForm = (req: MaintenanceRequest) => {
    setCustomerName(req.customerName);
    const found = customers.find((c) => c.name === req.customerName);
    setIsCustomCustomer(!found);
    setPhoneNumber(req.phoneNumber);
    setPhoneError('');
    setDate(req.date);
    setTime(req.time);
    setProblemType(req.problemType);
    setIsUrgent(req.isUrgent);
    setActionTaken(req.actionTaken);
    setSelectedParts(req.installedParts);
    setRequiredParts(req.requiredParts);
    setStatus(req.status);
    setFailureReason(req.failureReason);
    setPaymentMethod(req.paymentMethod);
    setAmount(req.amount);
    setPaidAmount(req.paidAmount ?? (req.paymentMethod !== 'none' ? req.amount : 0));
    setEditingId(req.id);
    setShowForm(true);
  };

  // Open dedicated payment modal for a specific request
  const handleOpenPaymentModal = (req: MaintenanceRequest) => {
    const paid = req.paidAmount ?? (req.paymentMethod !== 'none' ? req.amount : 0);
    const remaining = Math.max(0, req.amount - paid);
    setPaymentModalReq(req);
    setNewDepositAmount(remaining > 0 ? remaining.toString() : '');
    setNewDepositMethod(req.paymentMethod !== 'none' ? req.paymentMethod : 'cash');
    setNewDepositDate(new Date().toISOString().split('T')[0]);
    setNewDepositNotes('');
  };

  // Handle selecting preset customer
  const handleCustomerSelect = (value: string) => {
    if (value === 'custom') {
      setIsCustomCustomer(true);
      setCustomerName('');
      setPhoneNumber('');
    } else {
      setIsCustomCustomer(false);
      setCustomerName(value);
      const found = customers.find((c) => c.name === value);
      if (found) {
        setPhoneNumber(found.phoneNumber);
      }
    }
  };

  // Toggle parts selection
  const handlePartToggle = (partName: string, partPrice: number) => {
    let updatedParts = [...selectedParts];
    if (updatedParts.includes(partName)) {
      updatedParts = updatedParts.filter((p) => p !== partName);
      setAmount((prev) => Math.max(0, prev - partPrice));
    } else {
      updatedParts.push(partName);
      setAmount((prev) => prev + partPrice);
    }
    setSelectedParts(updatedParts);
  };

  // Handle submit form (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneNumber && phoneNumber.trim() !== '') {
      const cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
      const isValid = /^\d{9,15}$/.test(cleaned);
      if (!isValid) {
        setPhoneError(t.phoneLengthError);
        return;
      }
    }
    setPhoneError('');

    const effectivePaid = Math.min(amount, Math.max(0, paidAmount));
    let effectivePaymentMethod = paymentMethod;
    if (effectivePaid > 0 && effectivePaymentMethod === 'none') {
      effectivePaymentMethod = 'cash';
    } else if (effectivePaid === 0) {
      effectivePaymentMethod = 'none';
    }

    const requestData: any = {
      customerName,
      phoneNumber,
      date,
      time,
      problemType,
      isUrgent,
      actionTaken,
      installedParts: selectedParts,
      requiredParts,
      status,
      failureReason: status === 'not_ready' ? failureReason : '',
      paymentMethod: effectivePaymentMethod,
      amount,
      paidAmount: effectivePaid,
    };

    if (editingId) {
      onUpdateRequest(editingId, requestData);
    } else {
      if (effectivePaid > 0) {
        requestData.payments = [
          {
            id: `pay-${Date.now()}`,
            amount: effectivePaid,
            date: date || new Date().toISOString().split('T')[0],
            paymentMethod: effectivePaymentMethod === 'none' ? 'cash' : effectivePaymentMethod,
            notes: isRtl ? 'دفعة أولية مسجلة عند إنشاء الطلب' : 'Initial deposit recorded at request creation',
          },
        ];
      }
      onAddRequest(requestData);
    }

    setShowForm(false);
  };

  // Handle adding payment to specific request from the Payment Modal
  const handleRecordDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalReq) return;

    const parsedDeposit = parseFloat(newDepositAmount);
    if (isNaN(parsedDeposit) || parsedDeposit <= 0) {
      return;
    }

    if (onAddPaymentToRequest) {
      onAddPaymentToRequest(paymentModalReq.id, {
        amount: parsedDeposit,
        paymentMethod: newDepositMethod,
        date: newDepositDate,
        notes: newDepositNotes,
      });
    } else {
      // Fallback: update request paidAmount directly
      const currentPaid = paymentModalReq.paidAmount ?? (paymentModalReq.paymentMethod !== 'none' ? paymentModalReq.amount : 0);
      const updatedPaid = currentPaid + parsedDeposit;
      const existingPayments = paymentModalReq.payments || [];
      const newPayment: MaintenancePayment = {
        id: `pay-${Date.now()}`,
        amount: parsedDeposit,
        date: newDepositDate,
        paymentMethod: newDepositMethod,
        notes: newDepositNotes,
      };

      onUpdateRequest(paymentModalReq.id, {
        paidAmount: updatedPaid,
        paymentMethod: newDepositMethod,
        payments: [...existingPayments, newPayment],
      });
    }

    setPaymentSuccessToast(true);
    setTimeout(() => {
      setPaymentSuccessToast(false);
    }, 2500);

    setNewDepositAmount('');
    setNewDepositNotes('');
  };

  // Handle Pay Full Remaining balance in 1-click
  const handlePayFullRemaining = () => {
    if (!paymentModalReq) return;
    const currentPaid = paymentModalReq.paidAmount ?? (paymentModalReq.paymentMethod !== 'none' ? paymentModalReq.amount : 0);
    const remaining = Math.max(0, paymentModalReq.amount - currentPaid);
    if (remaining <= 0) return;

    if (onAddPaymentToRequest) {
      onAddPaymentToRequest(paymentModalReq.id, {
        amount: remaining,
        paymentMethod: newDepositMethod,
        date: newDepositDate || new Date().toISOString().split('T')[0],
        notes: isRtl ? 'تسديد كامل المبلغ المتبقي' : 'Paid full remaining balance',
      });
    } else {
      const existingPayments = paymentModalReq.payments || [];
      const newPayment: MaintenancePayment = {
        id: `pay-${Date.now()}`,
        amount: remaining,
        date: newDepositDate || new Date().toISOString().split('T')[0],
        paymentMethod: newDepositMethod,
        notes: isRtl ? 'تسديد كامل المبلغ المتبقي' : 'Paid full remaining balance',
      };

      onUpdateRequest(paymentModalReq.id, {
        paidAmount: paymentModalReq.amount,
        paymentMethod: newDepositMethod,
        payments: [...existingPayments, newPayment],
      });
    }

    setPaymentSuccessToast(true);
    setTimeout(() => {
      setPaymentSuccessToast(false);
    }, 2500);

    setNewDepositAmount('');
  };

  // Handle Delete a Payment item from a request's history
  const handleDeletePaymentItem = (paymentId: string) => {
    if (!paymentModalReq) return;
    if (
      !window.confirm(
        isRtl ? 'هل أنت متأكد من حذف هذه الدفعة؟' : 'Are you sure you want to delete this payment record?'
      )
    )
      return;

    if (onDeletePaymentFromRequest) {
      onDeletePaymentFromRequest(paymentModalReq.id, paymentId);
    } else {
      const existingPayments = paymentModalReq.payments || [];
      const paymentToDelete = existingPayments.find((p) => p.id === paymentId);
      if (!paymentToDelete) return;

      const remainingPayments = existingPayments.filter((p) => p.id !== paymentId);
      const newPaidAmount = Math.max(0, (paymentModalReq.paidAmount || 0) - paymentToDelete.amount);

      onUpdateRequest(paymentModalReq.id, {
        paidAmount: newPaidAmount,
        payments: remainingPayments,
        paymentMethod: newPaidAmount > 0 ? paymentModalReq.paymentMethod : 'none',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-[#024B83] font-arabic flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#E5941A]" />
            {t.maintenanceSchedule}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-arabic">
            {isRtl
              ? 'تتبع وجدولة طلبات الصيانة وتحديد الدفعات المسددة لكل طلب منفصل وحساب المتبقي'
              : 'Track & schedule client hardware troubleshooting, define separate payments/deposits and balance'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenNewForm}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all font-arabic"
          >
            <PlusCircle className="w-4 h-4 text-[#E5941A]" />
            <span>{t.addRequest}</span>
          </button>
        )}
      </div>

      {/* Financial Overview Cards for Requests */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Cost */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 font-arabic">{t.totalAmount}</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {totalAmountSum.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#024B83] rounded-lg">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Total Collected Deposits */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-600 font-arabic">{t.totalCollectedDeposits}</span>
            <div className="text-xl font-black text-emerald-600 font-mono">
              {totalPaidSum.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Total Remaining Receivables */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-600 font-arabic">{t.totalReceivables}</span>
            <div className="text-xl font-black text-amber-600 font-mono">
              {totalRemainingSum.toFixed(2)} <span className="text-xs font-arabic">{t.jod}</span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Form (Slide Over or expandable Card) */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border-2 border-[#024B83]/30 shadow-md">
          <h3 className="text-md font-bold text-[#024B83] mb-6 border-b border-slate-100 pb-3 font-arabic flex items-center gap-1.5">
            <Wrench className="w-5 h-5 text-[#E5941A]" />
            {editingId ? t.editRequest : t.addRequest}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Customer selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                  {t.customerName}
                </label>
                <div className="space-y-2">
                  <select
                    value={isCustomCustomer ? 'custom' : customerName}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="custom">{isRtl ? 'زبون غير مسجل بالجدول...' : 'Custom customer...'}</option>
                  </select>

                  {/* If custom customer, show raw input field */}
                  {isCustomCustomer && (
                    <input
                      type="text"
                      required
                      placeholder={isRtl ? 'اكتب اسم الزبون الجديد' : 'Type customer name'}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                    />
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                  {t.phoneNumber}
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="079XXXXXXXX"
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                />
                {phoneError && (
                  <p className="text-red-500 text-[11px] font-semibold font-arabic mt-1.5 flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                  {t.isUrgent}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex-1 text-center justify-center">
                    <input
                      type="radio"
                      name="urgency"
                      checked={isUrgent}
                      onChange={() => setIsUrgent(true)}
                      className="text-[#024B83] focus:ring-[#024B83]"
                    />
                    <span className="text-xs font-bold text-red-600 font-arabic">{t.urgent}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex-1 text-center justify-center">
                    <input
                      type="radio"
                      name="urgency"
                      checked={!isUrgent}
                      onChange={() => setIsUrgent(false)}
                      className="text-[#024B83] focus:ring-[#024B83]"
                    />
                    <span className="text-xs font-bold text-slate-600 font-arabic">{t.normal}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Date and Time schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#024B83]" />
                  {t.date}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#024B83]" />
                  {t.time}
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                />
              </div>
            </div>

            {/* Problem description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                {t.problemType}
              </label>
              <textarea
                required
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                placeholder={isRtl ? 'وصف تفصيلي للمشكلة أو العطل وسبب الزيارة' : 'Describe the hardware problem'}
                rows={2}
                className="block w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83] font-arabic"
              />
            </div>

            {/* Action Taken & Parts section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-[#024B83] font-arabic uppercase tracking-wide">
                {isRtl ? 'المعطيات التقنية والإجراءات الفنية' : 'Technical Actions & Spare Parts'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 font-arabic">
                    {t.actionTaken}
                  </label>
                  <textarea
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder={isRtl ? 'ما هي الخطوات التي قمت بها لحل العطل؟' : 'Steps taken to solve the problem'}
                    rows={2}
                    className="block w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                  />
                </div>

                {/* Needed ordered parts */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 font-arabic">
                    {t.requiredParts}
                  </label>
                  <input
                    type="text"
                    value={requiredParts}
                    onChange={(e) => setRequiredParts(e.target.value)}
                    placeholder={isRtl ? 'مثال: شاشة لابتوب ديل كود ٤٠٤ (طلب خارجي)' : 'e.g. Dell replacement screen'}
                    className="block w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                  />
                </div>
              </div>

              {/* Multi-select pre-registered parts */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                  {isRtl ? 'اختر قطع الغيار التي تم تركيبها من مخزن الشركة (سيتم تحديث المبلغ تلقائياً):' : 'Select installed spare parts from register (amount updates automatically):'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {parts.map((p) => {
                    const isSelected = selectedParts.includes(p.name);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handlePartToggle(p.name, p.price)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1C7C43] text-white border-[#1C7C43]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className="opacity-80 font-mono">({p.price}د.أ)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Financial Status and Order Readiness */}
            <div className="bg-[#024B83]/5 p-4 rounded-xl border border-[#024B83]/10 space-y-4">
              <h4 className="text-xs font-bold text-[#024B83] font-arabic uppercase tracking-wide flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#E5941A]" />
                {isRtl ? 'حالة الطلب وحسابات الدفعة والتكاليف' : 'Order Status & Payment Breakdown'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Order Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                    {t.status}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="block w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                  >
                    <option value="ready" className="text-emerald-600 font-bold">
                      🟢 {t.ready}
                    </option>
                    <option value="in_progress" className="text-amber-500 font-bold">
                      🟡 {t.inProgress}
                    </option>
                    <option value="not_ready" className="text-red-500 font-bold">
                      🔴 {t.notReady}
                    </option>
                  </select>

                  {/* If not ready, show reason field */}
                  {status === 'not_ready' && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-semibold text-red-600 mb-1 font-arabic">
                        {t.reason}
                      </label>
                      <input
                        type="text"
                        required
                        value={failureReason}
                        onChange={(e) => setFailureReason(e.target.value)}
                        placeholder={isRtl ? 'الرجاء كتابة سبب عدم الجاهزية...' : 'Why is it not prepared?'}
                        className="block w-full py-1.5 px-3 bg-white border border-red-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  )}
                </div>

                {/* Total Cost / Amount */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                    {t.amountJOD}
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                      {t.jod}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="block w-full py-2 pl-3 pr-10 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-extrabold font-mono focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                    />
                  </div>
                </div>

                {/* Paid Deposit / Amount */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                    {t.paidAmount}
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                      {t.jod}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={amount || undefined}
                      step="any"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="block w-full py-2 pl-3 pr-10 bg-white border border-emerald-200 rounded-lg text-emerald-700 text-xs font-extrabold font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  {/* Quick toggle to mark fully paid */}
                  {amount > 0 && paidAmount !== amount && (
                    <button
                      type="button"
                      onClick={() => setPaidAmount(amount)}
                      className="mt-1.5 text-[10px] text-[#024B83] hover:underline font-bold font-arabic cursor-pointer flex items-center gap-1"
                    >
                      <span>⚡ {isRtl ? 'تحديد كمدفوع بالكامل' : 'Mark as full payment'}</span>
                    </button>
                  )}
                </div>

                {/* Payment Method for the deposit */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                    {t.paymentMethod}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="block w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83]"
                  >
                    <option value="none">{t.none}</option>
                    <option value="cash">{t.cash} (كاش)</option>
                    <option value="click">{t.click} (كليك)</option>
                    <option value="cheque">{t.cheque} (شيك)</option>
                  </select>

                  {/* Calculated remaining indicator */}
                  <div className="mt-2 text-[11px] font-bold text-slate-600 font-arabic flex items-center justify-between">
                    <span>{t.remainingAmount}:</span>
                    <span
                      className={`font-mono font-black ${
                        Math.max(0, amount - paidAmount) > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {Math.max(0, amount - paidAmount).toFixed(2)} {t.jod}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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

      {/* Search & Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`block w-full ${
              isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
            } py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#024B83] focus:border-[#024B83]`}
          />
        </div>

        {/* Payment status filter */}
        <div className="w-full md:w-48">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83] focus:border-[#024B83]"
          >
            <option value="all">{t.allPaymentStatuses}</option>
            <option value="paid_full">{t.paidFull}</option>
            <option value="paid_partial">{t.paidPartial}</option>
            <option value="unpaid">{t.unpaid}</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83] focus:border-[#024B83]"
          >
            <option value="all">{t.allStatuses}</option>
            <option value="ready">🟢 {t.ready}</option>
            <option value="in_progress">🟡 {t.inProgress}</option>
            <option value="not_ready">🔴 {t.notReady}</option>
          </select>
        </div>

        {/* Urgency filter */}
        <div className="w-full md:w-40">
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83] focus:border-[#024B83]"
          >
            <option value="all">{t.allUrgency}</option>
            <option value="urgent">🚨 {t.urgent}</option>
            <option value="normal">🗓️ {t.normal}</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-[#024B83]/5 p-3 rounded-xl border border-[#024B83]/10 flex items-center justify-between shadow-xs">
          <span className="text-xs font-bold text-[#024B83] font-arabic">
            {selectedIds.length} {isRtl ? 'عناصر محددة' : 'items selected'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusUpdate('ready')}
              className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              🟢 {t.ready}
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('in_progress')}
              className="px-3 py-1.5 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-lg hover:bg-amber-500 transition-colors cursor-pointer"
            >
              🟡 {t.inProgress}
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('not_ready')}
              className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
            >
              🔴 {t.notReady}
            </button>
          </div>
        </div>
      )}

      {/* Requests Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-arabic text-sm">
            {t.noActivity}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-2 py-2 md:px-4 md:py-3.5 text-center w-12">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-[#024B83] focus:ring-[#024B83] cursor-pointer w-4 h-4"
                      checked={filteredRequests.length > 0 && selectedIds.length === filteredRequests.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3.5 text-xs md:text-sm font-extrabold text-slate-700 font-arabic text-center">
                    {t.customerName}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3.5 text-xs md:text-sm font-extrabold text-slate-700 font-arabic text-center">
                    {t.phoneNumber}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3.5 text-xs md:text-sm font-extrabold text-slate-700 font-arabic text-center">
                    {t.time}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3.5 text-xs md:text-sm font-extrabold text-slate-700 font-arabic text-center">
                    {t.problemType}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3.5 text-xs md:text-sm font-extrabold text-slate-700 font-arabic text-center">
                    {isRtl ? 'الإجراء والقطع' : 'Action & Parts'}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3.5 text-xs md:text-sm font-extrabold text-slate-700 font-arabic text-center">
                    {t.status}
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3.5 text-xs md:text-sm font-extrabold text-slate-700 font-arabic text-center">
                    {isRtl ? 'الحسابات والدفعات' : 'Financials & Deposits'}
                  </th>
                  {canEdit && (
                    <th className="px-2 py-2 md:px-4 md:py-3.5 text-xs md:text-sm font-extrabold text-slate-700 font-arabic text-center">
                      {t.actions}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs md:text-sm font-semibold text-slate-700">
                {filteredRequests.map((req) => {
                  let statusLabel = '';
                  let statusBg = '';

                  switch (req.status) {
                    case 'ready':
                      statusLabel = t.ready;
                      statusBg = 'bg-emerald-500 text-white shadow-xs font-black';
                      break;
                    case 'in_progress':
                      statusLabel = t.inProgress;
                      statusBg = 'bg-amber-400 text-slate-900 shadow-xs font-black';
                      break;
                    case 'not_ready':
                      statusLabel = t.notReady;
                      statusBg = 'bg-red-500 text-white shadow-xs font-black';
                      break;
                  }

                  const isSelected = selectedIds.includes(req.id);

                  // Calculation for payment / deposit for this separate request
                  const currentPaid = req.paidAmount ?? (req.paymentMethod !== 'none' ? req.amount : 0);
                  const currentRemaining = Math.max(0, req.amount - currentPaid);
                  const isPaidFull = currentPaid >= req.amount && req.amount > 0;
                  const isPaidPartial = currentPaid > 0 && currentPaid < req.amount;
                  const isUnpaid = currentPaid === 0 || !currentPaid;

                  let paymentBadgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
                  let paymentBadgeLabel = t.unpaid;

                  if (isPaidFull) {
                    paymentBadgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    paymentBadgeLabel = t.paidFull;
                  } else if (isPaidPartial) {
                    paymentBadgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                    paymentBadgeLabel = `${t.paidPartial} (${currentPaid} ${t.jod})`;
                  }

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="px-2 py-3 md:px-4 md:py-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-[#024B83] focus:ring-[#024B83] cursor-pointer w-4 h-4"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(req.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-2 py-3 md:px-4 md:py-4 text-center font-black text-slate-900 text-base">
                        {req.customerName}
                      </td>
                      <td className="px-2 py-3 md:px-4 md:py-4 text-center">
                        <a
                          href={`tel:${req.phoneNumber}`}
                          className="inline-flex items-center gap-1.5 text-[#024B83] hover:underline font-mono font-black text-xs md:text-sm"
                          dir="ltr"
                        >
                          <Phone className="w-4 h-4 text-[#1A98D3]" />
                          {req.phoneNumber}
                        </a>
                      </td>
                      <td className="px-2 py-3 md:px-4 md:py-4 text-center text-slate-500 font-mono text-xs md:text-sm">
                        <div className="font-black">{req.date}</div>
                        <div className="text-[9px] md:text-[10px] text-slate-400 mt-1">{req.time}</div>
                      </td>
                      <td className="px-2 py-3 md:px-4 md:py-4 text-center text-slate-800 max-w-xs font-arabic whitespace-normal line-clamp-2 text-xs md:text-sm font-extrabold">
                        {req.problemType}
                        {req.isUrgent && (
                          <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-[9px] md:text-[10px] font-black bg-red-100 text-red-700 animate-pulse">
                            {t.urgent}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 md:px-4 md:py-4 text-center space-y-1.5 max-w-xs">
                        {req.actionTaken && (
                          <div className="text-xs md:text-sm text-slate-700 font-extrabold bg-slate-50 p-2 rounded-md text-right font-arabic">
                            <span className="text-[#024B83] font-black">📍 {t.actionTaken}:</span> {req.actionTaken}
                          </div>
                        )}
                        {req.installedParts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 justify-center">
                            {req.installedParts.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] md:text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                        {req.requiredParts && (
                          <div className="text-[9px] md:text-[10px] text-amber-700 font-black bg-amber-50 p-1.5 rounded-sm text-center border border-amber-100">
                            ⚠️ {isRtl ? 'طلب قطع:' : 'Required:'} {req.requiredParts}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3 md:px-4 md:py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5 justify-center">
                          <span
                            className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs md:text-sm ${statusBg}`}
                          >
                            {statusLabel}
                          </span>
                          {req.status === 'not_ready' && req.failureReason && (
                            <span className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-sm font-black max-w-[150px] truncate border border-red-100">
                              ({req.failureReason})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Financials & Separate Payments Column */}
                      <td className="px-2 py-3 md:px-4 md:py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="font-black text-slate-900 font-mono text-xs md:text-sm">
                            {req.amount} {t.jod}
                          </div>

                          {/* Payment status badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${paymentBadgeBg}`}
                          >
                            {paymentBadgeLabel}
                          </span>

                          {/* Remaining indicator if partial or unpaid */}
                          {currentRemaining > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 font-arabic">
                              {isRtl ? 'المتبقي:' : 'Rem:'} {currentRemaining.toFixed(2)} {t.jod}
                            </span>
                          )}

                          {/* Quick Payment Button */}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenPaymentModal(req)}
                              className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black rounded-md border border-emerald-200 shadow-2xs transition-all cursor-pointer font-arabic"
                              title={t.setPayment}
                            >
                              <Coins className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{t.setPayment}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      {canEdit && (
                        <td className="px-2 py-3 md:px-4 md:py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditForm(req)}
                              className="inline-flex items-center p-2 bg-slate-100 text-[#024B83] hover:bg-[#024B83] hover:text-white rounded-lg transition-colors cursor-pointer"
                              title={t.editRequest}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    isRtl
                                      ? 'هل أنت متأكد من حذف هذا الطلب؟'
                                      : 'Are you sure you want to delete this request?'
                                  )
                                ) {
                                  onDeleteRequest(req.id);
                                }
                              }}
                              className="inline-flex items-center p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title={isRtl ? 'حذف' : 'Delete'}
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

      {/* DEDICATED SEPARATE PAYMENT MODAL */}
      {paymentModalReq && (() => {
        const activePaymentReq = requests.find((r) => r.id === paymentModalReq.id) || paymentModalReq;
        const currentPaid = activePaymentReq.paidAmount ?? (activePaymentReq.paymentMethod !== 'none' ? activePaymentReq.amount : 0);
        const remaining = Math.max(0, activePaymentReq.amount - currentPaid);

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#024B83] font-arabic">
                    {t.quickPaymentModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500 font-arabic mt-0.5">
                    {isRtl ? 'للعميل:' : 'Client:'} <strong className="text-slate-800">{activePaymentReq.customerName}</strong> ({activePaymentReq.phoneNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalReq(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Toast */}
            {paymentSuccessToast && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-black font-arabic flex items-center gap-2 animate-bounce-slow">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'تم تسجيل الدفعة بنجاح وتحديث السجلات المالية!' : 'Payment logged successfully and synced!'}</span>
              </div>
            )}

            {/* Financial Overview for this Request */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold font-arabic">{t.totalAmount}</span>
                <div className="text-lg font-black font-mono text-slate-800">
                  {activePaymentReq.amount} <span className="text-[10px] font-arabic">{t.jod}</span>
                </div>
              </div>
              <div className="space-y-0.5 border-r border-l border-slate-200">
                <span className="text-[10px] text-emerald-600 font-bold font-arabic">{t.paidAmount}</span>
                <div className="text-lg font-black font-mono text-emerald-600">
                  {currentPaid.toFixed(2)} <span className="text-[10px] font-arabic">{t.jod}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-amber-600 font-bold font-arabic">{t.remainingAmount}</span>
                <div className="text-lg font-black font-mono text-amber-600">
                  {remaining.toFixed(2)} <span className="text-[10px] font-arabic">{t.jod}</span>
                </div>
              </div>
            </div>

            {/* Quick 1-Click Pay Full Remaining Button */}
            {remaining > 0 && (
              <button
                type="button"
                onClick={handlePayFullRemaining}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer font-arabic flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                <span>
                  {t.payRemainingNow} ({remaining.toFixed(2)} {t.jod})
                </span>
              </button>
            )}

            {/* Add New Separate Payment Form */}
            <form onSubmit={handleRecordDepositSubmit} className="space-y-4 bg-[#024B83]/5 p-4 rounded-xl border border-[#024B83]/10">
              <h4 className="text-xs font-black text-[#024B83] font-arabic flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-[#E5941A]" />
                <span>{t.addPaymentBtn}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Deposit Amount */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 font-arabic">
                    {t.depositAmount}
                  </label>
                  <input
                    type="number"
                    required
                    min="0.5"
                    step="any"
                    value={newDepositAmount}
                    onChange={(e) => setNewDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="block w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-black font-mono focus:outline-hidden focus:ring-2 focus:ring-[#024B83]"
                  />
                </div>

                {/* Deposit Payment Method */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 font-arabic">
                    {t.paymentMethod}
                  </label>
                  <select
                    value={newDepositMethod}
                    onChange={(e) => setNewDepositMethod(e.target.value as any)}
                    className="block w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#024B83]"
                  >
                    <option value="cash">{t.cash} (كاش)</option>
                    <option value="click">{t.click} (كليك)</option>
                    <option value="cheque">{t.cheque} (شيك)</option>
                  </select>
                </div>

                {/* Deposit Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 font-arabic">
                    {t.paymentDate}
                  </label>
                  <input
                    type="date"
                    required
                    value={newDepositDate}
                    onChange={(e) => setNewDepositDate(e.target.value)}
                    className="block w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#024B83]"
                  />
                </div>
              </div>

              {/* Deposit Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 font-arabic">
                  {t.paymentNotes}
                </label>
                <input
                  type="text"
                  value={newDepositNotes}
                  onChange={(e) => setNewDepositNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: دفعة مقدمة لشراء شاشة / استلام وصل نقدي' : 'e.g. Initial down payment for parts'}
                  className="block w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#024B83] font-arabic"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-black rounded-lg shadow-sm cursor-pointer transition-all font-arabic flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#E5941A]" />
                  <span>{t.addPaymentBtn}</span>
                </button>
              </div>
            </form>

            {/* Payment History Log for this specific request */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 font-arabic flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>{t.paymentHistory}</span>
              </h4>

              {(!activePaymentReq.payments || activePaymentReq.payments.length === 0) ? (
                <div className="py-6 text-center text-slate-400 text-xs font-arabic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {t.noPaymentsYet}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {activePaymentReq.payments.map((pmt, pIndex) => (
                    <div key={pmt.id || pIndex} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-emerald-600 font-mono">
                            +{pmt.amount} {t.jod}
                          </span>
                          <span className="px-2 py-0.5 rounded-sm bg-blue-50 text-[#024B83] text-[10px] font-black font-arabic">
                            {pmt.paymentMethod === 'cash' ? t.cash : pmt.paymentMethod === 'click' ? t.click : t.cheque}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{pmt.date}</span>
                        </div>
                        {pmt.notes && (
                          <p className="text-[11px] text-slate-600 font-arabic">{pmt.notes}</p>
                        )}
                      </div>

                      {/* Delete payment button */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDeletePaymentItem(pmt.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title={isRtl ? 'حذف هذه الدفعة' : 'Delete payment'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Close Footer */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalReq(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors font-arabic"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
