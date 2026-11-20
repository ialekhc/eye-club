import { Type } from 'class-transformer';
import { IsDefined, IsEmail, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested, IsISO8601 } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
export class CartItemDto {
  @IsString() @IsNotEmpty() productId!: string;
  @IsString() @IsNotEmpty() productVariantId!: string;
  @IsOptional() @IsString() lensPackageId?: string;
  @IsOptional() @IsString() prescriptionId?: string;
  @IsInt() @Min(1) @Max(20) quantity = 1;
}
export class QuantityDto { @IsInt() @Min(1) @Max(20) quantity!: number; }
export class AddressDto {
  @IsString() @IsNotEmpty() @MaxLength(120) fullName!: string;
  @IsString() @IsNotEmpty() @MaxLength(30) phone!: string;
  @IsString() @IsNotEmpty() province!: string;
  @IsString() @IsNotEmpty() district!: string;
  @IsString() @IsNotEmpty() municipality!: string;
  @IsOptional() @IsString() ward?: string;
  @IsString() @IsNotEmpty() @MaxLength(250) street!: string;
  @IsOptional() @IsString() landmark?: string;
}
export class CheckoutDto {
  @IsDefined() @ValidateNested() @Type(() => AddressDto) address!: AddressDto;
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod = PaymentMethod.CASH_ON_DELIVERY;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
export class ProfileDto {
  @IsString() @IsNotEmpty() @MaxLength(80) firstName!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) lastName!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
}
export class PrescriptionDto {
  @IsString() @IsNotEmpty() @MaxLength(100) label!: string;
  @IsOptional() @IsNumber() @Min(-30) @Max(30) odSph?: number;
  @IsOptional() @IsNumber() @Min(-30) @Max(30) osSph?: number;
  @IsOptional() @IsNumber() @Min(-15) @Max(15) odCyl?: number;
  @IsOptional() @IsNumber() @Min(-15) @Max(15) osCyl?: number;
  @IsOptional() @IsInt() @Min(0) @Max(180) odAxis?: number;
  @IsOptional() @IsInt() @Min(0) @Max(180) osAxis?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10) odAdd?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10) osAdd?: number;
  @IsOptional() @IsNumber() @Min(10) @Max(50) pdRight?: number;
  @IsOptional() @IsNumber() @Min(10) @Max(50) pdLeft?: number;
  @IsOptional() @IsString() @MaxLength(100) doctorName?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
export class AppointmentDto {
  @IsString() @IsNotEmpty() storeId!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) patientName!: string;
  @IsString() @IsNotEmpty() @MaxLength(30) patientPhone!: string;
  @IsOptional() @IsEmail() patientEmail?: string;
  @IsISO8601() dateTime!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
