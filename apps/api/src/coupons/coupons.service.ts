import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}
  async listActive() { return this.prisma.coupon.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }); }
  async calculateDiscount(tx: Prisma.TransactionClient, code: string, amount: number) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) throw new BadRequestException('Mã khuyến mãi không được để trống');
    const coupon = await tx.coupon.findUnique({ where: { code: normalized } });
    if (!coupon || !coupon.isActive) throw new NotFoundException('Mã khuyến mãi không tồn tại hoặc đã hết hạn');
    if (amount < coupon.minOrderAmount) throw new BadRequestException(`Đơn hàng cần đạt tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để áp dụng mã ${coupon.code}`);
    let discount = coupon.discountPercent ? Math.round(amount * coupon.discountPercent / 100) : (coupon.discountAmount ?? 0);
    if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
    return { code: coupon.code, amount: Math.min(discount, amount) };
  }
  async validateCoupon(code: string, amount: number) {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new BadRequestException('Giá trị đơn hàng không hợp lệ');
    const result = await this.prisma.$transaction(tx => this.calculateDiscount(tx, code, amount));
    return { valid: true, code: result.code, discountAmount: result.amount, minOrderAmount: (await this.prisma.coupon.findUnique({ where: { code: result.code }, select: { minOrderAmount: true } }))?.minOrderAmount ?? 0 };
  }
}
