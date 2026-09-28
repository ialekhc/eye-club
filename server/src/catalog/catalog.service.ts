import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(params: {
    category?: string;
    brand?: string;
    frameShape?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) {
    const where: Prisma.ProductWhereInput = { status: 'PUBLISHED' };

    if (params.category) {
      where.category = { slug: params.category };
    }
    if (params.brand) {
      where.brand = { slug: params.brand };
    }
    if (params.frameShape) {
      where.frameShape = params.frameShape;
    }
    if (params.gender) {
      where.gender = params.gender;
    }
    if (params.minPrice || params.maxPrice) {
      where.basePrice = {};
      if (params.minPrice) where.basePrice.gte = params.minPrice;
      if (params.maxPrice) where.basePrice.lte = params.maxPrice;
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        variants: {
          where: { isActive: true },
          include: {
            images: { orderBy: { displayOrder: 'asc' } }
          }
        }
      }
    });
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, status: 'PUBLISHED' },
      include: {
        brand: true,
        category: true,
        variants: {
          where: { isActive: true },
          include: {
            images: { orderBy: { displayOrder: 'asc' } },
            inventory: true
          }
        }
      }
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async getBrands() {
    return this.prisma.brand.findMany({ orderBy: { name: 'asc' } });
  }
}
