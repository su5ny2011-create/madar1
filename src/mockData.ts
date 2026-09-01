/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, MaintenanceRequest, FinancialTransaction, Customer, Part, CustomExpenseCategory, MorningCash } from './types';

// Default pre-seeded users
export const defaultUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    pin: '123',
    fullNameAr: 'م. أحمد العبادي (المدير)',
    fullNameEn: 'Eng. Ahmad Al-Abadi (Manager)',
    role: 'admin',
    permissions: {
      canAddEditMaintenance: true,
      canAddEditFinance: true,
      canAddEditSettings: true,
      canManageUsers: true,
      canChangePassword: true,
    },
    active: true,
  },
  {
    id: '2',
    username: 'tech',
    pin: '123',
    fullNameAr: 'سامر القضاه (مهندس صيانة)',
    fullNameEn: 'Samer Al-Qudah (Maintenance Eng)',
    role: 'technician',
    permissions: {
      canAddEditMaintenance: true,
      canAddEditFinance: false,
      canAddEditSettings: true,
      canManageUsers: false,
      canChangePassword: true,
    },
    active: true,
  },
  {
    id: '3',
    username: 'finance',
    pin: '123',
    fullNameAr: 'ليلى الشوبكي (المحاسبة)',
    fullNameEn: 'Layla Al-Shobaki (Accountant)',
    role: 'financial',
    permissions: {
      canAddEditMaintenance: false,
      canAddEditFinance: true,
      canAddEditSettings: true,
      canManageUsers: false,
      canChangePassword: true,
    },
    active: true,
  },
];

// Default pre-seeded customers in Amman, Jordan
export const defaultCustomers: Customer[] = [
  { id: 'c1', name: 'شركة الصقر للمقاولات', phoneNumber: '0795551234' },
  { id: 'c2', name: 'عيادة الدكتور عمر الروابدة', phoneNumber: '0788884321' },
  { id: 'c3', name: 'محامون بلا حدود', phoneNumber: '0776669876' },
  { id: 'c4', name: 'سوبرماركت الهداية المركزي', phoneNumber: '0799112233' },
  { id: 'c5', name: 'رائد الفيصل (عميل شخصي)', phoneNumber: '0790044556' },
];

// Default pre-seeded computer spare parts
export const defaultParts: Part[] = [
  { id: 'p1', name: 'قرص صلب SSD 512GB Kingston', price: 35 },
  { id: 'p2', name: 'ذاكرة عشوائية DDR4 8GB Crucial', price: 18 },
  { id: 'p3', name: 'شاحن لابتوب HP الأصلي 65W', price: 25 },
  { id: 'p4', name: 'شاشة لابتوب 15.6 بوصة LED FHD', price: 65 },
  { id: 'p5', name: 'مروحة تبريد للمعالج Intel Cooler', price: 10 },
  { id: 'p6', name: 'كارت شاشة GTX 1650 4GB', price: 120 },
];

// Default pre-seeded expense categories
export const defaultCustomExpenseCategories: CustomExpenseCategory[] = [
  { id: 'e1', nameAr: 'رواتب موظفين', nameEn: 'Staff Salaries' },
  { id: 'e2', nameAr: 'كهرباء وإنترنت للمكتب', nameEn: 'Office Electricity & Internet' },
  { id: 'e3', nameAr: 'أدوات قرطاسية وضيافة', nameEn: 'Stationery & Office Hospitality' },
];

