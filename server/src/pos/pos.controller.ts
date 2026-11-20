import type { AuthenticatedRequest } from '../auth.types.js';
import { SessionOpenDto, SessionCloseDto, PosCheckoutDto, LabUpdateDto } from './pos.dto.js';
import { AccessTokenGuard } from '../auth.guard.js';
import { VendorAccessGuard } from '../vendor-access.guard.js';
import { Request, UseGuards, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PosService } from './pos.service.js';
import { LabStatus } from '@prisma/client';

@Controller('pos')
@UseGuards(AccessTokenGuard, VendorAccessGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('registers')
  getRegisters(@Query('vendorId') vendorId?: string, @Query('storeId') storeId?: string) {
    return this.posService.getRegisters(vendorId, storeId);
  }

  @Post('sessions/open')
  openSession(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: SessionOpenDto,
  ) {
    return this.posService.openSession({ ...body, cashierId: req.user.id });
  }

  @Post('sessions/:id/close')
  closeSession(
    @Param('id') sessionId: string,
    @Body() body: SessionCloseDto,
  ) {
    return this.posService.closeSession(sessionId, body);
  }

  @Get('catalog')
  getCatalog(
    @Query('vendorId') vendorId?: string,
    @Query('storeId') storeId?: string,
    @Query('search') search?: string,
  ) {
    return this.posService.getPosCatalog({ vendorId, storeId, search });
  }

  @Post('checkout')
  createOrder(@Body() body: PosCheckoutDto, @Request() req: AuthenticatedRequest) {
    return this.posService.createPosOrder({ ...body, cashierId: req.user.id });
  }

  @Get('orders')
  listOrders(
    @Query('vendorId') vendorId?: string,
    @Query('storeId') storeId?: string,
    @Query('labStatus') labStatus?: LabStatus,
  ) {
    return this.posService.listPosOrders({ vendorId, storeId, labStatus });
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() body: LabUpdateDto,
  ) {
    return this.posService.updateLabAndPayment(orderId, body);
  }
}
