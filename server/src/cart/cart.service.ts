import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: {
              include: { images: true }
            },
            lensPackage: true,
            prescription: true
          }
        }
      }
    });
    return cart ? cart.items : [];
  }

  async addToCart(userId: string, data: any) {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        productVariantId: data.productVariantId,
        lensPackageId: data.lensPackageId,
        prescriptionId: data.prescriptionId,
        quantity: data.quantity || 1,
      }
    });
  }

  async updateQuantity(id: string, userId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({ 
      where: { id },
      include: { cart: true }
    });
    
    if (!item || item.cart.userId !== userId) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.update({
      where: { id },
      data: { quantity }
    });
  }

  async removeFromCart(id: string, userId: string) {
    const item = await this.prisma.cartItem.findUnique({ 
      where: { id },
      include: { cart: true }
    });
    
    if (!item || item.cart.userId !== userId) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.delete({ where: { id } });
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      return this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
}
