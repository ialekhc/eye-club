import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class LensesService {
  constructor(private readonly prisma: PrismaService) {}

  async getLensTypes() {
    return this.prisma.lensType.findMany({
      where: { isActive: true },
      include: {
        packages: {
          where: { isActive: true },
          orderBy: { price: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getLensTypeById(id: string) {
    const lensType = await this.prisma.lensType.findUnique({
      where: { id, isActive: true },
      include: {
        packages: {
          where: { isActive: true },
          orderBy: { price: 'asc' }
        }
      }
    });

    if (!lensType) throw new NotFoundException('Lens type not found');
    return lensType;
  }
}
