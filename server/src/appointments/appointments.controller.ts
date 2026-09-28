import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AccessTokenGuard } from '../auth.guard';
import type { AuthenticatedUser } from '../auth.types';

@Controller('api/v1/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Public endpoint - users can book as guest
  @Post()
  async bookAppointment(@Body() data: any, @Request() req: any) {
    // Attempt to parse auth header if present, else book as guest
    let userId: string | null = null;
    if (req.headers.authorization) {
      // Very basic mock check. In reality, you'd use a non-blocking guard or verify token manually
      userId = req.user?.id || null;
    }
    return this.appointmentsService.bookAppointment(userId, data);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async getMyAppointments(@Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.appointmentsService.getUserAppointments(user.id);
  }

  @Put(':id/cancel')
  @UseGuards(AccessTokenGuard)
  async cancelAppointment(@Param('id') id: string, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.appointmentsService.cancelAppointment(id, user.id);
  }
}
