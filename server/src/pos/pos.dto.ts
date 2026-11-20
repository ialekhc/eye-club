import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { LabStatus, PaymentMethod } from '@prisma/client';
export class SessionOpenDto {
  @IsString() @IsNotEmpty() registerId!: string;
  @IsString() @IsNotEmpty() vendorId!: string;
  @IsOptional() @IsString() storeId?: string;
  @IsNumber() @Min(0) openingCash!: number;
  @IsOptional() @IsString() notes?: string;
}
export class SessionCloseDto {
  @IsNumber() @Min(0) closingCash!: number;
  @IsOptional() @IsString() notes?: string;
}
class PosItemDto {
  @IsString() @IsNotEmpty() productVariantId!: string;
  @IsInt() @Min(1) @Max(100) quantity!: number;
  @IsString() productName!: string;
  @IsString() sku!: string;
  @IsNumber() @Min(0) unitPrice!: number;
  @IsOptional() @IsString() lensPackageId?: string;
  @IsOptional() @IsString() lensPackageName?: string;
  @IsOptional() @IsNumber() @Min(0) lensPrice?: number;
  @IsOptional() @IsObject() prescriptionData?: import('./pos.service.js').PosPrescriptionInput;
}
class PaymentBreakdownDto {
  @IsOptional() @IsNumber() @Min(0) cash?: number;
  @IsOptional() @IsNumber() @Min(0) card?: number;
  @IsOptional() @IsNumber() @Min(0) digital?: number;
  @IsOptional() @IsNumber() @Min(0) insurance?: number;
  @IsOptional() @IsNumber() @Min(0) changeGiven?: number;
}
export class PosCheckoutDto {
  @IsString() @IsNotEmpty() vendorId!: string;
  @IsString() @IsNotEmpty() storeId!: string;
  @IsString() @IsNotEmpty() posRegisterId!: string;
  @IsString() @IsNotEmpty() posSessionId!: string;
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => PosItemDto) items!: PosItemDto[];
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsNumber() @Min(0) taxAmount?: number;
  @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod;
  @IsNumber() @Min(0) paidAmount!: number;
  @IsOptional() @ValidateNested() @Type(() => PaymentBreakdownDto) paymentBreakdown?: PaymentBreakdownDto;
  @IsOptional() @IsString() notes?: string;
}
export class LabUpdateDto {
  @IsOptional() @IsString() collectionSessionId?: string;
  @IsOptional() @IsEnum(LabStatus) labStatus?: LabStatus;
  @IsOptional() @IsBoolean() collectBalance?: boolean;
  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
}
