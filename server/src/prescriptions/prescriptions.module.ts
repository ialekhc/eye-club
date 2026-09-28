import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrismaService, JwtService],
})
export class PrescriptionsModule {}
