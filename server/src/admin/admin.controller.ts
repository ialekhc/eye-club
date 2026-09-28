import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AccessTokenGuard } from '../auth.guard';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { UserRole, OrderStatus, ProductStatus } from '@prisma/client';

@Controller('api/v1/admin')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STORE_MANAGER)
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

  @Put('products/:id/status')
  async updateProductStatus(@Param('id') id: string, @Body('status') status: ProductStatus) {
    return this.adminService.updateProductStatus(id, status);
  }
}
