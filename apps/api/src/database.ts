import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

export interface Queryable {
  query<R extends QueryResultRow = any>(text: string, values?: any[]): Promise<QueryResult<R>>;
}

@Injectable()
export class Database extends Pool implements OnModuleDestroy {
  constructor() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    super({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    this.on('error', () => console.error('Idle database connection error'));
  }

  async onModuleDestroy() { await this.end(); }

  async transaction<T>(work: (client: Queryable) => Promise<T>): Promise<T> {
    const client = await this.connect();
    let discard = false;
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try { await client.query('ROLLBACK'); }
      catch { discard = true; }
      throw error;
    } finally { client.release(discard); }
  }
}
