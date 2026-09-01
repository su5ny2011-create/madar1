/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'ar' | 'en';

export type UserRole = 'admin' | 'technician' | 'financial';

export interface User {
  id: string;
  username: string;
  fullNameAr: string;
  fullNameEn: string;
  role: UserRole;
  permissions: {
    canAddEditMaintenance: boolean;
    canAddEditFinance: boolean;
    canAddEditSettings: boolean;
    canManageUsers: boolean;
  };
  active: boolean;
}

export type MaintenanceStatus = 'not_ready' | 'in_progress' | 'ready';

export interface MaintenancePayment {
  id: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'click' | 'cheque';
  notes?: string;
  receivedBy?: string;
}

export interface MaintenanceRequest {
  id: string;
  customerName: string;
  phoneNumber: string;
  date: string;
  time: string;
  problemType: string;
  isUrgent: boolean;
  actionTaken: string;
  installedParts: string[]; // custom parts installed
  requiredParts: string; // custom parts if new ordered
  status: MaintenanceStatus;
  failureReason: string; // Reason if status is 'not_ready'
  paymentMethod: 'cash' | 'click' | 'cheque' | 'none';
  amount: number; // in JOD (إجمالي المبلغ المطلوب)
  paidAmount?: number; // in JOD (إجمالي الدفعة المسددة / المدفوعة)
  payments?: MaintenancePayment[]; // سجل دفعات هذا الطلب التفصيلي
}

export type ExpenseCategory = 'maintenance_return' | 'petrol' | 'car_repair' | 'other';

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: ExpenseCategory | string; // 'maintenance_return' | 'petrol' | 'car_repair' | 'other' or a custom expense category
  amount: number; // in JOD
  date: string;
  notes: string;
}

export interface MorningCash {
  amount: number;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface Part {
  id: string;
  name: string;
  price: number;
}

export interface CustomExpenseCategory {
  id: string;
  nameAr: string;
  nameEn: string;
}
