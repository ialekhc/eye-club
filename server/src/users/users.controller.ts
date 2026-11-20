import type { AuthenticatedRequest } from '../auth.types.js';
import { ProfileDto } from '../commerce.dto.js';
import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AccessTokenGuard } from '../auth.guard.js';
import type { AuthenticatedUser } from '../auth.types.js';

@Controller('users')
@UseGuards(AccessTokenGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  async updateProfile(@Body() data: ProfileDto, @Request() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.usersService.updateProfile(user.id, data);
  }
}
