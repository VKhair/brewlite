import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class Database extends Pool implements OnModuleDestroy {
  constructor() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    super({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    this.on('error', (error) => console.error('Idle database connection error:', error.message));
  }

  async onModuleDestroy() { await this.end(); }
}
