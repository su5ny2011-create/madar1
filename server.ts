import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb } from './src/db/index.ts';
import {
  dbUsers,
  dbCustomers,
  dbParts,
  dbCustomExpenseCategories,
  dbMaintenanceRequests,
  dbFinancialTransactions,
  dbMorningCash,
} from './src/db/schema.ts';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';
import { eq } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Log incoming requests for robustness
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Seed DB if empty
  if (process.env.SQL_HOST) {
    await seedDatabaseIfEmpty();
  } else {
    console.warn('SQL_HOST is not set. Skipping seedDatabaseIfEmpty on startup.');
  }

  // API Routes
  
  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. USERS
  app.get('/api/users', async (req, res) => {
    try {
      const results = await getDb().select().from(dbUsers);
      // Map to original client structure
      const mapped = results.map(u => ({
        id: u.id.toString(),
        username: u.username,
        pin: u.pin || '123',
        fullNameAr: u.fullNameAr,
        fullNameEn: u.fullNameEn,
        role: u.role as any,
        permissions: {
          canAddEditMaintenance: u.canAddEditMaintenance,
          canAddEditFinance: u.canAddEditFinance,
          canAddEditSettings: u.canAddEditSettings,
          canManageUsers: u.canManageUsers,
          canChangePassword: u.canChangePassword,
        },
        active: u.active,
      }));
      res.json(mapped);
    } catch (err: any) {
      console.error('Error in GET /api/users:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const u = req.body;
      if (!u.username || !u.role) {
        return res.status(400).json({ error: 'Username and role are required' });
      }

      // Check if user already exists
      const numericId = u.id ? parseInt(u.id, 10) : NaN;
      
      const val: any = {
        username: u.username,
        fullNameAr: u.fullNameAr || '',
        fullNameEn: u.fullNameEn || '',
        role: u.role,
        canAddEditMaintenance: u.permissions?.canAddEditMaintenance ?? true,
        canAddEditFinance: u.permissions?.canAddEditFinance ?? false,
        canAddEditSettings: u.permissions?.canAddEditSettings ?? false,
        canManageUsers: u.permissions?.canManageUsers ?? false,
        canChangePassword: u.permissions?.canChangePassword ?? true,
        active: u.active ?? true,
      };

      if (u.pin !== undefined && u.pin !== null && u.pin.trim() !== '') {
        val.pin = u.pin.trim();
      }

      if (!isNaN(numericId)) {
        // Update
        const updated = await getDb().update(dbUsers)
          .set(val)
          .where(eq(dbUsers.id, numericId))
          .returning();
        res.json(updated[0]);
      } else {
        // Insert
        if (!val.pin) {
          val.pin = '123';
        }
        const inserted = await getDb().insert(dbUsers)
          .values(val)
          .onConflictDoUpdate({
            target: dbUsers.username,
            set: val,
          })
          .returning();
        res.json(inserted[0]);
      }
    } catch (err: any) {
      console.error('Error in POST /api/users:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users/change-password', async (req, res) => {
    try {
      const { username, currentPin, newPin, userId } = req.body;
      if (!newPin || newPin.trim() === '') {
        return res.status(400).json({ error: 'New PIN/password is required' });
      }

      if (userId) {
        const numericId = parseInt(userId, 10);
        if (!isNaN(numericId)) {
          await getDb().update(dbUsers).set({ pin: newPin.trim() }).where(eq(dbUsers.id, numericId));
          return res.json({ success: true, message: 'Password updated successfully' });
        }
      }

      if (username) {
        await getDb().update(dbUsers).set({ pin: newPin.trim() }).where(eq(dbUsers.username, username.toLowerCase().trim()));
        return res.json({ success: true, message: 'Password updated successfully' });
      }

      res.status(400).json({ error: 'User identifier is required' });
    } catch (err: any) {
      console.error('Error in POST /api/users/change-password:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const numericId = parseInt(req.params.id, 10);
      if (isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      await getDb().delete(dbUsers).where(eq(dbUsers.id, numericId));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in DELETE /api/users:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. CUSTOMERS
  app.get('/api/customers', async (req, res) => {
    try {
      const results = await getDb().select().from(dbCustomers);
      res.json(results);
    } catch (err: any) {
      console.error('Error in GET /api/customers:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const c = req.body;
      if (!c.id || !c.name || !c.phoneNumber) {
        return res.status(400).json({ error: 'Missing required customer parameters' });
      }

      await getDb().insert(dbCustomers)
        .values({
          id: c.id,
          name: c.name,
          phoneNumber: c.phoneNumber,
        })
        .onConflictDoUpdate({
          target: dbCustomers.id,
          set: {
            name: c.name,
            phoneNumber: c.phoneNumber,
          }
        });
      res.json({ success: true, customer: c });
    } catch (err: any) {
      console.error('Error in POST /api/customers:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      await getDb().delete(dbCustomers).where(eq(dbCustomers.id, req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in DELETE /api/customers:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. PARTS
  app.get('/api/parts', async (req, res) => {
    try {
      const results = await getDb().select().from(dbParts);
      res.json(results);
    } catch (err: any) {
      console.error('Error in GET /api/parts:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/parts', async (req, res) => {
    try {
      const p = req.body;
      if (!p.id || !p.name || p.price === undefined) {
        return res.status(400).json({ error: 'Missing required part parameters' });
      }

      await getDb().insert(dbParts)
        .values({
          id: p.id,
          name: p.name,
          price: p.price,
        })
        .onConflictDoUpdate({
          target: dbParts.id,
          set: {
            name: p.name,
            price: p.price,
          }
        });
      res.json({ success: true, part: p });
    } catch (err: any) {
      console.error('Error in POST /api/parts:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/parts/:id', async (req, res) => {
    try {
      await getDb().delete(dbParts).where(eq(dbParts.id, req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in DELETE /api/parts:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. EXPENSE CATEGORIES
  app.get('/api/custom-expense-categories', async (req, res) => {
    try {
      const results = await getDb().select().from(dbCustomExpenseCategories);
      res.json(results);
    } catch (err: any) {
      console.error('Error in GET /api/custom-expense-categories:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/custom-expense-categories', async (req, res) => {
    try {
      const ec = req.body;
      if (!ec.id || !ec.nameAr || !ec.nameEn) {
        return res.status(400).json({ error: 'Missing required category parameters' });
      }

      await getDb().insert(dbCustomExpenseCategories)
        .values({
          id: ec.id,
          nameAr: ec.nameAr,
          nameEn: ec.nameEn,
        })
        .onConflictDoUpdate({
          target: dbCustomExpenseCategories.id,
          set: {
            nameAr: ec.nameAr,
            nameEn: ec.nameEn,
          }
        });
      res.json({ success: true, category: ec });
    } catch (err: any) {
      console.error('Error in POST /api/custom-expense-categories:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/custom-expense-categories/:id', async (req, res) => {
    try {
      await getDb().delete(dbCustomExpenseCategories).where(eq(dbCustomExpenseCategories.id, req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in DELETE /api/custom-expense-categories:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 5. MAINTENANCE REQUESTS
  app.get('/api/maintenance-requests', async (req, res) => {
    try {
      const results = await getDb().select().from(dbMaintenanceRequests);
      res.json(results);
    } catch (err: any) {
      console.error('Error in GET /api/maintenance-requests:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/maintenance-requests', async (req, res) => {
    try {
      const reqBody = req.body;
      if (!reqBody.id || !reqBody.customerName || !reqBody.phoneNumber) {
        return res.status(400).json({ error: 'Missing required maintenance request parameters' });
      }

      const val = {
        id: reqBody.id,
        customerName: reqBody.customerName,
        phoneNumber: reqBody.phoneNumber,
        date: reqBody.date,
        time: reqBody.time,
        problemType: reqBody.problemType,
        isUrgent: reqBody.isUrgent ?? false,
        actionTaken: reqBody.actionTaken ?? '',
        installedParts: reqBody.installedParts || [],
        requiredParts: reqBody.requiredParts ?? '',
        status: reqBody.status ?? 'not_ready',
        failureReason: reqBody.failureReason ?? '',
        paymentMethod: reqBody.paymentMethod ?? 'none',
        amount: reqBody.amount ?? 0,
        paidAmount: reqBody.paidAmount ?? (reqBody.paymentMethod && reqBody.paymentMethod !== 'none' ? reqBody.amount : 0),
        payments: reqBody.payments || [],
      };

      await getDb().insert(dbMaintenanceRequests)
        .values(val)
        .onConflictDoUpdate({
          target: dbMaintenanceRequests.id,
          set: val,
        });
      res.json({ success: true, request: reqBody });
    } catch (err: any) {
      console.error('Error in POST /api/maintenance-requests:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/maintenance-requests/:id', async (req, res) => {
    try {
      await getDb().delete(dbMaintenanceRequests).where(eq(dbMaintenanceRequests.id, req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in DELETE /api/maintenance-requests:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 6. FINANCIAL TRANSACTIONS
  app.get('/api/financial-transactions', async (req, res) => {
    try {
      const results = await getDb().select().from(dbFinancialTransactions);
      res.json(results);
    } catch (err: any) {
      console.error('Error in GET /api/financial-transactions:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/financial-transactions', async (req, res) => {
    try {
      const tx = req.body;
      if (!tx.id || !tx.type || !tx.category || tx.amount === undefined) {
        return res.status(400).json({ error: 'Missing required financial transaction parameters' });
      }

      const val = {
        id: tx.id,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        notes: tx.notes ?? '',
      };

      await getDb().insert(dbFinancialTransactions)
        .values(val)
        .onConflictDoUpdate({
          target: dbFinancialTransactions.id,
          set: val,
        });
      res.json({ success: true, transaction: tx });
    } catch (err: any) {
      console.error('Error in POST /api/financial-transactions:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/financial-transactions/:id', async (req, res) => {
    try {
      await getDb().delete(dbFinancialTransactions).where(eq(dbFinancialTransactions.id, req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in DELETE /api/financial-transactions:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 7. MORNING CASH
  app.get('/api/morning-cash', async (req, res) => {
    try {
      const results = await getDb().select().from(dbMorningCash);
      res.json(results);
    } catch (err: any) {
      console.error('Error in GET /api/morning-cash:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/morning-cash', async (req, res) => {
    try {
      const { amount, date } = req.body;
      if (amount === undefined || !date) {
        return res.status(400).json({ error: 'Amount and date are required' });
      }

      await getDb().insert(dbMorningCash)
        .values({ amount, date })
        .onConflictDoUpdate({
          target: dbMorningCash.date,
          set: { amount },
        });
      res.json({ success: true, amount, date });
    } catch (err: any) {
      console.error('Error in POST /api/morning-cash:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
