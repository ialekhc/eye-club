import type { AuthenticatedRequest } from './auth.types.js';
import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { AccessTokenGuard } from './auth.guard.js';
import { PrismaService } from './prisma.service.js';
class WishlistDto { @IsString() @IsNotEmpty() productId!: string; }
@Controller('wishlist')
@UseGuards(AccessTokenGuard)
export class WishlistController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() async list(@Request() req: AuthenticatedRequest) { return (await this.prisma.wishlist.findUnique({ where: { userId: req.user.id }, include: { items: { include: { product: { include: { variants: { where: { isActive: true }, include: { images: true } } } } } } } }))?.items ?? []; }
  @Post() async add(@Request() req: AuthenticatedRequest, @Body() body: WishlistDto) {
    if (!await this.prisma.product.findFirst({ where: { id: body.productId, status: 'PUBLISHED' } })) throw new BadRequestException('Product unavailable.');
    const wishlist = await this.prisma.wishlist.upsert({ where: { userId: req.user.id }, update: {}, create: { userId: req.user.id } });
    const existing = await this.prisma.wishlistItem.findFirst({ where: { wishlistId: wishlist.id, productId: body.productId } });
    return existing ?? this.prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId: body.productId } });
  }
  @Delete(':id') async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) { await this.prisma.wishlistItem.deleteMany({ where: { id, wishlist: { userId: req.user.id } } }); return { success: true }; }
}
