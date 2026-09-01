/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaintenanceRequest, Language, MaintenanceStatus } from '../types';
import { translations } from '../translations';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Edit,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';

interface AppointmentCalendarProps {
  requests: MaintenanceRequest[];
  lang: Language;
  onUpdateRequest: (id: string, updatedFields: Partial<MaintenanceRequest>) => void;
  canEdit: boolean;
  onNavigateToMaintenance: (prefilledDate?: string) => void;
}

export default function AppointmentCalendar({
  requests,
  lang,
  onUpdateRequest,
  canEdit,
  onNavigateToMaintenance,
}: AppointmentCalendarProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Date state (initially current date)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Selected single day view state
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );
  
  // Active selected appointment for modal
  const [selectedAppointment, setSelectedAppointment] = useState<MaintenanceRequest | null>(null);
  
  // Quick reschedule state
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Month names
  const arabicMonths = [
    'كانون الثاني (1)',
    'شباط (2)',
    'آذار (3)',
    'نيسان (4)',
    'أيار (5)',
    'حزيران (6)',
    'تموز (7)',
    'آب (8)',
    'أيلول (9)',
    'تشرين الأول (10)',
    'تشرين الثاني (11)',
    'كانون الأول (12)',
  ];

  const englishMonths = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekDaysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Helper to get days in month
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  // Helper to get starting day of week
  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay(); // 0 is Sunday, 6 is Saturday
  };

  const daysInCurrentMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayStr(today.toISOString().split('T')[0]);
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phoneNumber.includes(searchTerm) ||
      r.problemType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesUrgency =
      urgencyFilter === 'all' ||
      (urgencyFilter === 'urgent' && r.isUrgent) ||
      (urgencyFilter === 'normal' && !r.isUrgent);

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Map requests by date for rapid lookup
  const requestsByDate: { [key: string]: MaintenanceRequest[] } = {};
  filteredRequests.forEach((req) => {
    if (!requestsByDate[req.date]) {
      requestsByDate[req.date] = [];
    }
    requestsByDate[req.date].push(req);
  });

  // Format a calendar cell date to YYYY-MM-DD
  const formatDateString = (y: number, m: number, d: number) => {
    const formattedM = String(m + 1).padStart(2, '0');
    const formattedD = String(d).padStart(2, '0');
    return `${y}-${formattedM}-${formattedD}`;
  };

  // Build grid days
  const gridCells = [];

  // Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDayNum = daysInPrevMonth - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYearNum = month === 0 ? year - 1 : year;
    const dateStr = formatDateString(prevYearNum, prevMonthIdx, prevDayNum);
    gridCells.push({
      dayNum: prevDayNum,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Current month days
  const todayStr = new Date().toISOString().split('T')[0];
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const dateStr = formatDateString(year, month, i);
    gridCells.push({
      dayNum: i,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month padding days to complete standard 42 cell grid
  const totalCellsSoFar = gridCells.length;
  const remainingCells = 42 - totalCellsSoFar;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthIdx = month === 11 ? 0 : month + 1;
    const nextYearNum = month === 11 ? year + 1 : year;
    const dateStr = formatDateString(nextYearNum, nextMonthIdx, i);
    gridCells.push({
      dayNum: i,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Active day's appointments for the sidebar / details panel
  const activeDayAppointments = selectedDayStr ? requestsByDate[selectedDayStr] || [] : [];

  // Quick Status Updates from Calendar
  const handleQuickStatusChange = (reqId: string, newStatus: MaintenanceStatus) => {
    onUpdateRequest(reqId, { status: newStatus });
    
    // update current selected appointment state so modal updates instantly
    if (selectedAppointment && selectedAppointment.id === reqId) {
      setSelectedAppointment({
        ...selectedAppointment,
        status: newStatus,
      });
    }
  };

  // Rescheduling handler
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !rescheduleDate) return;

    onUpdateRequest(selectedAppointment.id, { date: rescheduleDate });
    
    // Update selected appt date in local view
    setSelectedAppointment({
      ...selectedAppointment,
      date: rescheduleDate,
    });
    
    setIsRescheduling(false);
    setRescheduleDate('');
    
    // If the rescheduled date matches the currently viewed calendar, select it!
    setSelectedDayStr(rescheduleDate);
  };

  return (
    <div className="space-y-6 pb-12 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-[#024B83] font-arabic flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#E5941A]" />
            {isRtl ? 'تقويم وجدولة مواعيد الصيانة والزيارات' : 'Maintenance Appointments Calendar'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-arabic">
            {isRtl
              ? 'تتبع وجدولة مواعيد الصيانة ومواقع الزبائن والزيارات والتحقق من الحالات اليومية من خلال واجهة التقويم التفاعلية'
              : 'Keep track of scheduled engineer field visits, client pickups, and repairs on a weekly/monthly interactive visual grid.'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => onNavigateToMaintenance(selectedDayStr || todayStr)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all font-arabic"
          >
            <Plus className="w-4 h-4 text-[#E5941A]" />
            <span>{isRtl ? 'حجز موعد صيانة جديد' : 'Schedule New Appointment'}</span>
          </button>
        )}
      </div>

      {/* Modern Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#024B83] font-arabic">
          <SlidersHorizontal className="w-4 h-4 text-[#E5941A]" />
          <span>{isRtl ? 'خيارات تصفية المواعيد على التقويم' : 'Calendar Appointment Filters'}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className={`absolute top-2.5 w-4 h-4 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`block w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#024B83] ${
                isRtl ? 'pr-9 pl-3 font-arabic' : 'pl-9 pr-3'
              }`}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83] font-arabic"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="ready">{t.ready}</option>
              <option value="in_progress">{t.inProgress}</option>
              <option value="not_ready">{t.notReady}</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83] font-arabic"
            >
              <option value="all">{t.allUrgency}</option>
              <option value="urgent">{t.urgent}</option>
              <option value="normal">{t.normal}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Calendar Section (Bento layout on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Calendar Month Matrix (Lg: Col span 8) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-6 lg:col-span-8 space-y-4">
          
          {/* Month Navigation Control Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-600 transition-colors border border-slate-100"
                title={isRtl ? 'الشهر السابق' : 'Previous Month'}
              >
                {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-600 transition-colors border border-slate-100"
                title={isRtl ? 'الشهر التالي' : 'Next Month'}
              >
                {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>

              {/* Month/Year Typography display */}
              <h3 className="text-sm sm:text-base font-black text-slate-900 font-arabic px-1 sm:px-2 min-w-[130px] text-center">
                {isRtl ? arabicMonths[month] : englishMonths[month]} {year}
              </h3>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={handleGoToToday}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors font-arabic"
              >
                {isRtl ? 'اليوم الحالي' : 'Today'}
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {/* Week day headers */}
            {(isRtl ? weekDaysAr : weekDaysEn).map((dayName, idx) => (
              <div
                key={idx}
                className="text-[10px] sm:text-xs font-black text-slate-400 py-1 font-arabic"
              >
                {dayName}
              </div>
            ))}

            {/* Matrix Cells */}
            {gridCells.map((cell, idx) => {
              const cellAppointments = requestsByDate[cell.dateStr] || [];
              const isSelected = selectedDayStr === cell.dateStr;

              // Compute cell borders/highlights
              let cellClass = 'bg-white text-slate-800';
              if (!cell.isCurrentMonth) {
                cellClass = 'bg-slate-50/50 text-slate-400';
              }
              if (cell.isToday) {
                cellClass = 'bg-blue-50/50 text-blue-700 border-2 border-[#024B83]/30 font-bold';
              }
              if (isSelected) {
                cellClass = 'bg-[#024B83]/5 text-slate-950 ring-2 ring-[#024B83] font-black z-10';
              }

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayStr(cell.dateStr)}
                  className={`min-h-[70px] sm:min-h-[100px] p-1 border border-slate-100 rounded-xl transition-all hover:bg-slate-50/70 cursor-pointer flex flex-col justify-between ${cellClass}`}
                >
                  {/* Top: Day Number and Badges indicators */}
                  <div className="flex items-center justify-between p-0.5">
                    <span className="text-[11px] sm:text-xs font-extrabold">{cell.dayNum}</span>
                    {cellAppointments.length > 0 && (
                      <span className="flex h-2 w-2 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cellAppointments.some(r => r.isUrgent) ? 'bg-red-500' : 'bg-[#E5941A]'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${cellAppointments.some(r => r.isUrgent) ? 'bg-red-500' : 'bg-[#E5941A]'}`}></span>
                      </span>
                    )}
                  </div>

                  {/* Middle: Tiny visual appointment badges */}
                  <div className="flex-1 space-y-1 mt-1 overflow-hidden select-none">
                    {cellAppointments.slice(0, 3).map((appt) => {
                      let badgeColor = '';
                      switch (appt.status) {
                        case 'ready':
                          badgeColor = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
                          break;
                        case 'in_progress':
                          badgeColor = 'bg-amber-500/10 text-amber-700 border-amber-500/20';
                          break;
                        case 'not_ready':
                          badgeColor = 'bg-red-500/10 text-red-700 border-red-500/20';
                          break;
                      }

                      return (
                        <div
                          key={appt.id}
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering day select twice
                            setSelectedDayStr(cell.dateStr);
                            setSelectedAppointment(appt);
                          }}
                          className={`text-[9px] font-bold px-1 py-0.5 rounded-md border truncate max-w-full block hover:brightness-95 transition-all text-right ${badgeColor}`}
                          title={`${appt.customerName} - ${appt.time}`}
                        >
                          <span className="font-mono text-[8px] opacity-80">{appt.time}</span> {appt.customerName}
                        </div>
                      );
                    })}

                    {cellAppointments.length > 3 && (
                      <div className="text-[8px] font-black text-slate-400 text-center">
                        + {cellAppointments.length - 3} {isRtl ? 'مواعيد أخرى' : 'more'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Daily Agenda Sidebar Panel (Lg: Col span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {/* Header displaying selected date */}
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xs font-bold text-[#024B83] font-arabic uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E5941A]" />
                <span>
                  {isRtl ? 'مواعيد يوم:' : 'Appointments for:'}{' '}
                  <span className="font-mono font-black text-[#1C7C43] ml-1">
                    {selectedDayStr || todayStr}
                  </span>
                </span>
              </h3>
            </div>

            {/* List of appointments for selected day */}
            <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto">
              {activeDayAppointments.length === 0 ? (
                <div className="text-center py-10">
                  <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400 font-arabic">
                    {isRtl ? 'لا توجد مواعيد وجدول صيانة مسجل في هذا اليوم.' : 'No maintenance orders scheduled for this day.'}
                  </p>
                  {canEdit && selectedDayStr && (
                    <button
                      onClick={() => onNavigateToMaintenance(selectedDayStr)}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#024B83] rounded-md cursor-pointer transition-colors font-arabic"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isRtl ? 'احجز موعداً لهذا اليوم' : 'Book on this Date'}
                    </button>
                  )}
                </div>
              ) : (
                activeDayAppointments.map((appt) => {
                  let statusBadge = '';
                  let statusText = '';
                  switch (appt.status) {
                    case 'ready':
                      statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                      statusText = t.ready;
                      break;
                    case 'in_progress':
                      statusBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                      statusText = t.inProgress;
                      break;
                    case 'not_ready':
                      statusBadge = 'bg-red-50 text-red-700 border-red-100';
                      statusText = t.notReady;
                      break;
                  }

                  return (
                    <div
                      key={appt.id}
                      onClick={() => setSelectedAppointment(appt)}
                      className={`p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:shadow-xs transition-all cursor-pointer space-y-2 ${
                        appt.isUrgent ? 'border-l-4 border-l-red-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#024B83] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {appt.time}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${statusBadge}`}>
                          {statusText}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-slate-900 font-arabic">{appt.customerName}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {appt.phoneNumber}
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-600 font-arabic line-clamp-2">
                        {appt.problemType}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100/70 pt-2 mt-1">
                        <span>{appt.amount} {t.jod}</span>
                        {appt.isUrgent && (
                          <span className="text-red-600 font-bold font-arabic flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            {isRtl ? 'مستعجل' : 'Urgent'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Appointment Details & Action Pop-Up Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden transform transition-all">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#024B83] font-arabic flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E5941A]" />
                <span>{isRtl ? 'تفاصيل موعد صيانة العميل' : 'Customer Maintenance Details'}</span>
              </h3>
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  setIsRescheduling(false);
                }}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Customer Profile Row */}
              <div className="bg-[#024B83]/5 p-4 rounded-xl border border-[#024B83]/10 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#024B83]" />
                  <span className="text-[11px] font-bold text-slate-500 font-arabic">{t.customerName}</span>
                </div>
                <h4 className="text-sm font-black text-slate-950 font-arabic pl-6">{selectedAppointment.customerName}</h4>
                <div className="flex items-center gap-4 text-xs font-mono pl-6 text-slate-600">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedAppointment.phoneNumber}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded-sm border text-slate-500 font-bold">
                    ID: {selectedAppointment.id}
                  </span>
                </div>
              </div>

              {/* Maintenance Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 font-arabic mb-0.5">{t.date}</span>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 block">
                    {selectedAppointment.date}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 font-arabic mb-0.5">{t.time}</span>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 block">
                    {selectedAppointment.time}
                  </span>
                </div>
              </div>

              {/* Problem/Fault type */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 font-arabic mb-1">{t.problemType}</span>
                <p className="text-xs text-slate-800 font-bold bg-slate-50 p-3 rounded-lg border border-slate-100 font-arabic leading-relaxed">
                  {selectedAppointment.problemType}
                </p>
              </div>

              {/* Action taken / Required items */}
              {(selectedAppointment.actionTaken || selectedAppointment.installedParts.length > 0) && (
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 font-arabic">{t.actionTaken}</span>
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs space-y-1.5 text-slate-800 font-arabic">
                    {selectedAppointment.actionTaken && <p className="font-bold">{selectedAppointment.actionTaken}</p>}
                    {selectedAppointment.installedParts.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5 border-t border-emerald-100">
                        {selectedAppointment.installedParts.map((p, i) => (
                          <span key={i} className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-2 py-0.5 rounded-md">
                            🔧 {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing & payment breakdown */}
              {(() => {
                if (!selectedAppointment) return null;
                const paid = selectedAppointment.paidAmount ?? (selectedAppointment.paymentMethod !== 'none' ? selectedAppointment.amount : 0);
                const remaining = Math.max(0, selectedAppointment.amount - paid);
                const isPaidFull = paid >= selectedAppointment.amount && selectedAppointment.amount > 0;
                const isPaidPartial = paid > 0 && paid < selectedAppointment.amount;
                
                return (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 font-arabic mb-0.5">{t.totalAmount}</span>
                        <span className="text-xs font-black text-[#024B83] font-mono">
                          {selectedAppointment.amount} {t.jod}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="block text-[10px] font-bold text-emerald-600 font-arabic mb-0.5">{t.paidAmount}</span>
                        <span className="text-xs font-black text-emerald-600 font-mono">
                          {paid.toFixed(2)} {t.jod}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="block text-[10px] font-bold text-amber-600 font-arabic mb-0.5">{t.remainingAmount}</span>
                        <span className="text-xs font-black text-amber-600 font-mono">
                          {remaining.toFixed(2)} {t.jod}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 font-arabic px-1 pt-1">
                      <span>{t.paymentStatus}:</span>
                      <span>
                        {isPaidFull && '🟢 ' + t.paidFull}
                        {isPaidPartial && '🟡 ' + `${t.paidPartial} (${paid} ${t.jod})`}
                        {!isPaidFull && !isPaidPartial && '🔴 ' + t.unpaid}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Failure reason if not prepared */}
              {selectedAppointment.status === 'not_ready' && selectedAppointment.failureReason && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 font-arabic">
                  <span className="font-extrabold block mb-0.5">{t.reason}:</span>
                  {selectedAppointment.failureReason}
                </div>
              )}

              {/* Status Indicator & Quick edit badges */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="block text-[10px] font-bold text-slate-400 font-arabic">{isRtl ? 'الحالة الحالية وإجراء تعديل سريع' : 'Status Actions'}</span>
                
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <>
                      <button
                        onClick={() => handleQuickStatusChange(selectedAppointment.id, 'ready')}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer font-arabic ${
                          selectedAppointment.status === 'ready'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : 'bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t.ready}
                      </button>

                      <button
                        onClick={() => handleQuickStatusChange(selectedAppointment.id, 'in_progress')}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer font-arabic ${
                          selectedAppointment.status === 'in_progress'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white hover:bg-amber-50 text-amber-600 border-amber-200'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        {t.inProgress}
                      </button>

                      <button
                        onClick={() => handleQuickStatusChange(selectedAppointment.id, 'not_ready')}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer font-arabic ${
                          selectedAppointment.status === 'not_ready'
                            ? 'bg-red-500 text-white border-red-500 shadow-xs'
                            : 'bg-white hover:bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {t.notReady}
                      </button>
                    </>
                  ) : (
                    <div className="w-full text-center py-1 bg-slate-50 border rounded-lg text-xs font-bold font-arabic text-slate-500">
                      {isRtl ? 'حالة الطلب الحالية:' : 'Current Status:'}{' '}
                      <span className="text-[#024B83]">
                        {selectedAppointment.status === 'ready' && t.ready}
                        {selectedAppointment.status === 'in_progress' && t.inProgress}
                        {selectedAppointment.status === 'not_ready' && t.notReady}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rescheduling Form inside modal */}
              {canEdit && (
                <div className="border-t border-slate-100 pt-4">
                  {!isRescheduling ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRescheduling(true);
                        setRescheduleDate(selectedAppointment.date);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#024B83] text-xs font-bold rounded-lg cursor-pointer transition-all font-arabic"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#E5941A]" />
                      <span>{isRtl ? 'إعادة جدولة موعد الزيارة / تغيير التاريخ' : 'Reschedule Visit Date'}</span>
                    </button>
                  ) : (
                    <form onSubmit={handleRescheduleSubmit} className="space-y-3 bg-slate-50 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 font-arabic">
                          {isRtl ? 'اختر تاريخ الصيانة الجديد:' : 'Select New Appointment Date:'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsRescheduling(false)}
                          className="text-[10px] text-red-500 hover:underline font-bold font-arabic"
                        >
                          {t.cancel}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="flex-1 py-1.5 px-3 bg-white border rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                        />
                        <button
                          type="submit"
                          className="px-4 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          {t.save}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedAppointment(null);
                  setIsRescheduling(false);
                }}
                className="px-4 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-300 transition-colors font-arabic"
              >
                {isRtl ? 'إغلاق النافذة' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
