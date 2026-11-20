import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { CheckoutDto } from '../commerce.dto.js';
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}
  getUserOrders(userId: string) { return this.prisma.order.findMany({ where: { userId }, include: { items: true, statusHistory: true, shippingAddress: true }, orderBy: { createdAt: 'desc' } }); }
  async getOrder(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id, userId }, include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } }, shippingAddress: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
  async createOrderFromCart(userId: string, data: CheckoutDto) {
    if (data.paymentMethod !== 'CASH_ON_DELIVERY') throw new BadRequestException('Only cash on delivery is currently available for online orders.');
    try {
      return await this.prisma.$transaction(async tx => {
        const cart = await tx.cart.findUnique({ where: { userId }, include: { items: { include: { variant: true, product: true, lensPackage: { include: { lensType: true } }, prescription: true } } } });
        if (!cart?.items.length) throw new BadRequestException('Your cart is empty.');
        let subtotal = new Prisma.Decimal(0);
        const items = [];
        for (const item of cart.items) {
          if (!item.variant.isActive || item.product.status !== 'PUBLISHED' || item.variant.productId !== item.productId) throw new BadRequestException('A product is no longer available.');
          if (item.lensPackage && (!item.lensPackage.isActive || !item.lensPackage.lensType.isActive)) throw new BadRequestException('A lens package is no longer available.');
          if (item.prescription && item.prescription.userId !== userId) throw new BadRequestException('Invalid prescription.');
          const stock = await tx.inventory.findFirst({ where: { productVariantId: item.productVariantId, availableQuantity: { gte: item.quantity }, store: { isActive: true } }, orderBy: { id: 'asc' } });
          if (!stock) throw new ConflictException(`${item.product.name} has insufficient stock.`);
          const updated = await tx.inventory.updateMany({ where: { id: stock.id, availableQuantity: { gte: item.quantity } }, data: { availableQuantity: { decrement: item.quantity } } });
          if (!updated.count) throw new ConflictException('Stock changed. Please retry checkout.');
          const unitPrice = item.variant.price ?? item.product.discountPrice ?? item.product.basePrice;
          const lensPrice = item.lensPackage?.price ?? new Prisma.Decimal(0);
          const totalPrice = unitPrice.add(lensPrice).mul(item.quantity);
          subtotal = subtotal.add(totalPrice);
          items.push({ inventoryId: stock.id, productVariantId: item.productVariantId, lensPackageId: item.lensPackageId, prescriptionId: item.prescriptionId, productName: item.product.name, sku: item.variant.sku, quantity: item.quantity, unitPrice, lensPrice, totalPrice });
        }
        const deliveryFee = subtotal.gte(5000) ? new Prisma.Decimal(0) : new Prisma.Decimal(200);
        const address = await tx.address.create({ data: { userId, ...data.address } });
        const order = await tx.order.create({ data: { userId, orderNumber: `EC-${randomUUID().slice(0, 12).toUpperCase()}`, status: 'ORDER_PLACED', subtotal, deliveryFee, totalAmount: subtotal.add(deliveryFee), balanceDue: subtotal.add(deliveryFee), shippingAddressId: address.id, paymentMethod: 'CASH_ON_DELIVERY', notes: data.notes, items: { create: items }, statusHistory: { create: { status: 'ORDER_PLACED', note: 'Cash on delivery order received.' } } }, include: { items: true, shippingAddress: true, statusHistory: true } });
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        return order;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') throw new ConflictException('Your cart or stock changed. Reload and retry.');
      throw error;
    }
  }
}