// Default pre-seeded maintenance requests
export const defaultMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: 'req-1',
    customerName: 'شركة الصقر للمقاولات',
    phoneNumber: '0795551234',
    date: '2026-07-13',
    time: '10:00',
    problemType: 'سيرفر الملفات الرئيسي لا يقلع ويصدر صوتاً متكرراً',
    isUrgent: true,
    actionTaken: 'تم فتح السيرفر وتنظيف المروحة وتغيير وحدة التزويد بالطاقة المتضررة',
    installedParts: ['مروحة تبريد للمعالج Intel Cooler'],
    requiredParts: '',
    status: 'ready',
    failureReason: '',
    paymentMethod: 'cash',
    amount: 55,
    paidAmount: 55,
    payments: [
      {
        id: 'pay-1',
        amount: 55,
        date: '2026-07-13',
        paymentMethod: 'cash',
        notes: 'دفعة كاملة عند التسليم',
      }
    ],
  },
  {
    id: 'req-2',
    customerName: 'عيادة الدكتور عمر الروابدة',
    phoneNumber: '0788884321',
    date: '2026-07-13',
    time: '12:30',
    problemType: 'جهاز الاستقبال في العيادة بطيء جداً ويتوقف فجأة',
    isUrgent: false,
    actionTaken: 'تم فحص القرص الصلب وتبيّن وجود قطاعات تالفة، تم استبداله بهارد سريع ونقل الملفات وتنزيل ويندوز ١٠ أصلي وتثبيت برمجية العيادة',
    installedParts: ['قرص صلب SSD 512GB Kingston', 'ذاكرة عشوائية DDR4 8GB Crucial'],
    requiredParts: '',
    status: 'ready',
    failureReason: '',
    paymentMethod: 'click',
    amount: 75,
    paidAmount: 75,
    payments: [
      {
        id: 'pay-2',
        amount: 75,
        date: '2026-07-13',
        paymentMethod: 'click',
        notes: 'دفعة كليك CliQ مباشرة',
      }
    ],
  },
  {
    id: 'req-3',
    customerName: 'سوبرماركت الهداية المركزي',
    phoneNumber: '0799112233',
    date: '2026-07-14',
    time: '09:00',
    problemType: 'كاميرات المراقبة توقفت عن التسجيل والقرص الصلب ممتلئ',
    isUrgent: true,
    actionTaken: 'فحص جهاز الـ DVR، يتطلب تبديل هارد ديسك سعة كبيرة ٤ تيرا بايت لضمان شهر تسجيل متواصل',
    installedParts: [],
    requiredParts: 'قرص صلب HDD 4TB Surveillance Western Digital',
    status: 'in_progress',
    failureReason: '',
    paymentMethod: 'cash',
    amount: 110,
    paidAmount: 40,
    payments: [
      {
        id: 'pay-3',
        amount: 40,
        date: '2026-07-14',
        paymentMethod: 'cash',
        notes: 'دفعة أولى مقدمة للبدء في طلب القرص الصلب',
      }
    ],
  },
  {
    id: 'req-4',
    customerName: 'محامون بلا حدود',
    phoneNumber: '0776669876',
    date: '2026-07-12',
    time: '15:00',
    problemType: 'طابعة المكتب الليزرية تعطي خطأ انحشار الورق دائماً',
    isUrgent: false,
    actionTaken: 'تبين وجود كسر في مسننات السحب الداخلية وتتطلب قطعة غيار خاصة غير متوفرة في السوق المحلي حالياً وتم طلبها من دبي',
    installedParts: [],
    requiredParts: 'طقم تروس سحب طابعة HP LaserJet Pro 400',
    status: 'not_ready',
    failureReason: 'القطع غير متوفرة محلياً وتم طلبها خصيصاً وستصل خلال أسبوع',
    paymentMethod: 'none',
    amount: 45,
    paidAmount: 0,
    payments: [],
  },
];

// Default pre-seeded transactions
export const defaultFinancialTransactions: FinancialTransaction[] = [
  {
    id: 't-1',
    type: 'income',
    category: 'maintenance_return',
    amount: 55,
    date: '2026-07-13',
    notes: 'بدل صيانة سيرفر لشركة الصقر - كاش للمهندس سامر',
  },
  {
    id: 't-2',
    type: 'income',
    category: 'maintenance_return',
    amount: 75,
    date: '2026-07-13',
    notes: 'بدل صيانة وترقية جهاز عيادة د. عمر - مدفوعة كليك (CliQ)',
  },
  {
    id: 't-3',
    type: 'expense',
    category: 'petrol',
    amount: 15,
    date: '2026-07-13',
    notes: 'بنزين لسيارة صيانة رينو لزيارة زبائن طبربور وتلاع العلي',
  },
  {
    id: 't-4',
    type: 'expense',
    category: 'car_repair',
    amount: 32,
    date: '2026-07-12',
    notes: 'تغيير زيت وفلاتر لسيارة الصيانة البيجو في المنطقة الصناعية البيادر',
  },
  {
    id: 't-5',
    type: 'expense',
    category: 'other',
    amount: 8,
    date: '2026-07-13',
    notes: 'ضيافة قهوة وشاي لزبائن المكتب ومواد تنظيف',
  },
];

// Default morning cash drawer
export const defaultMorningCash: MorningCash = {
  amount: 150, // 150 JOD starting cash
  date: '2026-07-13',
};
