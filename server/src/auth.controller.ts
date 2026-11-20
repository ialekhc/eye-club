import { Body, Controller, Param, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import * as argon2 from "argon2";
import { IsEmail, IsString, MinLength, IsNotEmpty, MaxLength } from "class-validator";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "./prisma.service.js";
import { LoginRateLimitGuard } from "./rate-limit.guard.js";
import { AuditService } from "./audit.service.js";
import { UserRole } from "@prisma/client";

class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; }
class EmailDto { @IsEmail() email!: string; }
class TokenDto { @IsString() @MinLength(32) token!: string; }
class InvitationDto { @IsEmail() email!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; }
class ResetDto extends TokenDto { @IsString() @MinLength(12) @MaxLength(128) password!: string; }

class RefreshDto { @IsString() @MinLength(32) refreshToken!: string; }

class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(12) @MaxLength(128) password!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) firstName!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) lastName!: string;
}

@Controller("auth")
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
    return { ...await this.issueTokens(user.id, payload), user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } };
  }

  @Post("login")
  @UseGuards(LoginRateLimitGuard)
  async login(@Body() input: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !(await argon2.verify(user.passwordHash, input.password))) throw new UnauthorizedException("Invalid email or password.");
    
    if (!user.isActive) throw new UnauthorizedException("Account is inactive.");

    const payload = { id: user.id, email: user.email, role: user.role };
    void this.audit.record("AUTH_LOGIN", { userId: user.id });
    return { ...await this.issueTokens(user.id, payload), user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } };
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
    
    const consumed = await this.prisma.refreshToken.updateMany({ where: { id: stored.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!consumed.count) throw new UnauthorizedException("Refresh token already used.");
    return this.issueTokens(stored.user.id, { id: stored.user.id, email: stored.user.email, role: stored.user.role });
  }

  @Post("logout")
  async logout(@Body() input: RefreshDto) {
    const tokenHash = createHash("sha256").update(input.refreshToken).digest("hex");
    await this.prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  @Post('invitations/:token/accept')
  @UseGuards(LoginRateLimitGuard)
  async acceptInvitation(@Param('token') token: string, @Body() input: InvitationDto) {
    const stored = await this.prisma.accountToken.findUnique({where:{tokenHash:createHash('sha256').update(token).digest('hex')}});
    if(!stored || stored.usedAt || stored.expiresAt <= new Date() || !stored.purpose.startsWith('INVITE_')) throw new UnauthorizedException('Invitation invalid or expired.');
    const user = await this.prisma.user.findUnique({where:{id:stored.userId}});
    if(!user || user.email !== input.email.trim().toLowerCase()) throw new UnauthorizedException('Use the invited email.');
    const [purpose,memberId]=stored.purpose.split(':');
    if(purpose === 'INVITE_EXISTING' && !await argon2.verify(user.passwordHash,input.password)) throw new UnauthorizedException('Enter your existing account password.');
    await this.consumeAccountToken(token,stored.purpose,async(tx,userId)=>{
      if(purpose === 'INVITE_NEW') await tx.user.update({where:{id:userId},data:{passwordHash:await argon2.hash(input.password,{type:argon2.argon2id})}});
      await tx.vendorMember.update({where:{id:memberId},data:{isActive:true}});
    });
    return {accepted:true};
  }

  @Post('password-reset/request')
  @UseGuards(LoginRateLimitGuard)
  async requestReset(@Body() input: EmailDto) { return this.createAccountToken(input.email, 'RESET'); }
  @Post('email-verification/request')
  @UseGuards(LoginRateLimitGuard)
  async requestVerification(@Body() input: EmailDto) { return this.createAccountToken(input.email, 'VERIFY'); }
  private async createAccountToken(email: string, purpose: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return { accepted: true };
    const token = randomBytes(48).toString('base64url');
    await this.prisma.accountToken.create({ data: { userId: user.id, purpose, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 30 * 60_000) } });
    // Use an authenticated transactional email service in production. Never return production tokens.
    if (process.env.NODE_ENV !== 'production') return { accepted: true, token };
    if (!process.env.ACCOUNT_EMAIL_WEBHOOK) throw new UnauthorizedException('Account email delivery is not configured.');
    const delivered = await fetch(process.env.ACCOUNT_EMAIL_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ACCOUNT_EMAIL_WEBHOOK_SECRET ?? ''}` }, body: JSON.stringify({ email: user.email, purpose, token }), signal: AbortSignal.timeout(10000) });
    if (!delivered.ok) throw new UnauthorizedException('Unable to deliver account instructions.');
    return { accepted: true };
  }
  @Post('password-reset/confirm')
  async resetPassword(@Body() input: ResetDto) {
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    await this.consumeAccountToken(input.token, 'RESET', async (tx, userId) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    });
    return { reset: true };
  }
  @Post('email-verification/confirm')
  async verifyEmail(@Body() input: TokenDto) {
    await this.consumeAccountToken(input.token, 'VERIFY', async (tx, userId) => { await tx.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } }); });
    return { verified: true };
  }
  private async consumeAccountToken(token: string, purpose: string, action: (tx: import('@prisma/client').Prisma.TransactionClient, userId: string) => Promise<void>) {
    await this.prisma.$transaction(async tx => {
      const stored = await tx.accountToken.findUnique({ where: { tokenHash: createHash('sha256').update(token).digest('hex') } });
      if (!stored || stored.purpose !== purpose || stored.usedAt || stored.expiresAt <= new Date()) throw new UnauthorizedException('Token invalid or expired.');
      const consumed = await tx.accountToken.updateMany({ where: { id: stored.id, usedAt: null }, data: { usedAt: new Date() } });
      if (!consumed.count) throw new UnauthorizedException('Token already used.');
      await action(tx, stored.userId);
    });
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
    return { accessToken: this.jwt.sign(payload), refreshToken, expiresIn: (() => { const ttl = process.env.JWT_ACCESS_TTL ?? "15m"; const match = /^(\d+)(s|m|h|d)?$/.exec(ttl); return match ? Number(match[1]) * ({ s: 1, m: 60, h: 3600, d: 86400 }[match[2] ?? "s"] ?? 1) : 900; })() };
  }
}
