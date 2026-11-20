import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { OrderStatus, ProductStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalOrders, totalProducts, totalUsers, recentOrders, revenue] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.product.count(),
      this.prisma.user.count(),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } }
      }),
      this.prisma.order.aggregate({ _sum: { paidAmount: true } })
    ]);

    return {
      metrics: {
        totalOrders,
        totalProducts,
        totalUsers,
        revenue: Number(revenue._sum.paidAmount ?? 0)
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
    if (!Object.values(OrderStatus).includes(status)) throw new BadRequestException('Invalid order status.');
    return this.prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({where:{id:orderId},include:{items:true}});
      if(!order) throw new NotFoundException('Order not found');
      if(order.status === status) return order;
      const flow = ['PENDING_PAYMENT','ORDER_PLACED','PRESCRIPTION_PENDING','PRESCRIPTION_VERIFICATION','PRESCRIPTION_CONFIRMED','LENS_PROCESSING','QUALITY_CHECK','READY_TO_SHIP','SHIPPED','OUT_FOR_DELIVERY','DELIVERED'];
      if(['DELIVERED','CANCELLED','REFUNDED','RETURNED'].includes(order.status)) throw new BadRequestException('This order is already finalized.');
      if(status === 'CANCELLED') {
        if(['SHIPPED','OUT_FOR_DELIVERY'].includes(order.status)) throw new BadRequestException('Shipped orders require a return workflow.');
        for(const item of order.items) if(item.inventoryId) await tx.inventory.update({where:{id:item.inventoryId},data:{availableQuantity:{increment:item.quantity}}});
      } else if (!flow.includes(status) || flow.indexOf(status) <= flow.indexOf(order.status)) throw new BadRequestException('Choose a later fulfillment status or cancel an unshipped order.');
      return tx.order.update({where:{id:orderId},data:{status,statusHistory:{create:{status,note:'Status updated by retail administration.'}},...(status === 'DELIVERED' && order.paymentMethod === 'CASH_ON_DELIVERY' ? {paymentStatus:'COMPLETED',paidAmount:order.totalAmount,balanceDue:0}: {})}});
    },{isolationLevel:'Serializable'});
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

  async createProduct(input: import('./catalog.dto.js').CreateProductDto) {
    const store = await this.prisma.store.findUnique({ where: { id: input.storeId } });
    if (!store) throw new BadRequestException('Choose a valid inventory store.');
    return this.prisma.product.create({ data: {
      name: input.name, slug: input.slug, skuBase: input.sku, description: input.description,
      categoryId: input.categoryId || null, brandId: input.brandId || null, vendorId: store.vendorId,
      basePrice: input.basePrice, prescriptionCompatible: input.prescriptionCompatible ?? true,
      frameShape: input.frameShape, status: 'DRAFT',
      variants: { create: { sku: input.sku, color: input.color, size: input.size, images: input.imageUrl ? { create: { url: input.imageUrl, isPrimary: true } } : undefined, inventory: { create: { storeId: store.id, availableQuantity: input.stock } } } },
    }, include: { variants: true } });
  }
  async updateInventory(variantId: string, input: import('./catalog.dto.js').InventoryDto) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId }, include: { product:true } });
    const store = await this.prisma.store.findUnique({ where: { id:input.storeId } });
    if (!variant || !store) throw new NotFoundException('Variant or store not found.');
    if (variant.product.vendorId && variant.product.vendorId !== store.vendorId) throw new BadRequestException('Product and stock store must belong to the same vendor.');
    return this.prisma.inventory.upsert({ where: { storeId_productVariantId: { storeId: input.storeId, productVariantId: variantId } }, create: { storeId: input.storeId, productVariantId: variantId, availableQuantity: input.quantity }, update: { availableQuantity: input.quantity } });
  }
  async updateProductStatus(productId: string, status: ProductStatus) {
    if (!Object.values(ProductStatus).includes(status)) throw new BadRequestException("Invalid product status.");
    return this.prisma.product.update({
      where: { id: productId },
      data: { status }
    });
  }
}
