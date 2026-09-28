import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import type { AuthenticatedUser } from "./auth.types";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException("A bearer access token is required.");
    try {
      request.user = this.jwt.verify<AuthenticatedUser>(header.slice(7));
      return !!request.user?.id;
    } catch { throw new UnauthorizedException("The access token is invalid or expired."); }
  }
}
