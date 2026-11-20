import { Module } from '@nestjs/common';
import { LensesController } from './lenses.controller.js';
import { LensesService } from './lenses.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [LensesController],
  providers: [LensesService, PrismaService],
})
export class LensesModule {}
