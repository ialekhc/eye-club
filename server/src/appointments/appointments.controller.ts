import type { AuthenticatedRequest } from '../auth.types.js';
import { JwtService } from '@nestjs/jwt';
import { AppointmentDto } from '../commerce.dto.js';
import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { AccessTokenGuard } from '../auth.guard.js';
import type { AuthenticatedUser } from '../auth.types.js';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService, private readonly jwt: JwtService) {}

  // Public endpoint - users can book as guest
  @Post()
  async bookAppointment(@Body() data: AppointmentDto, @Request() req: AuthenticatedRequest) {
    const header = req.headers.authorization;
    let userId: string | null = null;
    if (header?.startsWith('Bearer ')) { try { userId = this.jwt.verify(header.slice(7)).id; } catch { /* Guest booking remains available. */ } }
    return this.appointmentsService.bookAppointment(userId, data);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async getMyAppointments(@Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.appointmentsService.getUserAppointments(user.id);
  }

  @Put(':id/cancel')
  @UseGuards(AccessTokenGuard)
  async cancelAppointment(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.appointmentsService.cancelAppointment(id, user.id);
  }
}
