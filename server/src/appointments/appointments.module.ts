import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, PrismaService, JwtService],
})
export class AppointmentsModule {}
