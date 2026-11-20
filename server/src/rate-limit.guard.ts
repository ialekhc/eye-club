import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { RateLimitService } from "./rate-limit.service.js";

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly windowMs = 15 * 60_000;
  private readonly limit = 10;
  constructor(private readonly rateLimit: RateLimitService = new RateLimitService()) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { body?: { email?: string } }>();
    
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "unknown";
    const key = `${request.ip || "unknown"}:${email}`;
    if (!await this.rateLimit.consume(key, this.limit, this.windowMs)) throw new HttpException("Too many login attempts. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
    return true;
  }
}

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  private readonly windowMs = 60_000;
  private readonly limit = 120;
  constructor(private readonly rateLimit: RateLimitService = new RateLimitService()) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    
    const key = request.ip || "unknown";
    if (!await this.rateLimit.consume(key, this.limit, this.windowMs)) throw new HttpException("Too many requests. Please try again shortly.", HttpStatus.TOO_MANY_REQUESTS);
    return true;
  }
}
