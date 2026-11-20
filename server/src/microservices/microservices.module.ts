import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { MicroservicesController } from './microservices.controller.js';

@Module({
  controllers: [MicroservicesController],
  providers: [PrismaService],
})
export class MicroservicesModule {}
