import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
export class CreateProductDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @IsString() @IsNotEmpty() sku!: string;
  @IsNumber() @Min(0) basePrice!: number;
  @IsString() @IsNotEmpty() color!: string;
  @IsString() @IsNotEmpty() size!: string;
  @IsString() @IsNotEmpty() storeId!: string;
  @IsInt() @Min(0) @Max(1000000) stock!: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() brandId?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() frameShape?: string;
  @IsOptional() @IsBoolean() prescriptionCompatible?: boolean;
  @IsOptional() @IsString() @Matches(/^(https:\/\/.+|\/(frames|api)\/.+)$/) imageUrl?: string;
}
export class InventoryDto {
  @IsString() @IsNotEmpty() storeId!: string;
  @IsInt() @Min(0) @Max(1000000) quantity!: number;
}
export class UploadProductImageDto {
  @IsString() @IsNotEmpty() @MaxLength(14000000) base64!: string;
  @IsIn(['image/jpeg', 'image/png', 'image/webp']) mimeType!: string;
  @IsOptional() @IsString() variantId?: string;
  @IsOptional() @IsString() @MaxLength(200) altText?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}
