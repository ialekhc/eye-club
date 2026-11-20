import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller.js';
import { PrescriptionsService } from './prescriptions.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrismaService],
})
export class PrescriptionsModule {}
