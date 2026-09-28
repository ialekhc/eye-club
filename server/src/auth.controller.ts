import { Body, Controller, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import * as argon2 from "argon2";
import { IsEmail, IsString, MinLength } from "class-validator";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "./prisma.service";
import { LoginRateLimitGuard } from "./rate-limit.guard";
import { AuditService } from "./audit.service";
import { UserRole } from "@prisma/client";

class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; }
class RefreshDto { @IsString() @MinLength(32) refreshToken!: string; }

class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() firstName!: string;
  @IsString() lastName!: string;
}

@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly audit: AuditService) {}

  @Post("register")
  @UseGuards(LoginRateLimitGuard)
  async register(@Body() input: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw new UnauthorizedException("Email is already in use.");

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.CUSTOMER
      }
    });

    const payload = { id: user.id, email: user.email, role: user.role };
    void this.audit.record("AUTH_REGISTER", { userId: user.id });
    return { ...await this.issueTokens(user.id, payload), user: { id: user.id, email: user.email, role: user.role } };
  }

  @Post("login")
  @UseGuards(LoginRateLimitGuard)
  async login(@Body() input: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !(await argon2.verify(user.passwordHash, input.password))) throw new UnauthorizedException("Invalid email or password.");
    
    if (!user.isActive) throw new UnauthorizedException("Account is inactive.");

    const payload = { id: user.id, email: user.email, role: user.role };
    void this.audit.record("AUTH_LOGIN", { userId: user.id });
    return { ...await this.issueTokens(user.id, payload), user: { id: user.id, email: user.email, role: user.role } };
  }

  @Post("refresh")
  async refresh(@Body() input: RefreshDto) {
    const tokenHash = createHash("sha256").update(input.refreshToken).digest("hex");
    const stored = await this.prisma.refreshToken.findUnique({ 
      where: { tokenHash }, 
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } } 
    });
    
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || !stored.user.isActive) {
      throw new UnauthorizedException("Refresh token is invalid or expired.");
    }
    
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(stored.user.id, { id: stored.user.id, email: stored.user.email, role: stored.user.role });
  }

  @Post("logout")
  async logout(@Body() input: RefreshDto) {
    const tokenHash = createHash("sha256").update(input.refreshToken).digest("hex");
    await this.prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  private async issueTokens(userId: string, payload: { id: string; email: string; role: UserRole }) {
    const refreshToken = randomBytes(48).toString("base64url");
    await this.prisma.refreshToken.create({ 
      data: { 
        userId, 
        tokenHash: createHash("sha256").update(refreshToken).digest("hex"), 
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      } 
    });
    return { accessToken: this.jwt.sign(payload), refreshToken, expiresIn: 900 };
  }
}
