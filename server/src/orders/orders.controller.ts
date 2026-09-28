import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AccessTokenGuard } from '../auth.guard';
import type { AuthenticatedUser } from '../auth.types';

@Controller('api/v1/orders')
@UseGuards(AccessTokenGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getMyOrders(@Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.ordersService.getUserOrders(user.id);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.ordersService.getOrder(id, user.id);
  }

  @Post('checkout')
  async checkout(@Body() data: any, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.ordersService.createOrderFromCart(user.id, data);
  }
}
