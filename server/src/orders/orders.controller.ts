import type { AuthenticatedRequest } from '../auth.types.js';
import { CheckoutDto } from '../commerce.dto.js';
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { AccessTokenGuard } from '../auth.guard.js';
import type { AuthenticatedUser } from '../auth.types.js';

@Controller('orders')
@UseGuards(AccessTokenGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getMyOrders(@Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.ordersService.getUserOrders(user.id);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.ordersService.getOrder(id, user.id);
  }

  @Post('checkout')
  async checkout(@Body() data: CheckoutDto, @Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.ordersService.createOrderFromCart(user.id, data);
  }
}
