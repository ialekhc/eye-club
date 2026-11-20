import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
@Injectable()
export class VendorAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) return true;
    const vendorRoute = req.originalUrl.includes('/vendors');
    let vendorId = vendorRoute ? req.params.id : req.body?.vendorId ?? req.query.vendorId;
    let storeId = req.body?.storeId ?? req.query.storeId;
    if (!vendorRoute && req.params.id) {
      const record = req.originalUrl.includes('/sessions/')
        ? await this.prisma.posSession.findUnique({ where: { id: req.params.id }, include: { register: true } })
        : await this.prisma.order.findUnique({ where: { id: req.params.id } });
      if (!record) throw new ForbiddenException('Record unavailable.');
      vendorId = record.vendorId;
      storeId = 'register' in record ? record.register.storeId : record.storeId;
    }
    if (!vendorId && vendorRoute && req.method === 'GET') return true;
    if (typeof vendorId !== 'string') throw new ForbiddenException('Choose an authorized vendor.');
    const member = await this.prisma.vendorMember.findUnique({ where: { vendorId_userId: { vendorId, userId: req.user.id } }, include: { vendor: true } });
    if (!member?.isActive || !['ACTIVE', 'TRIALING'].includes(member.vendor.status)) throw new ForbiddenException('Vendor membership required.');
    if (member.storeId && member.storeId !== storeId && !vendorRoute) throw new ForbiddenException('Choose your assigned store.');
    if (vendorRoute && req.method !== 'GET' && member.role !== 'VENDOR_OWNER') throw new ForbiddenException('Vendor owner role required.');
    if (!vendorRoute && !['VENDOR_OWNER', 'STORE_MANAGER', 'CASHIER', 'OPTOMETRIST', 'ORDER_MANAGER'].includes(member.role)) throw new ForbiddenException('Retail access required.');
    return true;
  }
}
