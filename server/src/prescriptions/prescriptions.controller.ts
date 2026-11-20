import type { AuthenticatedRequest } from '../auth.types.js';
import { PrescriptionDto } from '../commerce.dto.js';
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service.js';
import { AccessTokenGuard } from '../auth.guard.js';
import type { AuthenticatedUser } from '../auth.types.js';

@Controller('prescriptions')
@UseGuards(AccessTokenGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  async getMyPrescriptions(@Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.prescriptionsService.getUserPrescriptions(user.id);
  }

  @Get(':id')
  async getPrescription(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.prescriptionsService.getPrescription(id, user.id);
  }

  @Post()
  async createPrescription(@Body() data: PrescriptionDto, @Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.prescriptionsService.createPrescription(user.id, data);
  }
}
