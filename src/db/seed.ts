import { getDb } from './index.ts';
import {
  dbUsers,
  dbCustomers,
  dbParts,
  dbCustomExpenseCategories,
  dbMaintenanceRequests,
  dbFinancialTransactions,
  dbMorningCash,
} from './schema.ts';
import { sql } from 'drizzle-orm';
import {
  defaultUsers,
  defaultCustomers,
  defaultParts,
  defaultCustomExpenseCategories,
  defaultMaintenanceRequests,
  defaultFinancialTransactions,
  defaultMorningCash,
} from '../mockData.ts';

export async function seedDatabaseIfEmpty() {
  if (!process.env.SQL_HOST) {
    console.warn('SQL_HOST is not set. Skipping database seeding.');
    return;
  }
  try {
    // Check if users exist
    const userCountResult = await getDb().execute(sql`SELECT count(*)::int as count FROM users`);
    const count = userCountResult.rows[0]?.count as number || 0;

    if (count > 0) {
      console.log('Database already has data. Skipping seeding.');
      return;
    }

    console.log('Seeding empty database with initial Al-Madar Tech records...');

    // Seed Users
    // Omit the 'id' serial so it gets generated normally or insert directly if desired
    for (const u of defaultUsers) {
      await getDb().insert(dbUsers).values({
        username: u.username,
        fullNameAr: u.fullNameAr,
        fullNameEn: u.fullNameEn,
        role: u.role,
        canAddEditMaintenance: u.permissions.canAddEditMaintenance,
        canAddEditFinance: u.permissions.canAddEditFinance,
        canAddEditSettings: u.permissions.canAddEditSettings,
        canManageUsers: u.permissions.canManageUsers,
        active: u.active,
      }).onConflictDoNothing();
    }

    // Seed Customers
    for (const c of defaultCustomers) {
      await getDb().insert(dbCustomers).values({
        id: c.id,
        name: c.name,
        phoneNumber: c.phoneNumber,
      }).onConflictDoNothing();
    }

    // Seed Parts
    for (const p of defaultParts) {
      await getDb().insert(dbParts).values({
        id: p.id,
        name: p.name,
        price: p.price,
      }).onConflictDoNothing();
    }

    // Seed Custom Expense Categories
    for (const ec of defaultCustomExpenseCategories) {
      await getDb().insert(dbCustomExpenseCategories).values({
        id: ec.id,
        nameAr: ec.nameAr,
        nameEn: ec.nameEn,
      }).onConflictDoNothing();
    }

    // Seed Maintenance Requests
    for (const req of defaultMaintenanceRequests) {
      await getDb().insert(dbMaintenanceRequests).values({
        id: req.id,
        customerName: req.customerName,
        phoneNumber: req.phoneNumber,
        date: req.date,
        time: req.time,
        problemType: req.problemType,
        isUrgent: req.isUrgent,
        actionTaken: req.actionTaken,
        installedParts: req.installedParts,
        requiredParts: req.requiredParts,
        status: req.status,
        failureReason: req.failureReason,
        paymentMethod: req.paymentMethod,
        amount: req.amount,
      }).onConflictDoNothing();
    }

    // Seed Financial Transactions
    for (const tx of defaultFinancialTransactions) {
      await getDb().insert(dbFinancialTransactions).values({
        id: tx.id,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        notes: tx.notes,
      }).onConflictDoNothing();
    }

    // Seed Morning Cash
    await getDb().insert(dbMorningCash).values({
      amount: defaultMorningCash.amount,
      date: defaultMorningCash.date,
    }).onConflictDoNothing();

    console.log('Database successfully seeded!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}
