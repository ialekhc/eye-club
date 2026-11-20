import type { AuthenticatedRequest } from '../auth.types.js';
import { CartItemDto, QuantityDto } from '../commerce.dto.js';
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { AccessTokenGuard } from '../auth.guard.js';
import type { AuthenticatedUser } from '../auth.types.js';

@Controller('cart')
@UseGuards(AccessTokenGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.cartService.getCart(user.id);
  }

  @Post()
  async addToCart(@Body() data: CartItemDto, @Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.cartService.addToCart(user.id, data);
  }

  @Put(':id')
  async updateQuantity(@Param('id') id: string, @Body() data: QuantityDto, @Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.cartService.updateQuantity(id, user.id, data.quantity);
  }

  @Delete(':id')
  async removeFromCart(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.cartService.removeFromCart(id, user.id);
  }
}
