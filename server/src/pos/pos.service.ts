import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import {
  DeliveryMethod,
  LabStatus,
  OrderChannel,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PosSessionStatus,
  Prisma,
} from '@prisma/client';

export interface PosPrescriptionInput {
  odSph?: string;
  odCyl?: string;
  odAxis?: string;
  odAdd?: string;
  osSph?: string;
  osCyl?: string;
  osAxis?: string;
  osAdd?: string;
  pd?: string;
  lensType?: string;
  coating?: string;
  doctorName?: string;
  notes?: string;
}

export interface PosOrderItemInput {
  productVariantId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lensPackageId?: string;
  lensPackageName?: string;
  lensPrice?: number;
  prescriptionData?: PosPrescriptionInput;
}

export interface CreatePosOrderDto {
  vendorId?: string;
  storeId?: string;
  posRegisterId?: string;
  posSessionId?: string;
  cashierId?: string;
  userId?: string;
  customerName?: string;
  customerPhone?: string;
  items: PosOrderItemInput[];
  discount?: number;
  taxAmount?: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  paymentBreakdown?: {
    cash?: number;
    card?: number;
    digital?: number;
    insurance?: number;
    changeGiven?: number;
  };
  notes?: string;
}

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegisters(vendorId?: string, storeId?: string) {
    return this.prisma.posRegister.findMany({
      where: {
        ...(vendorId ? { vendorId } : {}),
        ...(storeId ? { storeId } : {}),
      },
      include: {
        vendor: { select: { id: true, name: true, slug: true, currency: true, brandColor: true } },
        store: { select: { id: true, name: true, address: true, phone: true } },
        sessions: {
          where: { status: PosSessionStatus.OPEN },
          include: {
            cashier: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { openedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async openSession(input: {
    registerId: string;
    vendorId: string;
    cashierEmail?: string;
    cashierId: string;
    openingCash: number;
    notes?: string;
  }) {
    const register = await this.prisma.posRegister.findFirst({ where: { id: input.registerId, vendorId: input.vendorId, isActive: true, vendor: { status: { in: ['ACTIVE', 'TRIALING'] } } } });
    if (!register || !Number.isFinite(input.openingCash) || input.openingCash < 0) throw new BadRequestException('Invalid register or opening cash.');
    const existingOpen = await this.prisma.posSession.findFirst({
      where: { registerId: input.registerId, status: PosSessionStatus.OPEN },
      include: {
        register: true,
        cashier: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (existingOpen) {
      if (existingOpen.cashierId !== input.cashierId) throw new BadRequestException("Register is in use by another cashier.");
      return existingOpen;
    }

    return this.prisma.posSession.create({
      data: {
        registerId: input.registerId,
        vendorId: input.vendorId,
        cashierId: input.cashierId,
        openingCash: input.openingCash,
        status: PosSessionStatus.OPEN,
        notes: input.notes,
      },
      include: {
        register: true,
        cashier: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async closeSession(sessionId: string, input: { closingCash: number; notes?: string }) {
    if (!Number.isFinite(input.closingCash) || input.closingCash < 0) throw new BadRequestException('Invalid closing cash.');
    return this.prisma.$transaction(async tx => {
      const locked = await tx.posSession.updateMany({ where: { id: sessionId, status: 'OPEN' }, data: { cashSales: { increment: 0 } } });
      if (!locked.count) throw new BadRequestException('Session is unavailable or already closed.');
      const session = await tx.posSession.findUniqueOrThrow({ where: { id: sessionId } });
      const expectedCash = Number(session.openingCash) + Number(session.cashSales);
      return tx.posSession.update({ where: { id: sessionId }, data: { closingCash: input.closingCash, expectedCash, difference: input.closingCash - expectedCash, closedAt: new Date(), status: 'CLOSED', notes: input.notes ?? session.notes }, include: { register: true, cashier: { select: { id:true,firstName:true,lastName:true,email:true } } } });
    });
  }

  async getPosCatalog(params: { vendorId?: string; storeId?: string; search?: string }) {
    const search = params.search?.trim();
    const where: Prisma.ProductWhereInput = { status: 'PUBLISHED', AND: [
      ...(params.vendorId ? [{ OR: [{ vendorId: params.vendorId }, { vendorId: null }] }] : []),
      ...(search ? [{ OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { skuBase: { contains: search, mode: 'insensitive' as const } }] }] : []),
    ] };

    const [products, lensTypes] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          variants: {
            where: { isActive: true },
            include: {
              images: { orderBy: { displayOrder: 'asc' }, take: 1 },
              inventory: params.storeId ? { where: { storeId: params.storeId } } : true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.lensType.findMany({
        where: { isActive: true },
        include: {
          packages: { where: { isActive: true }, orderBy: { price: 'asc' } },
        },
      }),
    ]);

    return { products, lensTypes };
  }

  async createPosOrder(dto: CreatePosOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('POS order requires at least one item.');
    }

    if (!dto.vendorId || !dto.storeId || !dto.posSessionId || !dto.posRegisterId) throw new BadRequestException('An open register session is required.');
    const session = await this.prisma.posSession.findFirst({ where: { id: dto.posSessionId, vendorId: dto.vendorId, registerId: dto.posRegisterId, status: 'OPEN', vendor: { status: { in:['ACTIVE','TRIALING'] } }, register: { storeId: dto.storeId, isActive: true, store: { isActive: true } } } });
    if (!session || session.cashierId !== dto.cashierId) throw new BadRequestException('Open your own register session first.');
    if (![dto.discount ?? 0, dto.taxAmount ?? 0, dto.paidAmount].every(v => Number.isFinite(v) && v >= 0)) throw new BadRequestException('Invalid payment values.');
    if (!Object.values(PaymentMethod).includes(dto.paymentMethod)) throw new BadRequestException('Invalid payment method.');
    for (const item of dto.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new BadRequestException('Invalid item quantity.');
      const variant = await this.prisma.productVariant.findFirst({ where: { id: item.productVariantId, isActive: true, product: { status: 'PUBLISHED', OR: [{ vendorId: dto.vendorId }, { vendorId: null }] } }, include: { product: true } });
      if (!variant) throw new BadRequestException('Product unavailable for this vendor.');
      item.unitPrice = Number(variant.price ?? variant.product.discountPrice ?? variant.product.basePrice);
      item.productName = variant.product.name;
      item.sku = variant.sku;
      item.lensPrice = 0;
      if (item.lensPackageId) {
        const lens = await this.prisma.lensPackage.findFirst({ where: { id: item.lensPackageId, isActive: true } });
        if (!lens) throw new BadRequestException('Lens package unavailable.');
        item.lensPrice = Number(lens.price);
      }
    }
    const subtotal = dto.items.reduce((sum, item) => sum + Math.round((item.unitPrice + (item.lensPrice ?? 0)) * 100) * item.quantity, 0) / 100;
    const discount = Math.max(0, Number(dto.discount ?? 0));
    const taxAmount = Math.max(0, Number(dto.taxAmount ?? 0));
    if (discount > subtotal) throw new BadRequestException("Discount exceeds subtotal.");
    if (taxAmount !== 0 && Math.abs(taxAmount - Math.round((subtotal - discount) * 13) / 100) > 0.01) throw new BadRequestException("VAT must be zero or 13 percent.");
    const totalAmount = Math.round((subtotal - discount + taxAmount) * 100) / 100;
    if (dto.paidAmount > totalAmount) throw new BadRequestException('Amount paid exceeds total. Record cash tender separately.');
    const paidAmount = Math.min(totalAmount, Math.max(0, Number(dto.paidAmount ?? totalAmount)));
    const balanceDue = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));

    if (dto.paymentBreakdown) {
      const b = dto.paymentBreakdown;
      const collected = (b.cash ?? 0) + (b.card ?? 0) + (b.digital ?? 0) + (b.insurance ?? 0) - (b.changeGiven ?? 0);
      if (Math.abs(collected - paidAmount) > 0.01 || (b.changeGiven ?? 0) > (b.cash ?? 0)) throw new BadRequestException('Payment breakdown does not match amount collected.');
    }

    const paymentStatus: PaymentStatus =
      balanceDue <= 0
        ? PaymentStatus.COMPLETED
        : paidAmount > 0
          ? PaymentStatus.PARTIALLY_PAID
          : PaymentStatus.PENDING;

    const requiresLab = dto.items.some(
      (item) => Boolean(item.lensPackageId) || Boolean(item.prescriptionData),
    );

    const labStatus: LabStatus = requiresLab ? LabStatus.PENDING_LAB : LabStatus.DELIVERED;
    const orderStatus: OrderStatus = requiresLab ? OrderStatus.LENS_PROCESSING : OrderStatus.DELIVERED;
    const deliveryMethod: DeliveryMethod = requiresLab
      ? DeliveryMethod.STORE_PICKUP
      : DeliveryMethod.IN_STORE_IMMEDIATE;

    const orderNumber = `POS-${randomUUID().slice(0, 12).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.posSession.updateMany({ where: { id: dto.posSessionId, status: 'OPEN', cashierId: dto.cashierId }, data: { cashSales: { increment: 0 } } });
      if (!locked.count) throw new BadRequestException('Register session was closed.');
      const order = await tx.order.create({
        data: {
          orderNumber,
          vendorId: dto.vendorId ?? null,
          storeId: dto.storeId ?? null,
          posRegisterId: dto.posRegisterId ?? null,
          posSessionId: dto.posSessionId ?? null,
          cashierId: dto.cashierId ?? null,
          userId: dto.userId ?? null,
          customerName: dto.customerName?.trim() || 'Walk-in Customer',
          customerPhone: dto.customerPhone?.trim() || null,
          orderChannel: OrderChannel.POS,
          status: orderStatus,
          labStatus,
          subtotal,
          discount,
          taxAmount,
          deliveryFee: 0,
          totalAmount,
          paidAmount,
          balanceDue,
          paymentMethod: dto.paymentMethod,
          paymentStatus,
          paymentBreakdown: (dto.paymentBreakdown ?? {
            cash: dto.paymentMethod === 'CASH' ? paidAmount : 0,
            card: dto.paymentMethod === 'CARD' ? paidAmount : 0,
          }) as Prisma.InputJsonValue,
          deliveryMethod,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              productVariantId: item.productVariantId,
              lensPackageId: item.lensPackageId || null,
              productName: item.productName,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lensPrice: item.lensPrice ?? 0,
              totalPrice: (Number(item.unitPrice) + Number(item.lensPrice ?? 0)) * item.quantity,
              prescriptionData: item.prescriptionData
                ? (item.prescriptionData as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            })),
          },
          statusHistory: {
            create: {
              status: orderStatus,
              note: requiresLab
                ? 'POS optical order created and queued for lab lens edging.'
                : 'POS retail order fulfilled immediately at counter.',
            },
          },
        },
        include: {
          items: true,
          store: true,
          vendor: true,
        },
      });

      if (dto.storeId) {
        for (const item of dto.items) {
          const stockUpdate = await tx.inventory.updateMany({
            where: {
              storeId: dto.storeId,
              productVariantId: item.productVariantId,
              availableQuantity: { gte: item.quantity },
            },
            data: {
              availableQuantity: { decrement: item.quantity },
            },
          });
          if (!stockUpdate.count) throw new BadRequestException(`${item.productName} has insufficient stock.`);
        }
      }

      if (dto.posSessionId) {
        const cashDelta =
          dto.paymentBreakdown?.cash !== undefined
            ? Number(dto.paymentBreakdown.cash) - Number(dto.paymentBreakdown.changeGiven ?? 0)
            : dto.paymentMethod === PaymentMethod.CASH
              ? paidAmount
              : 0;
        const cardDelta =
          dto.paymentBreakdown?.card !== undefined
            ? Number(dto.paymentBreakdown.card)
            : dto.paymentMethod === PaymentMethod.CARD
              ? paidAmount
              : 0;
        const digitalDelta =
          dto.paymentBreakdown?.digital !== undefined
            ? Number(dto.paymentBreakdown.digital)
            : dto.paymentMethod === PaymentMethod.ESEWA || dto.paymentMethod === PaymentMethod.KHALTI
              ? paidAmount
              : 0;

        await tx.posSession.update({
          where: { id: dto.posSessionId },
          data: {
            cashSales: { increment: Math.max(0, cashDelta) },
            cardSales: { increment: Math.max(0, cardDelta) },
            digitalSales: { increment: Math.max(0, digitalDelta) },
          },
        });
      }

      return order;
    });
  }

  async listPosOrders(params: { vendorId?: string; storeId?: string; labStatus?: LabStatus }) {
    return this.prisma.order.findMany({
      where: {
        orderChannel: OrderChannel.POS,
        ...(params.vendorId ? { vendorId: params.vendorId } : {}),
        ...(params.storeId ? { storeId: params.storeId } : {}),
        ...(params.labStatus ? { labStatus: params.labStatus } : {}),
      },
      include: {
        items: true,
        store: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true, currency: true } },
        posRegister: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateLabAndPayment(
    orderId: string,
    input: { labStatus?: LabStatus; collectBalance?: boolean; paymentMethod?: PaymentMethod; collectionSessionId?: string },
  ) {
    return this.prisma.$transaction(async tx => {
      const order = await tx.order.findFirst({ where: { id: orderId, orderChannel: 'POS' } });
      if (!order) throw new NotFoundException('POS order not found');
      const nextLabStatus = input.labStatus ?? order.labStatus;
      const nextOrderStatus = nextLabStatus === 'DELIVERED' ? 'DELIVERED' : nextLabStatus === 'READY_FOR_PICKUP' ? 'READY_TO_SHIP' : nextLabStatus === 'QUALITY_CHECK' ? 'QUALITY_CHECK' : 'LENS_PROCESSING';
      if (input.collectBalance && order.balanceDue.gt(0)) {
        if (!input.collectionSessionId) throw new BadRequestException('Open a register session before collecting the balance.');
        const active = await tx.posSession.findFirst({ where: { id:input.collectionSessionId, vendorId:order.vendorId ?? undefined, status:'OPEN', register: { storeId:order.storeId ?? undefined } } });
        if (!active) throw new BadRequestException('No open register in this store.');
        const method = input.paymentMethod ?? 'CASH';
        await tx.posSession.update({where:{id:active.id},data: method === 'CASH' ? { cashSales:{increment:order.balanceDue} } : method === 'CARD' ? {cardSales:{increment:order.balanceDue}} : {digitalSales:{increment:order.balanceDue}}});
      }
      return tx.order.update({ where: { id: orderId }, data: {
        labStatus:nextLabStatus,status:nextOrderStatus,
        statusHistory:{create:{status:nextOrderStatus,note:input.collectBalance ? 'Lab status updated; remaining balance collected.' : 'Lab status updated.'}},
        ...(input.collectBalance ? {paidAmount:order.totalAmount,balanceDue:0,paymentStatus:'COMPLETED'} : {}),
      }, include:{items:true,store:{select:{id:true,name:true}},vendor:{select:{id:true,name:true,currency:true}}} });
    },{isolationLevel:'Serializable'});
  }
}
