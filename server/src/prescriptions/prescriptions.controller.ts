import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { AccessTokenGuard } from '../auth.guard';
import type { AuthenticatedUser } from '../auth.types';

@Controller('api/v1/prescriptions')
@UseGuards(AccessTokenGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  async getMyPrescriptions(@Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.prescriptionsService.getUserPrescriptions(user.id);
  }

  @Get(':id')
  async getPrescription(@Param('id') id: string, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.prescriptionsService.getPrescription(id, user.id);
  }

  @Post()
  async createPrescription(@Body() data: any, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.prescriptionsService.createPrescription(user.id, data);
  }
}
