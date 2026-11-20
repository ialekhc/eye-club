import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { SaaSTier, UserRole, VendorStatus } from '@prisma/client';

export interface CreateVendorDto {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  taxId?: string;
  address?: string;
  brandColor?: string;
  plan?: SaaSTier;
  commissionRate?: number;
  primaryStoreName?: string;
}

export interface UpdateVendorDto {
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  brandColor?: string;
  plan?: SaaSTier;
  status?: VendorStatus;
  commissionRate?: number;
  maxStores?: number;
  maxPosRegisters?: number;
}

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async listVendors(userId?: string) {
    const vendors = await this.prisma.vendor.findMany({
      where: userId ? { members: { some: { userId, isActive: true } } } : {},
      include: {
        stores: {
          include: {
            posRegisters: true,
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
          },
        },
        _count: {
          select: {
            stores: true,
            products: true,
            orders: true,
            posRegisters: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const orderAggregates = await this.prisma.order.groupBy({
      by: ['vendorId'],
      _sum: { totalAmount: true, paidAmount: true },
      where: { vendorId: { not: null } },
    });

    const revenueByVendor = new Map(
      orderAggregates.map((row) => [
        row.vendorId,
        {
          totalRevenue: Number(row._sum.totalAmount ?? 0),
          collectedRevenue: Number(row._sum.paidAmount ?? 0),
        },
      ]),
    );

    return vendors.map((vendor) => ({
      ...vendor,
      metrics: revenueByVendor.get(vendor.id) ?? { totalRevenue: 0, collectedRevenue: 0 },
    }));
  }

  async getVendorById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        stores: {
          include: {
            posRegisters: {
              include: {
                sessions: {
                  where: { status: 'OPEN' },
                  take: 1,
                },
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
            store: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            stores: true,
            products: true,
            orders: true,
            posRegisters: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async createVendor(dto: CreateVendorDto) {
    const cleanSlug = dto.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-');

    const existing = await this.prisma.vendor.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      throw new BadRequestException(`Vendor slug "${cleanSlug}" is already in use.`);
    }

    const plan = dto.plan ?? SaaSTier.STARTER;
    const limits =
      plan === SaaSTier.ENTERPRISE
        ? { maxStores: 15, maxPosRegisters: 30 }
        : plan === SaaSTier.PROFESSIONAL
          ? { maxStores: 5, maxPosRegisters: 10 }
          : { maxStores: 2, maxPosRegisters: 3 };

    return this.prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          name: dto.name.trim(),
          slug: cleanSlug,
          email: dto.email.trim(),
          phone: dto.phone?.trim(),
          taxId: dto.taxId?.trim(),
          address: dto.address?.trim(),
          brandColor: dto.brandColor ?? '#4f46e5',
          plan,
          status: VendorStatus.ACTIVE,
          commissionRate: dto.commissionRate ?? 10.0,
          ...limits,
        },
      });

      const store = await tx.store.create({
        data: {
          vendorId: vendor.id,
          name: dto.primaryStoreName?.trim() || `${vendor.name} - Main Branch`,
          address: dto.address?.trim() || 'Main Street, Kathmandu',
          phone: dto.phone?.trim(),
          openingHours: '10:00 AM - 7:00 PM',
          services: ['Eye Exam', 'Optical Dispensary', 'Frame Fitting'],
        },
      });

      await tx.posRegister.create({
        data: {
          vendorId: vendor.id,
          storeId: store.id,
          name: 'Counter #1 - Main POS',
        },
      });

      return { ...vendor, stores: [{ ...store, posRegisters: await tx.posRegister.findMany({ where: { storeId: store.id } }) }], members: [], _count: { stores: 1, posRegisters: 1, products: 0, orders: 0 }, metrics: { totalRevenue: 0, collectedRevenue: 0 } };
    });
  }

  async updateVendor(id: string, dto: UpdateVendorDto) {
    const existing = await this.getVendorById(id);
    const limits = dto.plan ? (dto.plan === 'ENTERPRISE' ? {maxStores:15,maxPosRegisters:30} : dto.plan === 'PROFESSIONAL' ? {maxStores:5,maxPosRegisters:10} : {maxStores:2,maxPosRegisters:3}) : {maxStores:existing.maxStores,maxPosRegisters:existing.maxPosRegisters};
    if(existing._count.stores > (dto.maxStores ?? limits.maxStores) || existing._count.posRegisters > (dto.maxPosRegisters ?? limits.maxPosRegisters)) throw new BadRequestException('Existing branches/registers exceed the requested plan limits.');
    return this.prisma.vendor.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        taxId: dto.taxId,
        address: dto.address,
        brandColor: dto.brandColor,
        plan: dto.plan,
        status: dto.status,
        commissionRate: dto.commissionRate,
        maxStores: dto.maxStores ?? limits.maxStores,
        maxPosRegisters: dto.maxPosRegisters ?? limits.maxPosRegisters,
      },
    });
  }

  async createVendorStore(
    vendorId: string,
    input: { name: string; address: string; phone?: string; openingHours?: string; registerName?: string },
  ) {
    const vendor = await this.getVendorById(vendorId);
    if (vendor._count.posRegisters >= vendor.maxPosRegisters) throw new BadRequestException("Register limit reached.");
    if (vendor._count.stores >= vendor.maxStores) {
      throw new BadRequestException(
        `Vendor has reached the maximum number of stores (${vendor.maxStores}) for the ${vendor.plan} plan.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          vendorId,
          name: input.name.trim(),
          address: input.address.trim(),
          phone: input.phone?.trim(),
          openingHours: input.openingHours ?? '10:00 AM - 7:00 PM',
          services: ['Eye Exam', 'Optical Dispensary'],
        },
      });

      await tx.posRegister.create({
        data: {
          vendorId,
          storeId: store.id,
          name: input.registerName?.trim() || 'Counter #1 - Main POS',
        },
      });

      return store;
    });
  }

  async createPosRegister(vendorId: string, input: { storeId: string; name: string }) {
    const vendor = await this.getVendorById(vendorId);
    if (vendor._count.posRegisters >= vendor.maxPosRegisters) {
      throw new BadRequestException(
        `Vendor has reached the maximum POS registers (${vendor.maxPosRegisters}) for the ${vendor.plan} plan.`,
      );
    }

    if (!vendor.stores.some(store => store.id === input.storeId)) throw new BadRequestException("Store does not belong to vendor");
    return this.prisma.posRegister.create({
      data: {
        vendorId,
        storeId: input.storeId,
        name: input.name.trim(),
      },
    });
  }

  async addVendorMember(
    vendorId: string,
    input: { email: string; firstName: string; lastName: string; role: UserRole; storeId?: string },
  ) {
    const vendor = await this.getVendorById(vendorId);
    if (!["VENDOR_OWNER", "STORE_MANAGER", "OPTOMETRIST", "CASHIER", "ORDER_MANAGER", "INVENTORY_MANAGER", "CUSTOMER_SUPPORT"].includes(input.role)) throw new BadRequestException("Invalid staff role");
    if (input.storeId && !vendor.stores.some(store => store.id === input.storeId)) throw new BadRequestException("Store does not belong to vendor");

    const existingUser = await this.prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
    const user = await this.prisma.user.upsert({
      where: { email: input.email.trim().toLowerCase() },
      update: {},
      create: {
        email: input.email.trim().toLowerCase(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        passwordHash: await argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id }),
        role: input.role,
      },
    });

    const member = await this.prisma.vendorMember.upsert({
      where: {
        vendorId_userId: {
          vendorId,
          userId: user.id,
        },
      },
      update: {
        role: input.role,
        storeId: input.storeId ?? null,
        isActive: false,
      },
      create: {
        vendorId,
        userId: user.id,
        isActive: false,
        role: input.role,
        storeId: input.storeId ?? null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        store: { select: { id: true, name: true } },
      },
    });
    const invitationToken = randomBytes(48).toString('base64url');
    await this.prisma.accountToken.create({ data: { userId:user.id,tokenHash:createHash('sha256').update(invitationToken).digest('hex'),purpose:`${existingUser ? 'INVITE_EXISTING':'INVITE_NEW'}:${member.id}`,expiresAt:new Date(Date.now()+7*86400000) } });
    return { ...member, invitationToken };
  }
}

