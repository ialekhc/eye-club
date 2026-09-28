import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPrescriptions(userId: string) {
    return this.prisma.prescription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPrescription(id: string, userId: string) {
    const p = await this.prisma.prescription.findUnique({ where: { id } });
    if (!p || p.userId !== userId) throw new NotFoundException('Prescription not found');
    return p;
  }

  async createPrescription(userId: string, data: any) {
    return this.prisma.prescription.create({
      data: {
        userId,
        label: data.label,
        odSph: data.odSph,
        odCyl: data.odCyl,
        odAxis: data.odAxis,
        odAdd: data.odAdd,
        osSph: data.osSph,
        osCyl: data.osCyl,
        osAxis: data.osAxis,
        osAdd: data.osAdd,
        pdRight: data.pdRight,
        pdLeft: data.pdLeft,
        documentUrl: data.documentUrl,
        doctorName: data.doctorName,
        notes: data.notes,
      }
    });
  }
}
