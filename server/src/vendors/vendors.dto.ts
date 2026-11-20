import { IsEmail, IsEnum, IsHexColor, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { SaaSTier, UserRole, VendorStatus } from '@prisma/client';
export class CreateVendorDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsHexColor() brandColor?: string;
  @IsOptional() @IsEnum(SaaSTier) plan?: SaaSTier;
  @IsOptional() @IsNumber() @Min(0) @Max(100) commissionRate?: number;
  @IsOptional() @IsString() primaryStoreName?: string;
}
export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @IsOptional() @IsEnum(VendorStatus) status?: VendorStatus;
  @IsOptional() @IsInt() @Min(1) maxStores?: number;
  @IsOptional() @IsInt() @Min(1) maxPosRegisters?: number;
}
export class BranchDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() address!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() openingHours?: string;
  @IsOptional() @IsString() registerName?: string;
}
export class RegisterDto {
  @IsString() @IsNotEmpty() storeId!: string;
  @IsString() @IsNotEmpty() name!: string;
}
export class MemberDto {
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsEnum(UserRole) role!: UserRole;
  @IsOptional() @IsString() storeId?: string;
}
