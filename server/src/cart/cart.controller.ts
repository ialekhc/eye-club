import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { AccessTokenGuard } from '../auth.guard';
import type { AuthenticatedUser } from '../auth.types';

@Controller('api/v1/cart')
@UseGuards(AccessTokenGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.cartService.getCart(user.id);
  }

  @Post()
  async addToCart(@Body() data: any, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.cartService.addToCart(user.id, data);
  }

  @Put(':id')
  async updateQuantity(@Param('id') id: string, @Body('quantity') quantity: number, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.cartService.updateQuantity(id, user.id, quantity);
  }

  @Delete(':id')
  async removeFromCart(@Param('id') id: string, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.cartService.removeFromCart(id, user.id);
  }
}
