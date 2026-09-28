import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from '../auth.guard';
import type { AuthenticatedUser } from '../auth.types';

@Controller('api/v1/users')
@UseGuards(AccessTokenGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  async updateProfile(@Body() data: any, @Request() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.usersService.updateProfile(user.id, data);
  }
}
