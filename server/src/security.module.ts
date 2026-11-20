import { VendorAccessGuard } from './vendor-access.guard.js';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service.js';
import { AccessTokenGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';
@Global()
@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET ?? 'development-only-change-me', signOptions: { expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as NonNullable<import("@nestjs/jwt").JwtModuleOptions["signOptions"]>["expiresIn"] } })],
  providers: [PrismaService, AccessTokenGuard, RolesGuard, VendorAccessGuard],
  exports: [JwtModule, PrismaService, AccessTokenGuard, RolesGuard, VendorAccessGuard],
})
export class SecurityModule {}
