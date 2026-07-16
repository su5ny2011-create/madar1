import { pgTable, serial, text, boolean, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

export const dbUsers = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // For firebase auth uid if used, or left empty
  username: text('username').notNull().unique(),
  fullNameAr: text('full_name_ar').notNull(),
  fullNameEn: text('full_name_en').notNull(),
  role: text('role').notNull(), // 'admin' | 'technician' | 'financial'
  canAddEditMaintenance: boolean('can_add_edit_maintenance').notNull().default(true),
  canAddEditFinance: boolean('can_add_edit_finance').notNull().default(false),
  canAddEditSettings: boolean('can_add_edit_settings').notNull().default(false),
  canManageUsers: boolean('can_manage_users').notNull().default(false),
  active: boolean('active').notNull().default(true),
});

export const dbCustomers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull(),
});

export const dbParts = pgTable('parts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: doublePrecision('price').notNull(),
});

export const dbCustomExpenseCategories = pgTable('custom_expense_categories', {
  id: text('id').primaryKey(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
});

export const dbMaintenanceRequests = pgTable('maintenance_requests', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  problemType: text('problem_type').notNull(),
  isUrgent: boolean('is_urgent').notNull().default(false),
  actionTaken: text('action_taken').notNull().default(''),
  installedParts: jsonb('installed_parts').notNull(), // array of strings
  requiredParts: text('required_parts').notNull().default(''),
  status: text('status').notNull().default('not_ready'), // 'not_ready' | 'in_progress' | 'ready'
  failureReason: text('failure_reason').notNull().default(''),
  paymentMethod: text('payment_method').notNull().default('none'), // 'cash' | 'click' | 'cheque' | 'none'
  amount: doublePrecision('amount').notNull().default(0),
});

export const dbFinancialTransactions = pgTable('financial_transactions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'income' | 'expense'
  category: text('category').notNull(),
  amount: doublePrecision('amount').notNull(),
  date: text('date').notNull(),
  notes: text('notes').notNull().default(''),
});

export const dbMorningCash = pgTable('morning_cash', {
  id: serial('id').primaryKey(),
  amount: doublePrecision('amount').notNull(),
  date: text('date').unique().notNull(),
});
