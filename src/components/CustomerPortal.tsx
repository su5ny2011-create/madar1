/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaintenanceRequest, Language, Customer, Part } from '../types';
import { translations } from '../translations';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Wrench,
  CheckCircle,
  AlertCircle,
  Phone,
  User as UserIcon,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Printer,
  Sparkles,
  Ticket,
  FileText,
  BadgeAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Logo from './Logo';

interface CustomerPortalProps {
  requests: MaintenanceRequest[];
  customers: Customer[];
  parts: Part[];
  lang: Language;
  onAddRequest: (req: Omit<MaintenanceRequest, 'id'>) => void;
  onClose: () => void;
}

export default function CustomerPortal({
  requests,
  customers,
  parts,
  lang,
  onAddRequest,
  onClose,
}: CustomerPortalProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // PWA Installation state hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showiOSModal, setShowiOSModal] = useState(false);

  React.useEffect(() => {
    // Detect if app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone || 
                          document.referrer.includes('android-app://');
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Toggle iOS instruction guide
      setShowiOSModal(true);
    }
  };

  // Active view: 'book' or 'track'
  const [activePortalTab, setActivePortalTab] = useState<'book' | 'track'>('book');

  // New request form states
  const [custName, setCustName] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [problemType, setProblemType] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('10:00');
  
  // Completed booking ticket state
  const [createdTicket, setCreatedTicket] = useState<MaintenanceRequest | null>(null);

  // Tracking states
  const [trackingQuery, setTrackingQuery] = useState('');
  const [searchedRequests, setSearchedRequests] = useState<MaintenanceRequest[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Popular pre-made fault/problem types for quick click in booking form
  const commonProblemsAr = [
    'فورمات وتنزيل ويندوز مع البرامج',
    'تبديل شاشة لابتوب مكسورة',
    'تصليح مدخل شاحن وبطارية',
    'تنظيف مروحة اللابتوب وتبديل المعجون الحراري',
    'ترقية الرامات وقرص التخزين SSD سريع',
    'حل مشكلة الشاشة الزرقاء والتعليق',
  ];

  const commonProblemsEn = [
    'Windows OS installation & Drivers config',
    'Laptop screen replacement',
    'Power charging port & battery fix',
    'Laptop overheating cleanup & thermal paste',
    'RAM and super-fast SSD upgrade',
    'Blue screen of death & freezing repair',
  ];

  // Available hourly slots for booking (e.g. 9:00 AM to 6:00 PM)
  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  // Booking Form Submission Handler
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !problemType.trim()) return;

    // Validate phone number format (between 9 and 15 digits) if provided
    if (phoneNum.trim() !== '') {
      const cleaned = phoneNum.replace(/[\s\-\(\)\+]/g, '');
      const isValid = /^\d{9,15}$/.test(cleaned);
      if (!isValid) {
        setPhoneError(t.phoneLengthError);
        return;
      }
    }
    setPhoneError('');

    // Build the request object to pass to App
    const tempId = `req-cust-${Date.now()}`;
    const newReq: Omit<MaintenanceRequest, 'id'> = {
      customerName: custName.trim(),
      phoneNumber: phoneNum.trim(),
      date: selectedDate,
      time: selectedTime,
      problemType: problemType.trim(),
      isUrgent,
      actionTaken: '',
      installedParts: [],
      requiredParts: '',
      status: 'in_progress',
      failureReason: '',
      paymentMethod: 'none',
      amount: isUrgent ? 15 : 10, // typical estimation for general repair diagnostics
    };

    onAddRequest(newReq);

    // Save as local created ticket for display
    setCreatedTicket({
      id: tempId,
      ...newReq,
    });

    // Reset fields
    setCustName('');
    setPhoneNum('');
    setProblemType('');
    setIsUrgent(false);
  };

  // Tracking Search Handler
  const handleTrackingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;

    const trimmed = trackingQuery.trim().toLowerCase();
    const rawCleaned = trimmed.replace(/[\s\-\(\)\+]/g, '');
    const cleanDigits = rawCleaned.replace(/^0+/, ''); // strip leading zeroes

    // Search by smart phone number match or partial name or ID
    const results = requests.filter((r) => {
      const rClean = (r.phoneNumber || '').replace(/[\s\-\(\)\+]/g, '');
      const rDigits = rClean.replace(/^0+/, '');

      const phoneMatch =
        (r.phoneNumber && r.phoneNumber.includes(trimmed)) ||
        (cleanDigits.length >= 3 && (rClean.includes(rawCleaned) || rDigits.includes(cleanDigits) || cleanDigits.includes(rDigits)));

      const nameMatch = (r.customerName || '').toLowerCase().includes(trimmed);
      const idMatch = (r.id || '').toLowerCase().includes(trimmed);

      return phoneMatch || nameMatch || idMatch;
    });

    setSearchedRequests(results);
    setHasSearched(true);
  };

  const printTicket = () => {
    window.print();
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col font-sans transition-all duration-300 pb-12"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Header Navigation */}
      <header className="bg-[#024B83] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" showText={false} />
            <div>
              <h1 className="text-sm sm:text-base font-black font-arabic leading-tight">
                {isRtl ? 'بوابة زبائن المدار للكمبيوتر' : 'Al-Madar Customer Portal'}
              </h1>
              <p className="text-[9px] text-blue-100 font-arabic">
                {isRtl ? 'حجز مواعيد الصيانة وتتبع حالة الأجهزة' : 'Schedule repairs and check progress online'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAppInstalled && (
              <button
                onClick={handleInstallApp}
                className="flex items-center gap-1 bg-[#E5941A] hover:bg-[#c97f10] text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border border-[#E5941A]/15 font-arabic"
              >
                <span>📥 {isRtl ? 'تثبيت التطبيق' : 'Install App'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-white/5 font-arabic"
            >
              {isRtl ? '← عودة لتسجيل الدخول' : '← Back to Login'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Decoration */}
      <div className="bg-[#024B83] text-white pt-8 pb-16 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E5941A]/20 text-[#E5941A] rounded-full text-xs font-black font-arabic border border-[#E5941A]/30">
            <Sparkles className="w-3.5 h-3.5" />
            {isRtl ? 'خدمة متميزة وسريعة لراحتك' : 'Premium Express Service'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-arabic">
            {isRtl ? 'أهلاً بك في منصة الخدمة الذاتية للزبائن' : 'Welcome to Self-Service Client Hub'}
          </h2>
          <p className="text-xs text-blue-100 max-w-lg mx-auto font-arabic leading-relaxed">
            {isRtl
              ? 'احجز موعد صيانة لجهازك اللابتوب أو الكمبيوتر الشخصي، واختر الوقت المناسب لك، أو تتبع في أي وقت حالة جهازك الذي سلمته لمهندس الصيانة في مركزنا'
              : 'Submit a service order, reserve an exact tech-session slot, or track your active computer repair in real time.'}
          </p>
        </div>
      </div>

      {/* Main Container Content */}
      <div className="max-w-4xl w-full mx-auto px-4 -mt-10 flex-1">
        
        {/* Toggle Nav Tabs */}
        <div className="flex bg-white p-1 rounded-xl shadow-md border border-slate-100 max-w-md mx-auto mb-6">
          <button
            onClick={() => {
              setActivePortalTab('book');
              setCreatedTicket(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all font-arabic ${
              activePortalTab === 'book'
                ? 'bg-[#024B83] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            {isRtl ? 'طلب صيانة وحجز موعد' : 'Book Repair & Slot'}
          </button>
          <button
            onClick={() => setActivePortalTab('track')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all font-arabic ${
              activePortalTab === 'track'
                ? 'bg-[#024B83] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" />
            {isRtl ? 'تتبع حالة طلبك' : 'Track Repair Progress'}
          </button>
        </div>

        {/* PWA Installation Promo Banner */}
        {!isAppInstalled && showInstallBanner && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border-2 border-[#E5941A]/30 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3.5 text-center sm:text-right">
              <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-xs flex-shrink-0 border border-slate-100">
                <img src="/icon.svg" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="text-right">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 font-arabic">
                  {isRtl ? 'تنزيل تطبيق المدار على هاتفك المحمول 📱' : 'Install Al-Madar App on your Mobile Phone!'}
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500 font-arabic mt-0.5">
                  {isRtl
                    ? 'احصل على وصول أسرع ومباشر لحجز المواعيد وتتبع صيانة أجهزتك بدون متصفح وبسرعة فائقة!'
                    : 'Access fast bookings, instant status tracking, and offline support directly from your home screen.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleInstallApp}
                className="px-4 py-2 bg-[#E5941A] hover:bg-[#c97f10] text-white text-xs font-black rounded-lg shadow-xs transition-all cursor-pointer font-arabic flex items-center gap-1.5"
              >
                <span>📥 {isRtl ? 'تثبيت التطبيق الآن' : 'Download Now'}</span>
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold font-arabic cursor-pointer"
              >
                {isRtl ? 'تجاهل' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}

        {/* iOS Step-by-Step Installation Modal */}
        {showiOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-in" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                  <img src="/icon.svg" alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-sm font-black text-[#024B83] font-arabic">
                  {isRtl ? 'تثبيت التطبيق على جهاز الأيفون (iOS)' : 'Install on Apple iOS Devices'}
                </h3>
                <p className="text-[11px] text-slate-500 font-arabic leading-relaxed">
                  {isRtl
                    ? 'نظراً لأن نظام iOS لا يتيح التثبيت التلقائي المباشر، يمكنك إضافته يدوياً باتباع الخطوات البسيطة التالية:'
                    : 'Since iOS doesn\'t support automatic one-tap prompts, please follow these simple steps to install Al-Madar Tech:'}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-3.5 border border-slate-150 text-xs font-bold text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#024B83] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                  <p className="font-arabic leading-tight">
                    {isRtl ? 'اضغط على زر المشاركة (Share) في أسفل متصفح سفاري 📤' : 'Tap the Share button 📤 in your Safari browser navigation bar.'}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#024B83] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                  <p className="font-arabic leading-tight">
                    {isRtl ? 'قم بالتمرير للأسفل واختر "إضافة إلى الشاشة الرئيسية" ➕' : 'Scroll down and select "Add to Home Screen" ➕'}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#024B83] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                  <p className="font-arabic leading-tight">
                    {isRtl ? 'اضغط على "إضافة" (Add) في الزاوية العلوية اليمنى للتأكيد 🎉' : 'Tap "Add" in the top-right corner to pin the icon to your screen!'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowiOSModal(false)}
                className="w-full py-2 bg-[#024B83] text-white text-xs font-black rounded-lg cursor-pointer hover:bg-[#0b4c80] transition-colors font-arabic"
              >
                {isRtl ? 'فهمت، شكراً لك' : 'I Understand'}
              </button>
            </div>
          </div>
        )}

        {/* Dynamic portal panels */}
        {activePortalTab === 'book' ? (
          <div>
            {!createdTicket ? (
              /* BOOKING FORM */
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-8">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-base font-black text-[#024B83] font-arabic flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-[#E5941A]" />
                    {isRtl ? 'تعبئة معلومات الطلب وجدولة الموعد' : 'New Maintenance Request & Time Reservation'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-arabic">
                    {isRtl
                      ? 'يرجى إدخال اسمك الثنائي ورقم هاتفك ووصف جهازك بشكل دقيق لمساعدتنا في تقديم أفضل جودة تصليح'
                      : 'Please insert your name, cellular phone and select a suitable physical drop-off hour slot.'}
                  </p>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 font-arabic mb-2">
                        {isRtl ? 'اسم الزبون الثنائي / الثلاثي' : 'Customer Full Name'}
                      </label>
                      <div className="relative rounded-lg shadow-xs">
                        <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3 left-auto' : 'left-0 pl-3 pr-auto'} flex items-center pointer-events-none`}>
                          <UserIcon className="h-4 h-4 text-[#024B83]" />
                        </div>
                        <input
                          type="text"
                          required
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          placeholder={isRtl ? 'مثال: أحمد الزعبي' : 'e.g. Ahmad Al-Zoubi'}
                          className={`block w-full ${
                            isRtl ? 'pr-9 pl-3 text-right font-arabic' : 'pl-9 pr-3 text-left'
                          } py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#024B83]`}
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 font-arabic mb-2">
                        {isRtl ? 'رقم الهاتف للتواصل وإشعارك' : 'Active Mobile Phone Number'}
                      </label>
                      <div className="relative rounded-lg shadow-xs">
                        <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3 left-auto' : 'left-0 pl-3 pr-auto'} flex items-center pointer-events-none`}>
                          <Phone className="h-4 h-4 text-[#024B83]" />
                        </div>
                        <input
                          type="text"
                          value={phoneNum}
                          onChange={(e) => {
                            setPhoneNum(e.target.value);
                            setPhoneError('');
                          }}
                          placeholder="07xxxxxxxx"
                          className={`block w-full ${
                            isRtl ? 'pr-9 pl-3 text-right font-mono font-bold' : 'pl-9 pr-3 text-left'
                          } py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#024B83]`}
                        />
                      </div>
                      {phoneError && (
                        <p className="text-red-500 text-xs font-semibold font-arabic mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {phoneError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Problem Description with Quick Hints */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-arabic mb-2">
                      {isRtl ? 'وصف المشكلة ونوع الجهاز المراد صيانته' : 'Fault description & Computer model'}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={problemType}
                      onChange={(e) => setProblemType(e.target.value)}
                      placeholder={isRtl ? 'مثال: لابتوب Dell Inspiron، المروحة تصدر صوتاً مرتفعاً ويرتفع حرارته كثيراً عند تشغيل اليوتيوب' : 'e.g. HP Elitebook laptop overheating and shuts down during zoom calls'}
                      className="block w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#024B83] font-arabic"
                    />

                    {/* Clickable popular shortcuts for rapid form-fill */}
                    <div className="mt-2.5">
                      <span className="text-[10px] text-slate-400 block mb-1.5 font-bold font-arabic">
                        {isRtl ? '💡 أعطال شائعة (انقر للاختيار التلقائي):' : '💡 Common issues (click to autofill):'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(isRtl ? commonProblemsAr : commonProblemsEn).map((prob, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setProblemType(prob)}
                            className="text-[10px] bg-slate-100 hover:bg-[#024B83]/10 hover:text-[#024B83] border border-slate-200 hover:border-[#024B83]/20 px-2.5 py-1 rounded-md text-slate-600 font-arabic font-bold cursor-pointer transition-colors"
                          >
                            + {prob}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Urgency selection */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 font-arabic mb-2">
                      {isRtl ? 'أهمية الصيانة والسرعة المطلوبة' : 'Maintenance Urgency Selection'}
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex-1 justify-center">
                        <input
                          type="radio"
                          name="custUrgent"
                          checked={!isUrgent}
                          onChange={() => setIsUrgent(false)}
                          className="text-[#024B83]"
                        />
                        <span className="text-xs font-bold text-slate-700 font-arabic">
                          {isRtl ? 'عادي (مقدر: 10 د.أ)' : 'Normal Drop-off (Estimated 10 JOD)'}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 flex-1 justify-center">
                        <input
                          type="radio"
                          name="custUrgent"
                          checked={isUrgent}
                          onChange={() => setIsUrgent(true)}
                          className="text-[#024B83]"
                        />
                        <span className="text-xs font-bold text-red-600 font-arabic flex items-center gap-1">
                          <BadgeAlert className="w-3.5 h-3.5" />
                          {isRtl ? 'مستعجل فوري (مقدر: 15 د.أ)' : 'Urgent Express (Estimated 15 JOD)'}
                        </span>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-arabic">
                      {isRtl
                        ? '* الأسعار المبينة تقديرية للفحص والتشخيص المبدئي وقد تختلف بناءً على قطع الغيار المطلوبة للتصليح الفعلي'
                        : '* Prices are starting diagnostics estimations. Final bill may vary based on actual hardware replacements.'}
                    </p>
                  </div>

                  {/* Date & Time selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Choose Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 font-arabic mb-2">
                        {isRtl ? 'اختر تاريخ حجز الموعد' : 'Select drop-off date'}
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="block w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#024B83]"
                      />
                    </div>

                    {/* Hourly slots grid */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 font-arabic mb-2">
                        {isRtl ? 'اختر الساعة المناسبة للتسليم' : 'Select drop-off hour'}
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {timeSlots.map((slot) => {
                          const isSelected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2 text-[11px] font-mono font-bold rounded-lg border text-center cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[#E5941A] text-white border-[#E5941A] shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-200 transition-colors font-arabic"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-2.5 bg-[#024B83] text-white text-xs font-extrabold rounded-lg shadow-md hover:bg-[#0b4c80] transition-colors font-arabic cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4 text-[#E5941A]" />
                      {isRtl ? 'تأكيد الحجز وتقديم الطلب' : 'Confirm & Reserve Slot'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* SUCCESS TICKET STATE */
              <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-500/30 overflow-hidden max-w-xl mx-auto p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-emerald-800 font-arabic">
                    {isRtl ? 'تم تسجيل طلب الصيانة بنجاح وبشكل مباشر!' : 'Appointment Booked Successfully!'}
                  </h3>
                  <p className="text-xs text-slate-500 font-arabic">
                    {isRtl
                      ? 'تم تسجيل الموعد على تقويم المهندس المناوب. يرجى إحضار لابتوبك في الموعد المحدد ومرافقة تذكرة الحجز أدناه'
                      : 'Your drop-off slot is registered on our live engineering schedule. Show the ticket details below upon arrival.'}
                  </p>
                </div>

                {/* Aesthetic ticket */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden divide-y divide-dashed divide-slate-300">
                  
                  {/* Ticket Header */}
                  <div className="p-4 bg-[#024B83] text-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-5 h-5 text-[#E5941A]" />
                      <span className="text-xs font-black font-arabic tracking-wide">{isRtl ? 'تذكرة مراجعة صيانة' : 'Repair Entry Pass'}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-sm">
                      Al-Madar Tech
                    </span>
                  </div>

                  {/* Ticket Body */}
                  <div className="p-4 sm:p-5 space-y-4 text-xs font-medium text-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-arabic">{isRtl ? 'اسم الزبون:' : 'Customer Name:'}</span>
                        <span className="font-extrabold text-slate-900 font-arabic">{createdTicket.customerName}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-arabic">{isRtl ? 'رقم الهاتف:' : 'Phone Number:'}</span>
                        <span className="font-mono font-bold text-slate-900">{createdTicket.phoneNumber}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-arabic">{isRtl ? 'تاريخ الحجز:' : 'Appointment Date:'}</span>
                        <span className="font-mono font-extrabold text-[#1C7C43]">{createdTicket.date}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-arabic">{isRtl ? 'الساعة والموعد:' : 'drop-off Hour:'}</span>
                        <span className="font-mono font-extrabold text-[#1C7C43] flex items-center gap-1 justify-start">
                          <Clock className="w-3.5 h-3.5 text-[#E5941A]" />
                          {createdTicket.time}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 font-arabic">{isRtl ? 'جهازك / العطل الموصوف:' : 'Device Diagnostic details:'}</span>
                      <p className="bg-white p-2.5 rounded border border-slate-150 font-bold text-slate-800 font-arabic">
                        {createdTicket.problemType}
                      </p>
                    </div>

                    <div className="flex items-center justify-between bg-slate-100 p-2 rounded text-[10px] text-slate-500 font-arabic font-bold">
                      <span>{isRtl ? 'الأهمية:' : 'Priority:'} {createdTicket.isUrgent ? (isRtl ? '🔴 مستعجل' : '🔴 Urgent') : (isRtl ? '🔵 عادي' : '🔵 Normal')}</span>
                      <span>{isRtl ? 'الكلفة التقديرية للتشخيص:' : 'Drop-off Estimation:'} <strong className="text-[#024B83] text-xs">{createdTicket.amount} {t.jod}</strong></span>
                    </div>
                  </div>

                  {/* Ticket Footer / simulated barcode */}
                  <div className="p-4 bg-white text-center space-y-2">
                    {/* Simulated barcode graphic lines */}
                    <div className="flex justify-center items-stretch h-8 gap-[1.5px] select-none opacity-80">
                      {[1,3,1,2,4,1,2,3,1,4,1,2,1,3,2,1,4,1,2,3,1,2,4,1].map((w, i) => (
                        <div key={i} className="bg-slate-900" style={{ width: `${w}px` }}></div>
                      ))}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      REF-ID: {createdTicket.id}
                    </div>
                  </div>
                </div>

                {/* Print button & book another */}
                <div className="flex gap-2">
                  <button
                    onClick={printTicket}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors font-arabic"
                  >
                    <Printer className="w-4 h-4 text-[#024B83]" />
                    {isRtl ? 'طباعة التذكرة وحفظها' : 'Print Ticket'}
                  </button>
                  <button
                    onClick={() => setCreatedTicket(null)}
                    className="flex-1 py-2.5 bg-[#024B83] text-white text-xs font-black rounded-lg cursor-pointer hover:bg-[#0b4c80] transition-colors font-arabic"
                  >
                    {isRtl ? 'حجز موعد لجهاز آخر' : 'Schedule Another laptop'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* REPAIR TRACKING PANEL */
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-[#024B83] font-arabic flex items-center gap-2">
                <Search className="w-5 h-5 text-[#E5941A]" />
                {isRtl ? 'تتبع فوري لحالة جهازك والقطع المصانة' : 'Track Repair Progress & Invoices'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-arabic">
                {isRtl
                  ? 'أدخل رقم الهاتف الذي سجلت به الطلب أو كود المراجعة للتحقق من جهوزية جهازك وما تم تركيبه من قطع وملاحظات الفني'
                  : 'Enter your drop-off phone number or reservation code to retrieve live diagnostics reports.'}
              </p>
            </div>

            {/* Tracking search bar form */}
            <form onSubmit={handleTrackingSearch} className="flex gap-2 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className={`absolute top-2.5 w-4 h-4 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  required
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  placeholder={isRtl ? 'أدخل رقم الهاتف (مثال 0795555555) أو كود الطلب' : 'Enter phone number or request ID'}
                  className={`block w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83] ${
                    isRtl ? 'pr-9 pl-3 font-arabic' : 'pl-9 pr-3'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer font-arabic transition-all"
              >
                {isRtl ? 'بحث ومتابعة' : 'Search'}
              </button>
            </form>

            {/* Tracking Results Area */}
            {hasSearched && (
              <div className="space-y-6 pt-2">
                {searchedRequests.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed p-4">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500 font-arabic">
                      {isRtl
                        ? 'لم نجد أي طلبات صيانة مسجلة بالرقم المدخل أو الرمز المحدد حالياً.'
                        : 'No active repair orders found for the search query.'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-arabic">
                      {isRtl
                        ? '* يرجى التأكد من كتابة الرقم بشكل صحيح أو التواصل مع المعرض عبر رقم الهاتف'
                        : '* Please double-check your cellular digits or ask support for assistance.'}
                    </p>
                  </div>
                ) : (
                  searchedRequests.map((appt) => {
                    // Progress timeline step computed from status
                    const isReady = appt.status === 'ready';
                    const isInProgress = appt.status === 'in_progress';
                    const isNotReady = appt.status === 'not_ready';

                    return (
                      <div
                        key={appt.id}
                        className="border border-slate-200 rounded-xl p-5 space-y-6 bg-slate-50/30"
                      >
                        {/* Title details & ID bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 font-arabic">{isRtl ? 'طلب العميل:' : 'Customer Name:'}</span>
                            <h4 className="text-xs font-black text-slate-900 font-arabic">{appt.customerName}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-white border text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shadow-2xs">
                              ID: {appt.id}
                            </span>
                            <span className="bg-white border text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shadow-2xs">
                              📅 {appt.date} ({appt.time})
                            </span>
                          </div>
                        </div>

                        {/* Interactive Step-by-Step Progress Bar timeline */}
                        <div className="py-4">
                          <div className="relative flex justify-between items-center max-w-md mx-auto">
                            {/* Connector line */}
                            <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 -z-10">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{
                                  width: isReady ? '100%' : isInProgress ? '50%' : '0%',
                                }}
                              ></div>
                            </div>

                            {/* Step 1: Dropoff */}
                            <div className="flex flex-col items-center text-center">
                              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                📥
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 mt-1 font-arabic">
                                {isRtl ? 'تم الاستلام' : 'Received'}
                              </span>
                            </div>

                            {/* Step 2: Diagnostics / Work */}
                            <div className="flex flex-col items-center text-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                                isReady || isInProgress
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-400'
                              }`}>
                                🔧
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 mt-1 font-arabic">
                                {isRtl ? 'قيد الفحص والتصليح' : 'In Progress'}
                              </span>
                            </div>

                            {/* Step 3: Finished / Ready */}
                            <div className="flex flex-col items-center text-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                                isReady
                                  ? 'bg-emerald-500 text-white animate-bounce-slow'
                                  : isNotReady
                                  ? 'bg-red-500 text-white'
                                  : 'bg-slate-200 text-slate-400'
                              }`}>
                                {isNotReady ? '⚠️' : '✅'}
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 mt-1 font-arabic">
                                {isNotReady
                                  ? (isRtl ? 'لم يتم التجهيز' : 'Not Ready')
                                  : (isRtl ? 'جاهز للاستلام 🌟' : 'Ready for pickup')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Report & pricing details */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="block text-[10px] text-slate-400 font-arabic">{isRtl ? 'العطل المسجل:' : 'Reported Fault:'}</span>
                              <p className="text-xs font-bold text-slate-800 font-arabic">{appt.problemType}</p>
                            </div>

                            {appt.actionTaken && (
                              <div>
                                <span className="block text-[10px] text-slate-400 font-arabic">{isRtl ? 'الإجراء المتخذ وصيانة الفني:' : 'Engineer Actions Taken:'}</span>
                                <p className="text-xs font-extrabold text-emerald-800 font-arabic">🛠️ {appt.actionTaken}</p>
                              </div>
                            )}
                          </div>

                          {/* Installed parts list */}
                          {appt.installedParts.length > 0 && (
                            <div className="border-t border-slate-100 pt-3">
                              <span className="block text-[10px] text-slate-400 font-arabic mb-1">{isRtl ? 'القطع التي تم تركيبها للجهاز:' : 'Installed Computer Hardware Parts:'}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {appt.installedParts.map((part, index) => (
                                  <span
                                    key={index}
                                    className="bg-emerald-50 text-emerald-800 border border-emerald-150 text-[10px] font-black px-2.5 py-0.5 rounded-md"
                                  >
                                    ⚙️ {part}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Total fees & Payment breakdown */}
                          {(() => {
                            if (!appt) return null;
                            const paid = appt.paidAmount ?? (appt.paymentMethod !== 'none' ? appt.amount : 0);
                            const remaining = Math.max(0, appt.amount - paid);
                            const isPaidFull = paid >= appt.amount && appt.amount > 0;
                            const isPaidPartial = paid > 0 && paid < appt.amount;
                            return (
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                                    <span className="block text-[10px] text-slate-400 font-arabic">{isRtl ? 'إجمالي التكلفة:' : 'Total Cost:'}</span>
                                    <span className="text-xs font-black text-slate-900 font-mono">{appt.amount} {t.jod}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                                    <span className="block text-[10px] text-emerald-600 font-arabic">{isRtl ? 'الدفعة المسددة:' : 'Paid Deposit:'}</span>
                                    <span className="text-xs font-black text-emerald-600 font-mono">{paid.toFixed(2)} {t.jod}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                                    <span className="block text-[10px] text-amber-600 font-arabic">{isRtl ? 'المتبقي عند الاستلام:' : 'Remaining Balance:'}</span>
                                    <span className="text-xs font-black text-amber-600 font-mono">{remaining.toFixed(2)} {t.jod}</span>
                                  </div>
                                </div>
                                <div className="text-[11px] font-bold text-slate-600 font-arabic flex items-center justify-between pt-1">
                                  <span>{isRtl ? 'حالة السداد:' : 'Payment Status:'}</span>
                                  <span>
                                    {isPaidFull && '🟢 ' + (isRtl ? 'مدفوع بالكامل' : 'Paid in Full')}
                                    {isPaidPartial && '🟡 ' + (isRtl ? `مسدد دفعة جزئية (${paid} د.أ)` : `Partially Paid (${paid} JOD)`)}
                                    {!isPaidFull && !isPaidPartial && '🔴 ' + (isRtl ? 'غير مدفوع (يُسدد عند الاستلام)' : 'Unpaid (Due upon pickup)')}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Failure reason details if work is halted */}
                          {appt.status === 'not_ready' && appt.failureReason && (
                            <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-xs text-red-700 font-arabic space-y-0.5">
                              <span className="font-extrabold block">{isRtl ? 'سبب توقف الصيانة / عدم الجاهزية:' : 'Reason for delay:'}</span>
                              <p className="font-medium">{appt.failureReason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Elegant minimalist bottom info */}
      <footer className="mt-12 text-center text-xs text-slate-400 font-arabic space-y-1">
        <p className="font-bold text-slate-600">Al-Madar Tech • {isRtl ? 'المدار لخدمات الكمبيوتر والصيانة' : 'Al-Madar Computers & Maintenance Center'}</p>
        <p className="text-[10px]">{isRtl ? 'البلقاء - الأردن • خدمة ممتازة ودعم فني متكامل' : 'Balqa, Jordan • Premier Tech Support Center'}</p>
      </footer>
    </div>
  );
}
