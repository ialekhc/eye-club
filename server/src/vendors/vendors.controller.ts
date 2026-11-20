import type { AuthenticatedRequest } from '../auth.types.js';
import { CreateVendorDto, UpdateVendorDto, BranchDto, RegisterDto, MemberDto } from './vendors.dto.js';
import { VendorAccessGuard } from '../vendor-access.guard.js';
import { AccessTokenGuard } from '../auth.guard.js';
import { RolesGuard } from '../roles.guard.js';
import { Roles } from '../roles.decorator.js';
import { Request, UseGuards, Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { VendorsService } from './vendors.service.js';
import { UserRole } from '@prisma/client';

@Controller('vendors')
@UseGuards(AccessTokenGuard, VendorAccessGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  listVendors(@Request() req: AuthenticatedRequest) {
    return this.vendorsService.listVendors(["SUPER_ADMIN", "ADMIN"].includes(req.user.role) ? undefined : req.user.id);
  }

  @Get(':id')
  getVendor(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  createVendor(@Body() body: CreateVendorDto) {
    return this.vendorsService.createVendor(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  updateVendor(@Param('id') id: string, @Body() body: UpdateVendorDto) {
    return this.vendorsService.updateVendor(id, body);
  }

  @Post(':id/stores')
  createStore(
    @Param('id') vendorId: string,
    @Body() body: BranchDto,
  ) {
    return this.vendorsService.createVendorStore(vendorId, body);
  }

  @Post(':id/registers')
  createRegister(
    @Param('id') vendorId: string,
    @Body() body: RegisterDto,
  ) {
    return this.vendorsService.createPosRegister(vendorId, body);
  }

  @Post(':id/members')
  addMember(
    @Param('id') vendorId: string,
    @Body() body: MemberDto,
  ) {
    return this.vendorsService.addVendorMember(vendorId, body);
  }
}
