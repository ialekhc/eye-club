import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, PrismaService],
})
export class AppointmentsModule {}
