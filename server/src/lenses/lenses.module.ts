import { Module } from '@nestjs/common';
import { LensesController } from './lenses.controller';
import { LensesService } from './lenses.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [LensesController],
  providers: [LensesService, PrismaService],
})
export class LensesModule {}
