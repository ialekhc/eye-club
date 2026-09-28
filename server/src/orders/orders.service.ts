import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!order || order.userId !== userId) throw new NotFoundException('Order not found');
    return order;
  }

  async createOrderFromCart(userId: string, data: { shippingAddressId: string, billingAddressId?: string, paymentMethod: PaymentMethod }) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId }, include: { items: { include: { variant: true, product: true, lensPackage: true } } } });
      
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const cartItems = cart.items;
      
      let totalAmount = 0;
      const orderItemsData = cartItems.map(item => {
        const framePrice = item.variant.price ? Number(item.variant.price) : Number(item.product.basePrice);
        const lensPrice = item.lensPackage ? Number(item.lensPackage.price) : 0;
        const unitPrice = framePrice;
        const totalPrice = (unitPrice + lensPrice) * item.quantity;
        
        totalAmount += totalPrice;

        return {
          productVariantId: item.productVariantId,
          lensPackageId: item.lensPackageId,
          prescriptionId: item.prescriptionId,
          productName: item.product.name,
          sku: item.variant.sku,
          quantity: item.quantity,
          unitPrice,
          lensPrice,
          totalPrice
        };
      });

      const order = await tx.order.create({
        data: {
          userId,
          orderNumber: `ORD-${Date.now()}`,
          status: OrderStatus.PENDING_PAYMENT,
          subtotal: totalAmount,
          totalAmount,
          shippingAddressId: data.shippingAddressId,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'PENDING',
          items: {
            create: orderItemsData
          }
        }
      });

      // Clear the cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  }
}
