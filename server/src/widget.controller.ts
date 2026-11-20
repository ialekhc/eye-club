import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';
import { randomBytes } from 'node:crypto';
import { PrismaService } from './prisma.service.js';
import { AccessTokenGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { Roles } from './roles.decorator.js';
import { PublicRateLimitGuard } from './rate-limit.guard.js';
class ConfigurationDto {
  @IsString() vendorId!: string;
  @IsArray() @ArrayMaxSize(30) @IsUrl({ require_tld: false, protocols: ['http','https'], require_protocol: true },{ each:true }) allowedOrigins!: string[];
}
class UpdateDto { @IsBoolean() enabled!: boolean; }
class SessionDto { @IsString() organizationSlug!: string; }
class EventDto {
  @IsIn(['TRYON_STARTED','TRYON_COMPLETED','FRAME_SELECTED','FRAME_FAVORITED','PRODUCT_CLICKED','RESULT_SHARED']) eventType!: string;
  @IsOptional() @IsString() eyewearId?: string;
}
@Controller()
export class WidgetController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('admin/widgets') @UseGuards(AccessTokenGuard,RolesGuard) @Roles('SUPER_ADMIN','ADMIN')
  list() { return this.prisma.widgetConfiguration.findMany({ orderBy: { createdAt:'desc' } }); }
  @Post('admin/widgets') @UseGuards(AccessTokenGuard,RolesGuard) @Roles('SUPER_ADMIN','ADMIN')
  async create(@Body() data: ConfigurationDto) {
    if (!await this.prisma.vendor.findUnique({where:{id:data.vendorId}})) throw new BadRequestException('Vendor not found.');
    if (data.allowedOrigins.some(value => new URL(value).origin !== value)) throw new BadRequestException('Use origins without paths or trailing slashes.');
    return this.prisma.widgetConfiguration.create({data:{vendorId:data.vendorId,allowedOrigins:data.allowedOrigins,publicKey:randomBytes(24).toString('hex')}});
  }
  @Patch('admin/widgets/:id') @UseGuards(AccessTokenGuard,RolesGuard) @Roles('SUPER_ADMIN','ADMIN')
  update(@Param('id') id:string,@Body() data:UpdateDto) {return this.prisma.widgetConfiguration.update({where:{id},data});}
  @Get('widget/config/:publicKey') @UseGuards(PublicRateLimitGuard)
  async config(@Param('publicKey') publicKey:string,@Query('origin') origin?:string) {
    const config=await this.prisma.widgetConfiguration.findUnique({where:{publicKey}});
    if(!config?.enabled || !origin || !config.allowedOrigins.includes(origin)) throw new NotFoundException('Widget unavailable for this origin.');
    const vendor=await this.prisma.vendor.findUnique({where:{id:config.vendorId}});
    if(!vendor || !['ACTIVE','TRIALING'].includes(vendor.status)) throw new NotFoundException('Widget unavailable.');
    return {publicKey,organizationSlug:vendor.slug,enabled:true,allowedOrigins:config.allowedOrigins};
  }
  @Post('tryons/sessions') @UseGuards(PublicRateLimitGuard)
  async session(@Body() data:SessionDto) {
    const vendor=await this.prisma.vendor.findUnique({where:{slug:data.organizationSlug}});
    if(!vendor || !['ACTIVE','TRIALING'].includes(vendor.status)) throw new NotFoundException('Collection unavailable.');
    const session=await this.prisma.tryOnSession.create({data:{vendorId:vendor.id,expiresAt:new Date(Date.now()+60*60*1000)}});
    return {publicId:session.publicId,expiresAt:session.expiresAt};
  }
  @Post('tryons/sessions/:id/events') @UseGuards(PublicRateLimitGuard)
  async event(@Param('id') id:string,@Body() data:EventDto) {
    const session=await this.prisma.tryOnSession.findUnique({where:{publicId:id}});
    if(!session || session.expiresAt <= new Date()) throw new NotFoundException('Session expired.');
    if(data.eyewearId && !await this.prisma.product.findFirst({where:{id:data.eyewearId,vendorId:session.vendorId}})) return {accepted:false};
    await this.prisma.usageEvent.create({data:{sessionId:id,vendorId:session.vendorId,eventType:data.eventType,eyewearId:data.eyewearId}});
    return {accepted:true};
  }
  @Get('admin/analytics') @UseGuards(AccessTokenGuard,RolesGuard) @Roles('SUPER_ADMIN','ADMIN')
  async analytics() {
    const since=new Date(Date.now()-30*86400000);
    const [events,sessions,byType]=await Promise.all([this.prisma.usageEvent.count({where:{createdAt:{gte:since}}}),this.prisma.tryOnSession.count({where:{createdAt:{gte:since}}}),this.prisma.usageEvent.groupBy({by:['eventType'],where:{createdAt:{gte:since}},_count:true})]);
    return {windowDays:30,events,sessions,byType};
  }
}
