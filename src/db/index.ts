import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

let _pool: pkg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (_db) return _db;
  
  if (!process.env.SQL_HOST) {
    throw new Error('SQL_HOST environment variable is missing. Please configure Cloud SQL credentials.');
  }
  
  _pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
  
  _pool.on('error', (err) => {
    console.error('Unexpected error on idle SQL pool client:', err);
  });
  
  _db = drizzle(_pool, { schema });
  return _db;
};

export { schema };
