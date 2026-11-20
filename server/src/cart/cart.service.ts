import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CartItemDto } from '../commerce.dto.js';
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}
  async getCart(userId: string) {
    return (await this.prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true, variant: { include: { images: true } }, lensPackage: true, prescription: true }, orderBy: { createdAt: 'asc' } } } }))?.items ?? [];
  }
  async addToCart(userId: string, data: CartItemDto) {
    const variant = await this.prisma.productVariant.findFirst({ where: { id: data.productVariantId, productId: data.productId, isActive: true, product: { status: 'PUBLISHED' } } });
    if (!variant) throw new BadRequestException('This product variant is unavailable.');
    if (data.lensPackageId && !await this.prisma.lensPackage.findFirst({ where: { id: data.lensPackageId, isActive: true, lensType: { isActive: true } } })) throw new BadRequestException('Lens package unavailable.');
    if (data.prescriptionId && !await this.prisma.prescription.findFirst({ where: { id: data.prescriptionId, userId } })) throw new BadRequestException('Prescription does not belong to you.');
    const cart = await this.prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    return this.prisma.cartItem.create({ data: { cartId: cart.id, ...data } });
  }
  async updateQuantity(id: string, userId: string, quantity: number) {
    const result = await this.prisma.cartItem.updateMany({ where: { id, cart: { userId } }, data: { quantity } });
    if (!result.count) throw new NotFoundException('Cart item not found');
    return { success: true };
  }
  async removeFromCart(id: string, userId: string) {
    const result = await this.prisma.cartItem.deleteMany({ where: { id, cart: { userId } } });
    if (!result.count) throw new NotFoundException('Cart item not found');
    return { success: true };
  }
}
