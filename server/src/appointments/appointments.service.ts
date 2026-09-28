import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async bookAppointment(userId: string | null, data: any) {
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
