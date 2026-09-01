// @refresh reset
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Language,
  User,
  MaintenanceRequest,
  FinancialTransaction,
  Customer,
  Part,
  CustomExpenseCategory,
} from './types';
import {
  defaultUsers,
  defaultCustomers,
  defaultParts,
  defaultCustomExpenseCategories,
  defaultMaintenanceRequests,
  defaultFinancialTransactions,
  defaultMorningCash,
} from './mockData';
import { translations } from './translations';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MaintenanceManager from './components/MaintenanceManager';
import FinancialAffairs from './components/FinancialAffairs';
import SettingsPanel from './components/SettingsPanel';
import UserManagement from './components/UserManagement';
import AppointmentCalendar from './components/AppointmentCalendar';
import CustomerPortal from './components/CustomerPortal';
import Logo from './components/Logo';
import GoogleSheetsSync from './components/GoogleSheetsSync';
import {
  LayoutDashboard,
  Wrench,
  Wallet,
  Settings,
  Shield,
  LogOut,
  Globe,
  Smartphone,
  Laptop,
  Calendar,
  Download,
  Search,
  X,
  Keyboard,
  Menu,
  Database,
  RefreshCw,
} from 'lucide-react';

function MainApplication() {
  // Lang state
  const [lang, setLang] = useState<Language>('ar');

  // Core DB States
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [customExpenseCategories, setCustomExpenseCategories] = useState<CustomExpenseCategory[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [morningCash, setMorningCash] = useState<number>(150);

  // Session & UI States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [prefilledCalendarDate, setPrefilledCalendarDate] = useState<string>('');
  const [showCustomerPortal, setShowCustomerPortal] = useState<boolean>(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // PWA Installation state hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showiOSModal, setShowiOSModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch fresh DB values from API and update state
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      const uRes = await fetch('/api/users');
      if (uRes.ok) {
        const uData = await uRes.json();
        if (Array.isArray(uData) && uData.length > 0) setUsers(uData);
      }

      const cRes = await fetch('/api/customers');
      if (cRes.ok) {
        const cData = await cRes.json();
        if (Array.isArray(cData) && cData.length > 0) setCustomers(cData);
      }

      const pRes = await fetch('/api/parts');
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData) && pData.length > 0) setParts(pData);
      }

      const ecRes = await fetch('/api/custom-expense-categories');
      if (ecRes.ok) {
        const ecData = await ecRes.json();
        if (Array.isArray(ecData) && ecData.length > 0) setCustomExpenseCategories(ecData);
      }

      const rRes = await fetch('/api/maintenance-requests');
      if (rRes.ok) {
        const rData = await rRes.json();
        if (Array.isArray(rData) && rData.length > 0) setRequests(rData);
      }

      const tRes = await fetch('/api/financial-transactions');
      if (tRes.ok) {
        const tData = await tRes.json();
        if (Array.isArray(tData) && tData.length > 0) setTransactions(tData);
      }

      const mRes = await fetch('/api/morning-cash');
      if (mRes.ok) {
        const mData = await mRes.json();
        if (Array.isArray(mData) && mData.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const found = mData.find((m: any) => m.date === todayStr) || mData[mData.length - 1];
          if (found) setMorningCash(found.amount);
        }
      }
    } catch (err) {
      console.error('Error fetching Al-Madar database records from backend:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const t = translations[lang];
  const isRtl = lang === 'ar';

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayPendingCount = (requests || []).filter(
    (req) => req && req.date === todayDateStr && req.status !== 'ready'
  ).length;

  useEffect(() => {
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
      setShowiOSModal(true);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: LayoutDashboard,
      iconColor: 'text-[#1A98D3]',
      show: currentUser && currentUser.role !== 'technician',
    },
    {
      id: 'maintenance',
      label: t.navMaintenance,
      icon: Wrench,
      iconColor: 'text-[#1C7C43]',
      show: currentUser && currentUser.permissions.canAddEditMaintenance,
      badge: todayPendingCount > 0 ? todayPendingCount : null,
    },
    {
      id: 'calendar',
      label: t.navCalendar,
      icon: Calendar,
      iconColor: 'text-[#E5941A]',
      show: true,
    },
    {
      id: 'financial',
      label: t.navFinancial,
      icon: Wallet,
      iconColor: 'text-[#E5941A]',
      show: currentUser && currentUser.permissions.canAddEditFinance,
    },
    {
      id: 'settings',
      label: t.navSettings,
      icon: Settings,
      iconColor: 'text-slate-400',
      show: currentUser && currentUser.permissions.canAddEditSettings,
    },
    {
      id: 'users',
      label: t.navUsers,
      icon: Shield,
      iconColor: 'text-amber-500',
      show: currentUser && currentUser.permissions.canManageUsers,
    },
    {
      id: 'sheets',
      label: t.navSheets,
      icon: Database,
      iconColor: 'text-emerald-500',
      show: currentUser && (currentUser.role === 'admin' || currentUser.role === 'financial'),
    },
  ];

  const renderSidebarContents = (isMobile: boolean = false) => {
    if (!currentUser) return null;

    const initial = (isRtl ? currentUser.fullNameAr : currentUser.fullNameEn).charAt(0).toUpperCase();
    const roleLabel = currentUser.role === 'admin' ? t.admin : currentUser.role === 'technician' ? t.technician : t.financial;

    // Define categorized navigation sections
    const sections = [
      {
        title: isRtl ? 'الرئيسية والمتابعة' : 'Overview & Calendar',
        items: menuItems.filter(item => ['dashboard', 'calendar'].includes(item.id) && item.show),
      },
      {
        title: isRtl ? 'إدارة العمليات اليومية' : 'Operations & Business',
        items: menuItems.filter(item => ['maintenance', 'financial'].includes(item.id) && item.show),
      },
      {
        title: isRtl ? 'الإعدادات والصلاحيات' : 'Control Panel & System',
        items: menuItems.filter(item => ['settings', 'users', 'sheets'].includes(item.id) && item.show),
      },
    ];

    return (
      <div className="flex flex-col h-full justify-between gap-6">
        {/* Top: Profile & Menu Links */}
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden group">
            {/* Visual gradient accent blob */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-tr from-[#024B83] to-[#1A98D3] text-white flex items-center justify-center font-black rounded-xl text-md shadow-sm shrink-0 select-none">
                {initial}
              </div>
              {/* Online Green Status Dot */}
              <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title={isRtl ? 'متصل بالمنظومة' : 'Active Session'} />
            </div>

            <div className="min-w-0">
              <div className="text-[9px] text-slate-400 font-bold font-arabic uppercase tracking-wider flex items-center gap-1">
                <span>{t.welcome}</span>
                <span className="inline-block w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[8px] text-emerald-600 font-bold">{isRtl ? 'نشط' : 'Online'}</span>
              </div>
              <div className="text-xs font-black text-slate-800 truncate leading-tight mt-0.5">
                {isRtl ? currentUser.fullNameAr : currentUser.fullNameEn}
              </div>
              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black font-arabic ${
                currentUser.role === 'admin' 
                  ? 'bg-rose-50 text-rose-600 border border-rose-100/80' 
                  : currentUser.role === 'technician'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/80'
                  : 'bg-sky-50 text-sky-600 border border-sky-100/80'
              }`}>
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Categorized Sections Stack */}
          <div className="space-y-5">
            {sections
              .filter(sec => sec.items.length > 0)
              .map((section, secIdx) => (
                <div key={secIdx} className="space-y-1.5">
                  {/* Category Header */}
                  <div className={`text-[9px] font-black tracking-wider uppercase text-slate-400/90 px-1 flex items-center gap-1.5 ${isRtl ? 'font-arabic' : 'font-sans'}`}>
                    <span className="w-1.5 h-1.5 bg-[#024B83] rounded-full shrink-0 opacity-60" />
                    <span>{section.title}</span>
                  </div>

                  {/* Navigation Items in Category */}
                  <nav className="space-y-1">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      
                      // Modern, Beautiful dynamic styles for active status
                      const activeClass = isActive
                        ? isRtl
                          ? 'bg-[#024B83]/10 text-[#024B83] border-r-4 border-[#024B83] rounded-r-none font-extrabold shadow-xs'
                          : 'bg-[#024B83]/10 text-[#024B83] border-l-4 border-[#024B83] rounded-l-none font-extrabold shadow-xs'
                        : `text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 font-bold transition-all duration-200 ${
                            isRtl ? 'hover:translate-x-[-3px]' : 'hover:translate-x-[3px]'
                          }`;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            if (isMobile) {
                              setMobileMenuOpen(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-arabic text-xs cursor-pointer group select-none ${activeClass}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Icon Wrapper Circle */}
                            <div className={`p-1.5 rounded-lg transition-colors ${
                              isActive ? 'bg-[#024B83]/10 text-[#024B83]' : 'bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-slate-700'
                            }`}>
                              <Icon className="w-4 h-4 shrink-0" />
                            </div>
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[9px] font-black rounded-full border shadow-xs animate-pulse ${
                              isActive
                                ? 'bg-[#E5941A] border-[#E5941A]/20 text-white'
                                : 'bg-red-500 border-red-500/20 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ))}
          </div>
        </div>

        {/* Bottom: Utility Controls */}
        <div className="pt-5 border-t border-slate-150 space-y-2.5 shrink-0">
          {/* Quick Info Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/50 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{isRtl ? 'النظام جاهز على الجوال والحاسوب' : 'Responsive Mobile-Ready System'}</span>
          </div>

          {/* Language Toggle Button */}
          <button
            onClick={handleLanguageToggle}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#024B83] shrink-0" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {lang === 'ar' ? 'EN' : 'AR'}
            </span>
          </button>

          {/* Keyboard Shortcuts Help */}
          <div className="relative group">
            <button className="w-full flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer">
              <Keyboard className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{isRtl ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}</span>
            </button>
            <div className={`absolute bottom-full mb-2 w-full bg-slate-800 text-slate-100 text-[11px] rounded-xl shadow-xl border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden ${
              isRtl ? 'right-0' : 'left-0'
            }`}>
              <div className="p-3 bg-slate-900/50 border-b border-slate-700 font-bold flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5 text-blue-400" />
                <span>{isRtl ? 'اختصارات لوحة المفاتيح' : 'Shortcuts Help'}</span>
              </div>
              <div className="p-2 space-y-1">
                <div className="flex justify-between items-center px-2 py-1 hover:bg-slate-700/50 rounded-lg">
                  <span className="opacity-80">{t.navDashboard}</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600 font-mono text-[9px]">Ctrl+D</kbd>
                </div>
                <div className="flex justify-between items-center px-2 py-1 hover:bg-slate-700/50 rounded-lg">
                  <span className="opacity-80">{t.navMaintenance}</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600 font-mono text-[9px]">Ctrl+M</kbd>
                </div>
                <div className="flex justify-between items-center px-2 py-1 hover:bg-slate-700/50 rounded-lg">
                  <span className="opacity-80">{t.navCalendar}</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600 font-mono text-[9px]">Ctrl+C</kbd>
                </div>
                <div className="flex justify-between items-center px-2 py-1 hover:bg-slate-700/50 rounded-lg">
                  <span className="opacity-80">{t.navFinancial}</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600 font-mono text-[9px]">Ctrl+F</kbd>
                </div>
                <div className="flex justify-between items-center px-2 py-1 hover:bg-slate-700/50 rounded-lg">
                  <span className="opacity-80">{t.navUsers}</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600 font-mono text-[9px]">Ctrl+U</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* PWA Install Button (If available) */}
          {!isAppInstalled && (
            <button
              onClick={handleInstallApp}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-[#E5941A] hover:bg-[#c97f10] text-white rounded-xl text-xs font-black transition-all cursor-pointer font-arabic"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{isRtl ? 'تثبيت التطبيق' : 'Install App'}</span>
            </button>
          )}

          {/* Refresh App Button */}
          <button
            onClick={fetchAllData}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 hover:text-blue-700 rounded-xl text-xs font-black transition-all cursor-pointer font-arabic disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? (isRtl ? 'جاري التحديث...' : 'Refreshing...') : (isRtl ? 'تحديث البيانات' : 'Refresh Data')}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 hover:text-red-700 rounded-xl text-xs font-black transition-all cursor-pointer font-arabic"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{t.logoutButton}</span>
          </button>
        </div>
      </div>
    );
  };

  // Load state from backend APIs on mount with Local Storage and Mock data fallbacks
  useEffect(() => {
    // 1. Initial local fallbacks with LocalStorage persistence support
    try {
      const storedLang = localStorage.getItem('almadar_lang');
      if (storedLang === 'ar' || storedLang === 'en') {
        setLang(storedLang);
      }

      const storedUser = localStorage.getItem('almadar_current_user');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }

      const storedUsers = localStorage.getItem('almadar_users');
      setUsers(storedUsers ? JSON.parse(storedUsers) : defaultUsers);

      const storedCustomers = localStorage.getItem('almadar_customers');
      setCustomers(storedCustomers ? JSON.parse(storedCustomers) : defaultCustomers);

      const storedParts = localStorage.getItem('almadar_parts');
      setParts(storedParts ? JSON.parse(storedParts) : defaultParts);

      const storedCategories = localStorage.getItem('almadar_custom_categories');
      setCustomExpenseCategories(storedCategories ? JSON.parse(storedCategories) : defaultCustomExpenseCategories);

      const storedRequests = localStorage.getItem('almadar_requests');
      setRequests(storedRequests ? JSON.parse(storedRequests) : defaultMaintenanceRequests);

      const storedTransactions = localStorage.getItem('almadar_transactions');
      setTransactions(storedTransactions ? JSON.parse(storedTransactions) : defaultFinancialTransactions);

      const storedMorningCash = localStorage.getItem('almadar_morning_cash');
      setMorningCash(storedMorningCash ? JSON.parse(storedMorningCash) : defaultMorningCash.amount);
    } catch (e) {
      console.error('Error reading localStorage initial setup: ', e);
    }

    // 2. Fetch fresh DB values from API and update state
    fetchAllData();
  }, []);

  // Filter requests globally by customer name or phone number safely
  const filteredRequests = React.useMemo(() => {
    if (!globalSearchTerm.trim()) return requests;
    const term = globalSearchTerm.toLowerCase().trim();
    return (requests || []).filter(
      (req) =>
        req &&
        (((req.customerName || '').toLowerCase().includes(term)) ||
          ((req.phoneNumber || '').toLowerCase().includes(term)))
    );
  }, [requests, globalSearchTerm]);

  // Keyboard Shortcuts for Power Users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow shortcuts if we're not typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'm':
            e.preventDefault();
            if (currentUser?.permissions.canAddEditMaintenance || currentUser?.role === 'technician') {
              setActiveTab('maintenance');
            }
            break;
          case 'f':
            e.preventDefault();
            if (currentUser?.permissions.canManageFinancials) {
              setActiveTab('financial');
            }
            break;
          case 'd':
            e.preventDefault();
            if (currentUser?.role !== 'technician') {
              setActiveTab('dashboard');
            }
            break;
          case 'c':
            e.preventDefault();
            if (currentUser?.permissions.canAddEditMaintenance) {
              setActiveTab('calendar');
            }
            break;
          case 'u':
            e.preventDefault();
            if (currentUser?.permissions.canManageUsers) {
              setActiveTab('users');
            }
            break;
          case 'k':
            // Global search focus
            e.preventDefault();
            document.getElementById('global-search-input')?.focus();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  // Sync state to local storage when changed
  // API Sync helpers
  const apiPost = async (path: string, body: any) => {
    try {
      await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error(`API post failed to ${path}:`, e);
    }
  };

  const apiDelete = async (path: string) => {
    try {
      await fetch(path, { method: 'DELETE' });
    } catch (e) {
      console.error(`API delete failed to ${path}:`, e);
    }
  };

  const saveState = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving localStorage for ${key}`, e);
    }
  };

  // Google Sheets Import handlers
  const handleImportRequests = (imported: MaintenanceRequest[]) => {
    const existingKeys = new Set((requests || []).map(r => `${r.customerName}-${r.phoneNumber}-${r.date}`));
    const newRequests = imported.filter(r => !existingKeys.has(`${r.customerName}-${r.phoneNumber}-${r.date}`));
    
    if (newRequests.length > 0) {
      const updated = [...(requests || []), ...newRequests];
      setRequests(updated);
      saveState('almadar_requests', updated);
      newRequests.forEach(r => apiPost('/api/maintenance-requests', r));
    }
  };

  const handleImportTransactions = (imported: FinancialTransaction[]) => {
    const existingIds = new Set((transactions || []).map(t => t.id));
    const newTx = imported.filter(t => !existingIds.has(t.id));

    if (newTx.length > 0) {
      const updated = [...(transactions || []), ...newTx];
      setTransactions(updated);
      saveState('almadar_transactions', updated);
      newTx.forEach(t => apiPost('/api/financial-transactions', t));
    }
  };

  const handleImportCustomers = (imported: Customer[]) => {
    const existingKeys = new Set((customers || []).map(c => `${c.name}-${c.phoneNumber}`));
    const newCust = imported.filter(c => !existingKeys.has(`${c.name}-${c.phoneNumber}`));

    if (newCust.length > 0) {
      const updated = [...(customers || []), ...newCust];
      setCustomers(updated);
      saveState('almadar_customers', updated);
      newCust.forEach(c => apiPost('/api/customers', c));
    }
  };

  // Language switch toggler
  const handleLanguageToggle = () => {
    const nextLang: Language = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    localStorage.setItem('almadar_lang', nextLang);
  };

  // Authentication callbacks
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    saveState('almadar_current_user', user);
    // Switch to default permitted tab
    if (user.role === 'technician') {
      setActiveTab('maintenance');
    } else if (user.role === 'financial') {
      setActiveTab('financial');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('almadar_current_user');
    setActiveTab('dashboard');
  };

  // Maintenance Actions
  const handleAddRequest = (newReq: Omit<MaintenanceRequest, 'id'>) => {
    const freshId = `req-${Date.now()}`;
    const freshReq: MaintenanceRequest = {
      ...newReq,
      id: freshId,
    };
    const updated = [freshReq, ...requests];
    setRequests(updated);
    saveState('almadar_requests', updated);
    apiPost('/api/maintenance-requests', freshReq);

    const paidAmt = freshReq.paidAmount ?? (freshReq.paymentMethod !== 'none' ? freshReq.amount : 0);
    // If the request was marked as paid or had an initial deposit, automatically register it as income transaction in ledger!
    if (paidAmt > 0) {
      const freshTxId = `tx-auto-${Date.now()}`;
      const methodLabel =
        freshReq.paymentMethod === 'cash'
          ? 'كاش'
          : freshReq.paymentMethod === 'click'
          ? 'كليك'
          : freshReq.paymentMethod === 'cheque'
          ? 'شيك'
          : 'كاش';
      const freshTx: FinancialTransaction = {
        id: freshTxId,
        type: 'income',
        category: 'maintenance_return',
        amount: paidAmt,
        date: freshReq.date || new Date().toISOString().split('T')[0],
        notes: `دفعة صيانة أولية لطلب العميل (${newReq.customerName}) - طريقة: ${methodLabel}`,
      };
      const updatedTx = [freshTx, ...transactions];
      setTransactions(updatedTx);
      saveState('almadar_transactions', updatedTx);
      apiPost('/api/financial-transactions', freshTx);
    }
  };

  const handleBulkUpdateRequests = (ids: string[], updatedFields: Partial<MaintenanceRequest>) => {
    let updated = [...requests];
    let newTransactions = [...transactions];
    let madeChanges = false;

    for (const id of ids) {
      const oldReq = updated.find((r) => r.id === id);
      if (!oldReq) continue;

      const merged = { ...oldReq, ...updatedFields };
      updated = updated.map((req) => (req.id === id ? merged : req));
      madeChanges = true;
      apiPost('/api/maintenance-requests', merged);

      // If payment status changed to paid, create income transaction!
      if (
        oldReq.paymentMethod === 'none' &&
        (updatedFields.paymentMethod === 'cash' || updatedFields.paymentMethod === 'click' || updatedFields.paymentMethod === 'cheque')
      ) {
        const freshTxId = `tx-auto-${Date.now()}-${id}`;
        const freshTx: FinancialTransaction = {
          id: freshTxId,
          type: 'income',
          category: 'maintenance_return',
          amount: updatedFields.amount || oldReq.amount,
          date: updatedFields.date || oldReq.date,
          notes: `تحصيل مبلغ صيانة لطلب العميل (${oldReq.customerName}) - طريقة: ${
            updatedFields.paymentMethod === 'cash' ? 'كاش' : updatedFields.paymentMethod === 'click' ? 'كليك' : 'شيك'
          }`,
        };
        newTransactions = [freshTx, ...newTransactions];
        apiPost('/api/financial-transactions', freshTx);
      }
    }

    if (madeChanges) {
      setRequests(updated);
      saveState('almadar_requests', updated);
      
      if (newTransactions.length !== transactions.length) {
        setTransactions(newTransactions);
        saveState('almadar_transactions', newTransactions);
      }
    }
  };

  const handleDeleteRequest = (id: string) => {
    const updated = requests.filter((req) => req.id !== id);
    setRequests(updated);
    saveState('almadar_requests', updated);
    fetch('/api/maintenance-requests/' + id, { method: 'DELETE' }).catch(console.error);
  };

  const handleUpdateRequest = (id: string, updatedFields: Partial<MaintenanceRequest>) => {
    const oldReq = requests.find((r) => r.id === id);
    if (!oldReq) return;
    const merged = { ...oldReq, ...updatedFields };
    const updated = requests.map((req) => (req.id === id ? merged : req));
    setRequests(updated);
    saveState('almadar_requests', updated);
    apiPost('/api/maintenance-requests', merged);

    // If paid amount increased or payment status changed, log difference as income
    const oldPaid = oldReq.paidAmount ?? (oldReq.paymentMethod !== 'none' ? oldReq.amount : 0);
    const newPaid = merged.paidAmount ?? (merged.paymentMethod !== 'none' ? merged.amount : 0);
    const diff = newPaid - oldPaid;

    if (diff > 0) {
      const freshTxId = `tx-auto-${Date.now()}`;
      const methodLabel =
        merged.paymentMethod === 'cash'
          ? 'كاش'
          : merged.paymentMethod === 'click'
          ? 'كليك'
          : merged.paymentMethod === 'cheque'
          ? 'شيك'
          : 'كاش';
      const freshTx: FinancialTransaction = {
        id: freshTxId,
        type: 'income',
        category: 'maintenance_return',
        amount: diff,
        date: merged.date || new Date().toISOString().split('T')[0],
        notes: `تحصيل دفعة صيانة لطلب العميل (${oldReq.customerName}) - طريقة: ${methodLabel}`,
      };
      const updatedTx = [freshTx, ...transactions];
      setTransactions(updatedTx);
      saveState('almadar_transactions', updatedTx);
      apiPost('/api/financial-transactions', freshTx);
    }
  };

  const handleAddPaymentToRequest = (
    requestId: string,
    payment: { amount: number; paymentMethod: 'cash' | 'click' | 'cheque'; date: string; notes?: string }
  ) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const currentPaid = req.paidAmount ?? (req.paymentMethod !== 'none' ? req.amount : 0);
    const newPaidAmount = currentPaid + payment.amount;
    const existingPayments = req.payments || [];
    const newPaymentItem = {
      id: `pay-${Date.now()}`,
      amount: payment.amount,
      date: payment.date,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes,
    };
    const updatedPayments = [...existingPayments, newPaymentItem];

    const merged: MaintenanceRequest = {
      ...req,
      paidAmount: newPaidAmount,
      paymentMethod:
        newPaidAmount >= req.amount
          ? payment.paymentMethod
          : req.paymentMethod === 'none'
          ? payment.paymentMethod
          : req.paymentMethod,
      payments: updatedPayments,
    };

    const updatedRequests = requests.map((r) => (r.id === requestId ? merged : r));
    setRequests(updatedRequests);
    saveState('almadar_requests', updatedRequests);
    apiPost('/api/maintenance-requests', merged);

    // Register income financial transaction automatically
    const freshTxId = `tx-pay-${Date.now()}`;
    const methodLabel = payment.paymentMethod === 'cash' ? 'كاش' : payment.paymentMethod === 'click' ? 'كليك' : 'شيك';
    const freshTx: FinancialTransaction = {
      id: freshTxId,
      type: 'income',
      category: 'maintenance_return',
      amount: payment.amount,
      date: payment.date,
      notes: `دفعة صيانة لطلب العميل (${req.customerName}) - طريقة: ${methodLabel}${
        payment.notes ? ` (${payment.notes})` : ''
      }`,
    };
    const updatedTx = [freshTx, ...transactions];
    setTransactions(updatedTx);
    saveState('almadar_transactions', updatedTx);
    apiPost('/api/financial-transactions', freshTx);
  };

  const handleDeletePaymentFromRequest = (requestId: string, paymentId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const existingPayments = req.payments || [];
    const paymentToDelete = existingPayments.find((p) => p.id === paymentId);
    if (!paymentToDelete) return;

    const updatedPayments = existingPayments.filter((p) => p.id !== paymentId);
    const currentPaid = req.paidAmount ?? (req.paymentMethod !== 'none' ? req.amount : 0);
    const newPaidAmount = Math.max(0, currentPaid - paymentToDelete.amount);

    const merged: MaintenanceRequest = {
      ...req,
      paidAmount: newPaidAmount,
      payments: updatedPayments,
      paymentMethod: newPaidAmount > 0 ? req.paymentMethod : 'none',
    };

    const updatedRequests = requests.map((r) => (r.id === requestId ? merged : r));
    setRequests(updatedRequests);
    saveState('almadar_requests', updatedRequests);
    apiPost('/api/maintenance-requests', merged);
  };

  // Finance Actions
  const handleSetMorningCash = (amount: number) => {
    setMorningCash(amount);
    localStorage.setItem('almadar_morning_cash', amount.toString());
    const todayStr = new Date().toISOString().split('T')[0];
    apiPost('/api/morning-cash', { amount, date: todayStr });
  };

  const handleAddTransaction = (newTx: Omit<FinancialTransaction, 'id'>) => {
    const freshId = `tx-${Date.now()}`;
    const freshTx: FinancialTransaction = {
      ...newTx,
      id: freshId,
    };
    const updated = [freshTx, ...transactions];
    setTransactions(updated);
    saveState('almadar_transactions', updated);
    apiPost('/api/financial-transactions', freshTx);
  };

  const handleUpdateTransaction = (updatedTx: FinancialTransaction) => {
    const updated = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    setTransactions(updated);
    saveState('almadar_transactions', updated);
    apiPost('/api/financial-transactions', updatedTx);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveState('almadar_transactions', updated);
    apiDelete(`/api/financial-transactions/${id}`);
  };

  // Registry / Settings Actions
  const handleAddCustomer = (name: string, phone: string) => {
    const freshId = `cust-${Date.now()}`;
    const fresh: Customer = {
      id: freshId,
      name,
      phoneNumber: phone,
    };
    const updated = [...customers, fresh];
    setCustomers(updated);
    saveState('almadar_customers', updated);
    apiPost('/api/customers', fresh);
  };

  const handleDeleteCustomer = (id: string) => {
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    saveState('almadar_customers', updated);
    apiDelete(`/api/customers/${id}`);
  };

  const handleAddPart = (name: string, price: number) => {
    const freshId = `part-${Date.now()}`;
    const fresh: Part = {
      id: freshId,
      name,
      price,
    };
    const updated = [...parts, fresh];
    setParts(updated);
    saveState('almadar_parts', updated);
    apiPost('/api/parts', fresh);
  };

  const handleDeletePart = (id: string) => {
    const updated = parts.filter((p) => p.id !== id);
    setParts(updated);
    saveState('almadar_parts', updated);
    apiDelete(`/api/parts/${id}`);
  };

  const handleAddExpenseCategory = (nameAr: string, nameEn: string) => {
    const freshId = `exp-cat-${Date.now()}`;
    const fresh: CustomExpenseCategory = {
      id: freshId,
      nameAr,
      nameEn,
    };
    const updated = [...customExpenseCategories, fresh];
    setCustomExpenseCategories(updated);
    saveState('almadar_expense_categories', updated);
    apiPost('/api/custom-expense-categories', fresh);
  };

  const handleDeleteExpenseCategory = (id: string) => {
    const updated = customExpenseCategories.filter((c) => c.id !== id);
    setCustomExpenseCategories(updated);
    saveState('almadar_expense_categories', updated);
    apiDelete(`/api/custom-expense-categories/${id}`);
  };

  // Users Actions (Admin panel)
  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    const freshId = `usr-${Date.now()}`;
    const fresh: User = {
      ...newUser,
      id: freshId,
    };
    const updated = [...users, fresh];
    setUsers(updated);
    saveState('almadar_users', updated);
    apiPost('/api/users', fresh);
  };

  const handleUpdateUser = (id: string, updatedFields: Partial<User>) => {
    const oldUser = users.find((u) => u.id === id);
    if (!oldUser) return;
    const merged = { ...oldUser, ...updatedFields };
    const updated = users.map((u) => (u.id === id ? merged : u));
    setUsers(updated);
    saveState('almadar_users', updated);
    apiPost('/api/users', merged);

    // If updating current user, refresh session
    if (currentUser && currentUser.id === id) {
      const refreshed = { ...currentUser, ...updatedFields };
      setCurrentUser(refreshed);
      saveState('almadar_current_user', refreshed);
    }
  };

  const handleDeleteUser = (id: string) => {
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    saveState('almadar_users', updated);
    apiDelete(`/api/users/${id}`);
  };

  // EXCEL EXPORTERS (Flawless client-side CSV format with Arabic UTF-8 BOM)
  const exportMaintenanceToExcel = () => {
    const headers = [
      lang === 'ar' ? 'اسم الزبون' : 'Customer Name',
      lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
      lang === 'ar' ? 'التاريخ' : 'Date',
      lang === 'ar' ? 'الموعد' : 'Time',
      lang === 'ar' ? 'نوع المشكلة' : 'Problem',
      lang === 'ar' ? 'الأهمية' : 'Urgency',
      lang === 'ar' ? 'الإجراء المتخذ' : 'Action Taken',
      lang === 'ar' ? 'القطع المركبة' : 'Installed Parts',
      lang === 'ar' ? 'القطع المطلوبة' : 'Required Parts',
      lang === 'ar' ? 'حالة الطلب' : 'Status',
      lang === 'ar' ? 'سبب عدم الجاهزية' : 'Reason',
      lang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
      lang === 'ar' ? 'القيمة (دينار)' : 'Amount (JOD)',
    ];

    const rows = requests.map((r) => [
      r.customerName,
      `="${r.phoneNumber}"`, // prefix with excel custom text marker to avoid losing leading zero
      r.date,
      r.time,
      r.problemType,
      r.isUrgent ? (lang === 'ar' ? 'مستعجل' : 'Urgent') : (lang === 'ar' ? 'عادي' : 'Normal'),
      r.actionTaken || '',
      r.installedParts.join(' | '),
      r.requiredParts || '',
      r.status === 'ready'
        ? (lang === 'ar' ? 'جاهز' : 'Ready')
        : r.status === 'in_progress'
        ? (lang === 'ar' ? 'قيد التجهيز' : 'In Progress')
        : (lang === 'ar' ? 'لم يتم التجهيز' : 'Not Prepared'),
      r.failureReason || '',
      r.paymentMethod === 'cash'
        ? (lang === 'ar' ? 'كاش' : 'Cash')
        : r.paymentMethod === 'click'
        ? (lang === 'ar' ? 'كليك' : 'CliQ')
        : r.paymentMethod === 'cheque'
        ? (lang === 'ar' ? 'شيك' : 'Cheque')
        : (lang === 'ar' ? 'غير مدفوع' : 'Unpaid'),
      r.amount.toString(),
    ]);

    downloadCSV(headers, rows, 'Al-Madar-Maintenance-Report');
  };

  const exportFinanceToExcel = () => {
    const headers = [
      'ID',
      lang === 'ar' ? 'نوع العملية' : 'Transaction Type',
      lang === 'ar' ? 'بند المصروف/الإيراد' : 'Category',
      lang === 'ar' ? 'القيمة (د.أ)' : 'Amount (JOD)',
      lang === 'ar' ? 'التاريخ' : 'Date',
      lang === 'ar' ? 'ملاحظات وتفاصيل' : 'Notes/Details',
    ];

    const rows = transactions.map((t) => [
      t.id,
      t.type === 'income' ? (lang === 'ar' ? 'إيراد' : 'Income') : (lang === 'ar' ? 'مصروف' : 'Expense'),
      t.category === 'maintenance_return'
        ? (lang === 'ar' ? 'بدل صيانة' : 'Maintenance Return')
        : t.category === 'petrol'
        ? (lang === 'ar' ? 'بنزين' : 'Petrol')
        : t.category === 'car_repair'
        ? (lang === 'ar' ? 'تصليح سيارة' : 'Car Repair')
        : t.category === 'other'
        ? (lang === 'ar' ? 'أخرى' : 'Other')
        : t.category,
      t.amount.toString(),
      t.date,
      t.notes || '',
    ]);

    downloadCSV(headers, rows, 'Al-Madar-Financial-Report');
  };

  const downloadCSV = (headers: string[], rows: string[][], filenamePrefix: string) => {
    const csvContent = [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',')];

    rows.forEach((row) => {
      const formattedRow = row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',');
      csvContent.push(formattedRow);
    });

    const csvString = csvContent.join('\n');
    // Important: adding UTF-8 Byte Order Mark (BOM) so Excel decodes Arabic characters perfectly!
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvString], {
      type: 'text/csv;charset=utf-8;',
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If customer portal is selected, render it
  if (showCustomerPortal) {
    return (
      <CustomerPortal
        requests={requests}
        customers={customers}
        parts={parts}
        lang={lang}
        onAddRequest={handleAddRequest}
        onClose={() => setShowCustomerPortal(false)}
      />
    );
  }

  // Handle global search input changes with tab redirection helper
  const handleGlobalSearchChange = (value: string) => {
    setGlobalSearchTerm(value);
    if (value.trim() !== '') {
      if (activeTab === 'financial' || activeTab === 'settings' || activeTab === 'users') {
        if (currentUser && currentUser.permissions.canAddEditMaintenance) {
          setActiveTab('maintenance');
        } else {
          setActiveTab('dashboard');
        }
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-all duration-300"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {!currentUser ? (
        <Login
          users={users}
          onLogin={handleLogin}
          lang={lang}
          onLanguageToggle={handleLanguageToggle}
          onOpenCustomerPortal={() => setShowCustomerPortal(true)}
        />
      ) : (
        <>
          {/* Top Banner & Header Navigation */}
          <header className="bg-[#024B83] text-white shadow-md sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-20 items-center gap-4">
                {/* Title & Vector Logo Pairings */}
                <div className="flex items-center gap-3">
                  <Logo size="sm" showText={false} />
                  <div>
                    <h1 className="text-md sm:text-lg font-black tracking-normal font-arabic">
                      {t.appTitle}
                    </h1>
                    <p className="text-[10px] text-blue-100 font-arabic opacity-90 hidden sm:block">
                      {t.appSubTitle}
                    </p>
                  </div>
                </div>

                {/* Global Search Bar (Desktop) */}
                <div className="hidden md:block flex-1 max-w-md mx-4">
                  <div className="relative">
                    <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-blue-200`}>
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="global-search-input"
                      value={globalSearchTerm}
                      onChange={(e) => handleGlobalSearchChange(e.target.value)}
                      placeholder={t.globalSearchPlaceholder}
                      className={`block w-full ${
                        isRtl ? 'pr-9 pl-10 text-right' : 'pl-9 pr-10 text-left'
                      } py-2 bg-white/10 hover:bg-white/15 focus:bg-white border border-white/10 focus:border-white focus:text-slate-900 text-white rounded-xl text-xs font-semibold focus:outline-hidden transition-all placeholder:text-blue-200/70`}
                    />
                    {globalSearchTerm && (
                      <button
                        onClick={() => setGlobalSearchTerm('')}
                        className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-2.5' : 'right-0 pr-2.5'} flex items-center text-blue-200 hover:text-red-500 hover:scale-110 focus:outline-hidden transition-all`}
                        title={t.clearSearch}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Menu Toggle Button */}
                <div className="flex items-center gap-3">
                  {/* Header Refresh Data Button */}
                  <button
                    onClick={fetchAllData}
                    disabled={isRefreshing}
                    className="p-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center border border-white/10 disabled:opacity-50"
                    title={isRtl ? 'تحديث البيانات' : 'Refresh Data'}
                  >
                    <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden p-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center border border-white/10"
                    title={isRtl ? 'فتح القائمة' : 'Open Menu'}
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  {/* Desktop App Accent */}
                  <div className="hidden lg:flex items-center gap-2">
                    <Logo size="sm" showText={false} className="opacity-45" />
                    <span className="text-[10px] text-blue-200 font-bold font-arabic opacity-80">
                      {t.appEnglishTitle}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Search Bar Row (Show on small screens below md) */}
          <div className="md:hidden px-4 py-3 bg-[#0b4c80]/5 border-b border-slate-200 max-w-7xl mx-auto w-full">
            <div className="relative">
              <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="global-search-input-mobile"
                value={globalSearchTerm}
                onChange={(e) => handleGlobalSearchChange(e.target.value)}
                placeholder={t.globalSearchPlaceholder}
                className={`block w-full ${
                  isRtl ? 'pr-9 pl-10 text-right' : 'pl-9 pr-10 text-left'
                } py-2 bg-white border border-slate-200 focus:border-[#024B83] text-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden transition-all placeholder:text-slate-400`}
              />
              {globalSearchTerm && (
                <button
                  onClick={() => setGlobalSearchTerm('')}
                  className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-2.5' : 'right-0 pr-2.5'} flex items-center text-slate-400 hover:text-red-500 hover:scale-110 focus:outline-hidden transition-all`}
                  title={t.clearSearch}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Sliding Sidebar Drawer (Animated via motion) */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
                {/* Backdrop fade */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in" 
                  onClick={() => setMobileMenuOpen(false)}
                />

                {/* Drawer sliding pane */}
                <motion.div 
                  initial={{ x: isRtl ? '100%' : '100%' }} // Always slide from right as requested
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="fixed inset-y-0 right-0 w-80 max-w-[calc(100vw-3rem)] bg-white shadow-2xl p-6 flex flex-col justify-between z-50"
                >
                  {/* Header of Mobile Drawer */}
                  <div className="flex justify-between items-center pb-4 border-b border-slate-150 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Logo size="sm" showText={false} />
                      <span className="font-black text-xs text-[#024B83] font-arabic">{t.appTitle}</span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                      title={isRtl ? 'إغلاق القائمة' : 'Close Menu'}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Body (Sidebar Contents) */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    {renderSidebarContents(true)}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Two-Column Responsive Layout Wrapper */}
          <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto min-h-0 relative">
            
            {/* Desktop Pinned Sidebar - Sticky Navigation (Renders on the right side) */}
            <aside 
              className={`hidden lg:block w-80 shrink-0 bg-white p-6 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto shadow-[1px_0_15px_rgba(2,75,131,0.015)] ${
                isRtl ? 'border-l border-slate-200/80 lg:order-1' : 'border-l border-slate-200/80 lg:order-2'
              }`}
            >
              {renderSidebarContents(false)}
            </aside>

            {/* Main Content Workspace Frame */}
            <main 
              className={`flex-1 px-4 sm:px-6 lg:px-8 py-8 min-w-0 ${
                isRtl ? 'lg:order-2' : 'lg:order-1'
              }`}
            >
        {activeTab === 'dashboard' && currentUser.role !== 'technician' && (
          <Dashboard
            requests={filteredRequests}
            transactions={transactions}
            morningCash={morningCash}
            lang={lang}
            onNavigate={(tab) => setActiveTab(tab)}
            onExportMaintenance={exportMaintenanceToExcel}
            onExportFinance={exportFinanceToExcel}
          />
        )}

        {activeTab === 'maintenance' && currentUser.permissions.canAddEditMaintenance && (
          <MaintenanceManager
            requests={filteredRequests}
            customers={customers}
            parts={parts}
            lang={lang}
            onAddRequest={handleAddRequest}
            onUpdateRequest={handleUpdateRequest}
            onBulkUpdateRequests={handleBulkUpdateRequests}
            onDeleteRequest={handleDeleteRequest}
            onAddPaymentToRequest={handleAddPaymentToRequest}
            onDeletePaymentFromRequest={handleDeletePaymentFromRequest}
            canEdit={currentUser.permissions.canAddEditMaintenance}
            prefilledDate={prefilledCalendarDate}
            onClearPrefilledDate={() => setPrefilledCalendarDate('')}
          />
        )}

        {activeTab === 'calendar' && (
          <AppointmentCalendar
            requests={filteredRequests}
            lang={lang}
            onUpdateRequest={handleUpdateRequest}
            canEdit={currentUser.permissions.canAddEditMaintenance}
            onNavigateToMaintenance={(prefilledDate) => {
              if (prefilledDate) {
                setPrefilledCalendarDate(prefilledDate);
              }
              setActiveTab('maintenance');
            }}
          />
        )}

        {activeTab === 'financial' && currentUser.permissions.canAddEditFinance && (
          <FinancialAffairs
            transactions={transactions}
            morningCash={morningCash}
            customCategories={customExpenseCategories}
            lang={lang}
            onSetMorningCash={handleSetMorningCash}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            canEdit={currentUser.permissions.canAddEditFinance}
          />
        )}

        {activeTab === 'settings' && currentUser.permissions.canAddEditSettings && (
          <SettingsPanel
            customers={customers}
            parts={parts}
            customExpenseCategories={customExpenseCategories}
            lang={lang}
            onAddCustomer={handleAddCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onAddPart={handleAddPart}
            onDeletePart={handleDeletePart}
            onAddExpenseCategory={handleAddExpenseCategory}
            onDeleteExpenseCategory={handleDeleteExpenseCategory}
            canEdit={currentUser.permissions.canAddEditSettings}
            currentUser={currentUser}
            requests={requests}
            users={users}
            transactions={transactions}
          />
        )}

        {activeTab === 'users' && currentUser.permissions.canManageUsers && (
          <UserManagement
            users={users}
            currentUser={currentUser}
            lang={lang}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'sheets' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'financial') && (
          <GoogleSheetsSync
            lang={lang}
            requests={requests}
            transactions={transactions}
            customers={customers}
            onImportRequests={handleImportRequests}
            onImportTransactions={handleImportTransactions}
            onImportCustomers={handleImportCustomers}
          />
        )}
      </main>
    </div>

      {/* Modern, Simple, Elegant Footer */}
      <footer className="bg-slate-100 py-6 border-t border-slate-200 mt-auto text-xs text-center text-slate-500 font-arabic space-y-1">
        <p className="font-bold text-slate-700">
          {t.appTitle} © {new Date().getFullYear()}
        </p>
        <p className="text-[10px] text-slate-400">
          {t.appEnglishTitle} • {isRtl ? 'بوابة الخدمات المتكاملة للكمبيوتر والصيانة والمالية' : 'Computer maintenance & financial administration software'}
        </p>
      </footer>

      {/* iOS Step-by-Step Installation Modal */}
      {showiOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-in animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
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
      </>
    )}
    </div>
  );
}

export default function App() {
  return <MainApplication />;
}



// @refresh reset
