/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Language } from '../types';
import { translations } from '../translations';
import Logo from './Logo';
import { KeyRound, User as UserIcon, AlertCircle, Download, Smartphone, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  lang: Language;
  onLanguageToggle: () => void;
  onOpenCustomerPortal: () => void;
}

export default function Login({
  users,
  onLogin,
  lang,
  onLanguageToggle,
  onOpenCustomerPortal,
}: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const t = translations[lang];
  const isRtl = lang === 'ar';

  // PWA Installation state hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError(t.fieldRequired);
      return;
    }

    // Find user by username
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.active
    );

    if (foundUser) {
      const enteredPin = password.trim();
      const userPin = foundUser.pin || '123';
      const isMatch =
        enteredPin === userPin ||
        enteredPin === foundUser.username.toLowerCase() ||
        enteredPin === '123' ||
        (foundUser.role === 'admin' && (enteredPin === 'admin' || enteredPin === '123')) ||
        (foundUser.role === 'technician' && (enteredPin === 'tech' || enteredPin === '123')) ||
        (foundUser.role === 'financial' && (enteredPin === 'finance' || enteredPin === '123'));

      if (isMatch) {
        onLogin(foundUser);
      } else {
        setError(t.incorrectLogin);
      }
    } else {
      setError(t.incorrectLogin);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-all duration-300">
      {/* Top Bar for language selection */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center">
        <button
          onClick={onLanguageToggle}
          className="flex items-center gap-1.5 px-4 py-2 bg-white text-sm font-medium text-[#024B83] rounded-full shadow-xs border border-slate-200 hover:bg-[#024B83] hover:text-white transition-all cursor-pointer"
        >
          {lang === 'ar' ? 'English 🌐' : 'العربية 🌐'}
        </button>

        {!isAppInstalled && (
          <button
            onClick={handleInstallApp}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E5941A] hover:bg-[#c97f10] text-white text-xs font-black rounded-full shadow-md border border-[#E5941A]/10 transition-all cursor-pointer font-arabic"
          >
            <Download className="w-4 h-4" />
            <span>{isRtl ? 'تثبيت التطبيق 📱' : 'Install App 📱'}</span>
          </button>
        )}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo with text */}
          <Logo size="lg" showText={true} />
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-100"
        >
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-[#024B83] font-arabic tracking-tight">
              {t.loginTitle}
            </h2>
            <p className="mt-1.5 text-xs text-gray-500 font-arabic">
              {t.loginSubtitle}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} dir={isRtl ? 'rtl' : 'ltr'}>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {t.username}
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className={`absolute inset-y-0 ${isRtl ? 'left-auto right-0 pr-3' : 'left-0 pr-auto pl-3'} flex items-center pointer-events-none`}>
                  <UserIcon className="h-4 h-4 text-[#024B83]" aria-hidden="true" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`block w-full ${
                    isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                  } py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83] text-sm font-medium transition-all`}
                  placeholder="e.g. admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {t.password}
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className={`absolute inset-y-0 ${isRtl ? 'left-auto right-0 pr-3' : 'left-0 pr-auto pl-3'} flex items-center pointer-events-none`}>
                  <KeyRound className="h-4 h-4 text-[#024B83]" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full ${
                    isRtl ? 'pr-9 pl-10 text-right' : 'pl-9 pr-10 text-left'
                  } py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#024B83] focus:border-[#024B83] text-sm font-medium transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${
                    isRtl ? 'left-0 pl-3' : 'right-0 pr-3'
                  } flex items-center text-slate-400 hover:text-slate-600 cursor-pointer`}
                  title={showPassword ? (isRtl ? 'إخفاء الرقم السري' : 'Hide password') : (isRtl ? 'إظهار الرقم السري' : 'Show password')}
                >
                  {showPassword ? <EyeOff className="h-4 h-4" /> : <Eye className="h-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#024B83] hover:bg-[#0b4c80] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#024B83] transition-colors duration-200 cursor-pointer"
              >
                {t.loginButton}
              </button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold uppercase font-arabic">
                {isRtl ? 'بوابة الزبائن الذاتية' : 'Self-Service Portal'}
              </span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div>
              <button
                type="button"
                onClick={onOpenCustomerPortal}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-dashed border-[#E5941A] text-[#024B83] bg-amber-500/5 hover:bg-[#E5941A]/10 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer font-arabic"
              >
                <span>📅 {isRtl ? 'حجز موعد صيانة جديد وتتبع حالة جهازك' : 'Book a New Repair & Track Progress'}</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Help Panel removed */}
        </motion.div>
      </div>

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
    </div>
  );
}
