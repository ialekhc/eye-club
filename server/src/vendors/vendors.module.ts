import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller.js';
import { VendorsService } from './vendors.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [VendorsController],
  providers: [VendorsService, PrismaService],
  exports: [VendorsService],
})
export class VendorsModule {}

