import { Body, Controller, Delete, Get, Inject, Param, Post, Res, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { IsBase64, IsIn, IsObject, MaxLength } from 'class-validator';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import type { Response } from 'express';
import { PrismaService } from './prisma.service.js';
import { OBJECT_STORAGE, type ObjectStorage, type StoredObject } from './object-storage.service.js';
import { AccessTokenGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { Roles } from './roles.decorator.js';
import { UploadProductImageDto } from './admin/catalog.dto.js';
class FrameDto {
  @IsBase64() @MaxLength(14000000) base64!: string;
  @IsIn(['image/png','image/webp']) mimeType!: string;
  @IsObject() calibration!: Record<string, number>;
}
const calibrationKeys = ['leftAnchorX','leftAnchorY','rightAnchorX','rightAnchorY','bridgeX','bridgeY','scaleMultiplier','offsetX','offsetY','rotationOffset'];
@Controller()
export class FramesController {
  constructor(private readonly prisma: PrismaService, @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage) {}
  @Post('admin/products/:id/images')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('SUPER_ADMIN','ADMIN')
  async uploadProductImage(@Param('id') productId: string, @Body() data: UploadProductImageDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { variants: { orderBy: { id: 'asc' } } },
    });
    if (!product) throw new NotFoundException('Product not found.');
    const variant = data.variantId
      ? product.variants.find((v) => v.id === data.variantId)
      : product.variants[0];
    if (!variant) throw new BadRequestException('Product has no variant to attach an image to.');

    const cleanBase64 = data.base64.includes(',') ? data.base64.split(',')[1]! : data.base64;
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('Image must be non-empty and 10 MiB or smaller.');
    }

    let normalized: Buffer;
    try {
      normalized = await sharp(buffer, { limitInputPixels: 16_000_000 })
        .rotate()
        .resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .png()
        .toBuffer();
    } catch {
      throw new BadRequestException('Invalid image file. Upload a valid JPG, PNG, or WebP.');
    }

    const asset = await this.storage.putFrame(product.vendorId ?? 'platform', {
      buffer: normalized,
      size: normalized.length,
      mimetype: 'image/png',
    });

    const encodedKey = Buffer.from(asset.storageKey, 'utf8').toString('base64url');
    const url = `/api/backend/catalog/images/${encodedKey}`;

    if (data.isPrimary) {
      await this.prisma.productImage.updateMany({
        where: { productVariantId: variant.id },
        data: { isPrimary: false },
      });
    }

    const existingCount = await this.prisma.productImage.count({
      where: { productVariantId: variant.id },
    });

    const image = await this.prisma.productImage.create({
      data: {
        productVariantId: variant.id,
        url,
        altText: data.altText?.trim() || `${product.name} - ${variant.color}`,
        isPrimary: data.isPrimary ?? existingCount === 0,
        displayOrder: existingCount + 1,
      },
    });

    return { saved: true, image, asset };
  }

  @Delete('admin/products/:id/images/:imageId')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('SUPER_ADMIN','ADMIN')
  async deleteProductImage(@Param('id') productId: string, @Param('imageId') imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, variant: { productId } },
    });
    if (!image) throw new NotFoundException('Product image not found.');
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { deleted: true, id: imageId };
  }

  @Get('catalog/images/:encodedKey')
  async getProductImage(@Param('encodedKey') encodedKey: string, @Res() response: Response) {
    let storageKey: string;
    try {
      storageKey = Buffer.from(encodedKey, 'base64url').toString('utf8');
    } catch {
      throw new BadRequestException('Invalid image key.');
    }
    if (!storageKey || storageKey.includes('..') || storageKey.startsWith('/')) {
      throw new BadRequestException('Invalid image key.');
    }
    const result = await this.storage.getFrame(storageKey);
    response.setHeader('Content-Type', result.mimeType);
    response.setHeader('Cache-Control', 'public, max-age=86400');
    response.send(result.body);
  }

  @Post('admin/products/:id/frame')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('SUPER_ADMIN','ADMIN')
  async save(@Param('id') id: string, @Body() data: FrameDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found.');
    const c = data.calibration;
    if (Object.keys(c).length !== calibrationKeys.length || calibrationKeys.some(key => !Number.isFinite(c[key]))) throw new BadRequestException('Invalid calibration fields.');
    if (calibrationKeys.slice(0,6).some(key => c[key]! < 0 || c[key]! > 1) || Math.hypot(c.rightAnchorX! - c.leftAnchorX!, c.rightAnchorY! - c.leftAnchorY!) < .02 || c.scaleMultiplier! < .1 || c.scaleMultiplier! > 5 || Math.abs(c.offsetX!) > 2 || Math.abs(c.offsetY!) > 2 || Math.abs(c.rotationOffset!) > Math.PI) throw new BadRequestException('Invalid calibration anchors or offsets.');
    const buffer = Buffer.from(data.base64, 'base64');
    if (buffer.length > 10 * 1024 * 1024) throw new BadRequestException('Frame exceeds 10 MiB.');
    let image;
    try { image = await sharp(buffer, { limitInputPixels: 8000000 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); }
    catch { throw new BadRequestException('Invalid frame image.'); }
    let transparent = 0, visible = 0;
    for (let i=3; i<image.data.length; i+=4) { if(image.data[i]! < 16) transparent++; if(image.data[i]! > 32) visible++; }
    if (transparent < image.info.width * image.info.height * .01 || visible < 64) throw new BadRequestException('Use a visible frame on a transparent background.');
    const normalized = await sharp(buffer).png().toBuffer();
    const asset = await this.storage.putFrame(product.vendorId ?? 'platform', { buffer: normalized, size: normalized.length, mimetype: "image/png" });
    await this.prisma.product.update({ where: { id }, data: { frameAsset: asset as unknown as Prisma.InputJsonValue, frameCalibration: c } });
    return { saved: true, asset };
  }
  @Get('catalog/frames/:id')
  async asset(@Param('id') id: string, @Res() response: Response) {
    const product = await this.prisma.product.findFirst({ where: { id, status: 'PUBLISHED' } });
    if (!product?.frameAsset) throw new NotFoundException('Frame unavailable.');
    const asset = product.frameAsset as unknown as StoredObject;
    const result = await this.storage.getFrame(asset.storageKey);
    response.setHeader('Content-Type',result.mimeType); response.setHeader('Cache-Control','public, max-age=3600'); response.send(result.body);
  }
  @Get('public/catalogue/:slug')
  async catalogue(@Param('slug') slug: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { slug } });
    if (!vendor || !['ACTIVE','TRIALING'].includes(vendor.status)) throw new NotFoundException('Collection unavailable.');
    const products = await this.prisma.product.findMany({ where: { vendorId: vendor.id, status:'PUBLISHED', frameAsset: { not: Prisma.DbNull }, frameCalibration: { not: Prisma.DbNull } }, include: { brand:true, category:true } });
    return products.map(product => { const asset = product.frameAsset as unknown as StoredObject; return { id:product.id,name:product.name,sku:product.skuBase,type:product.category?.slug === 'sunglasses' ? 'SUNGLASSES':'EYEGLASSES',frameShape:product.frameShape,frameColor:null,price:product.basePrice,currency:vendor.currency,productUrl:null,brand:product.brand,category:product.category,calibration:product.frameCalibration,asset:{...asset,url:`/api/v1/catalog/frames/${product.id}`} }; });
  }
}
