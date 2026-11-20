import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { PrismaService } from "./prisma.service.js";
import type { AuthenticatedUser } from "./auth.types.js";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException("A bearer access token is required.");
    try {
      request.user = this.jwt.verify<AuthenticatedUser>(header.slice(7));
      const user = request.user?.id ? await this.prisma.user.findUnique({ where: { id: request.user.id } }) : null;
      if (!user?.isActive) throw new UnauthorizedException();
      request.user = { id: user.id, email: user.email, role: user.role };
      return true;
    } catch { throw new UnauthorizedException("The access token is invalid or expired."); }
  }
}
