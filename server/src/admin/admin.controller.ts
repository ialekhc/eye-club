import { CreateProductDto, InventoryDto } from './catalog.dto.js';
import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AccessTokenGuard } from '../auth.guard.js';
import { RolesGuard } from '../roles.guard.js';
import { Roles } from '../roles.decorator.js';
import { UserRole, OrderStatus, ProductStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('orders')
  async getOrders(@Query('status') status?: OrderStatus) {
    return this.adminService.getOrders(status);
  }

  @Put('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Get('products')
  async getProducts() {
    return this.adminService.getProducts();
  }

  @Post('products')
  createProduct(@Body() input: CreateProductDto) { return this.adminService.createProduct(input); }
  @Put('inventory/:id')
  updateInventory(@Param('id') id: string, @Body() input: InventoryDto) { return this.adminService.updateInventory(id, input); }

  @Put('products/:id/status')
  async updateProductStatus(@Param('id') id: string, @Body('status') status: ProductStatus) {
    return this.adminService.updateProductStatus(id, status);
  }
}
