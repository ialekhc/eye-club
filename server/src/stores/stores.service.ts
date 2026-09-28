import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStores() {
    return this.prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async getStoreById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id, isActive: true }
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }
}
