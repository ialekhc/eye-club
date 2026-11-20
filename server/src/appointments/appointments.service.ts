import type { AppointmentDto } from '../commerce.dto.js';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async bookAppointment(userId: string | null, data: AppointmentDto) {
    if (new Date(data.dateTime).getTime() <= Date.now()) throw new BadRequestException("Choose a future appointment time.");
    if (!await this.prisma.store.findFirst({ where: { id: data.storeId, isActive: true } })) throw new BadRequestException("Store unavailable.");
    return this.prisma.appointment.create({
      data: {
        userId,
        storeId: data.storeId,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail,
        dateTime: new Date(data.dateTime),
        notes: data.notes
      }
    });
  }

  async getUserAppointments(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      include: { store: true },
      orderBy: { dateTime: 'desc' }
    });
  }

  async cancelAppointment(id: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment || appointment.userId !== userId) {
      throw new NotFoundException('Appointment not found');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  }
}
