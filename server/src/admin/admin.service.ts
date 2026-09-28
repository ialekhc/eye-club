import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus, ProductStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalOrders, totalProducts, totalUsers, recentOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.product.count(),
      this.prisma.user.count(),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } }
      })
    ]);

    return {
      metrics: {
        totalOrders,
        totalProducts,
        totalUsers,
        revenue: 250000 // Placeholder logic
      },
      recentOrders
    };
  }

  async getOrders(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
  }

  async getProducts() {
    return this.prisma.product.findMany({
      include: {
        brand: true,
        category: true,
        variants: { include: { inventory: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateProductStatus(productId: string, status: ProductStatus) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { status }
    });
  }
}
