import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

export type DbTransaction = Prisma.TransactionClient;

@Injectable()
export class Database extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    super();
  }
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }

  async transaction<T>(work: (tx: DbTransaction) => Promise<T>): Promise<T> {
    // Serializable isolation prevents concurrent checkout/payment write skew.
    // P2034 is exposed as a 409 conflict by ApiErrorFilter; clients may retry.
    return this.$transaction(work, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    });
  }
}
