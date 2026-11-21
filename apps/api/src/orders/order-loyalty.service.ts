import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client';
import type { OrderRecord } from './order.types';

@Injectable()
export class OrderLoyaltyService {
  async redeem(
    tx: Prisma.TransactionClient,
    userId: string,
    requestedPoints: number,
    discountedSubtotal: number,
  ) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.loyaltyPoints < requestedPoints) {
      throw new ConflictException({
        code: 'INSUFFICIENT_POINTS',
        message: 'Not enough loyalty points',
      });
    }
    const points = Math.min(
      requestedPoints,
      Math.floor(Math.max(0, discountedSubtotal) / 1000),
    );
    if (points) {
      const changed = await tx.user.updateMany({
        where: { id: userId, loyaltyPoints: { gte: points } },
        data: { loyaltyPoints: { decrement: points } },
      });
      if (!changed.count) {
        throw new ConflictException({
          code: 'INSUFFICIENT_POINTS',
          message: 'Not enough loyalty points',
        });
      }
    }
    return points;
  }

  async recordRedemption(
    tx: Prisma.TransactionClient,
    userId: string,
    orderId: string,
    points: number,
  ) {
    await tx.loyaltyTransaction.create({
      data: {
        id: randomUUID(),
        userId,
        orderId,
        points: -points,
        type: 'REDEEM',
      },
    });
  }

  async refund(tx: Prisma.TransactionClient, orderId: string, userId: string) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { pointsUsed: true },
    });
    if (order?.pointsUsed) {
      const exists = await tx.loyaltyTransaction.findFirst({
        where: { orderId, type: 'REFUND' },
      });
      if (!exists) {
        await tx.user.update({
          where: { id: userId },
          data: { loyaltyPoints: { increment: order.pointsUsed } },
        });
        await tx.loyaltyTransaction.create({
          data: {
            id: randomUUID(),
            userId,
            orderId,
            points: order.pointsUsed,
            type: 'REFUND',
          },
        });
      }
    }
  }

  async earn(tx: Prisma.TransactionClient, order: OrderRecord) {
    const amount = Math.floor(order.totalAmount / 10000);
    if (!amount) return;
    const existing = await tx.loyaltyTransaction.findFirst({
      where: { orderId: order.orderId, type: 'EARN' },
    });
    if (existing) return;
    await tx.user.update({
      where: { id: order.userId },
      data: { loyaltyPoints: { increment: amount } },
    });
    await tx.loyaltyTransaction.create({
      data: {
        id: randomUUID(),
        userId: order.userId,
        orderId: order.orderId,
        points: amount,
        type: 'EARN',
      },
    });
    await tx.order.update({
      where: { id: order.orderId },
      data: { pointsEarned: amount },
    });
  }
}
