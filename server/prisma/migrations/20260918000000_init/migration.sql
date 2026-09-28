-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ORGANIZATION_OWNER', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."EyewearType" AS ENUM ('EYEGLASSES', 'SUNGLASSES');

-- CreateEnum
CREATE TYPE "public"."UsageEventType" AS ENUM ('TRYON_STARTED', 'TRYON_COMPLETED', 'FRAME_SELECTED', 'FRAME_FAVORITED', 'PRODUCT_CLICKED', 'RESULT_SHARED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Brand" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Eyewear" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "brandId" TEXT,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."EyewearType" NOT NULL,
    "gender" TEXT,
    "frameShape" TEXT,
    "frameColor" TEXT,
    "lensColor" TEXT,
    "frameWidth" DECIMAL(65,30),
    "lensWidth" DECIMAL(65,30),
    "lensHeight" DECIMAL(65,30),
    "bridgeWidth" DECIMAL(65,30),
    "templeLength" DECIMAL(65,30),
    "price" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "productUrl" TEXT,
    "futureModelUrl" TEXT,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Eyewear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EyewearAsset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eyewearId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "hasAlpha" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EyewearAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FrameCalibration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eyewearId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "leftAnchorX" DECIMAL(8,6) NOT NULL,
    "leftAnchorY" DECIMAL(8,6) NOT NULL,
    "rightAnchorX" DECIMAL(8,6) NOT NULL,
    "rightAnchorY" DECIMAL(8,6) NOT NULL,
    "bridgeX" DECIMAL(8,6) NOT NULL,
    "bridgeY" DECIMAL(8,6) NOT NULL,
    "scaleMultiplier" DECIMAL(8,6) NOT NULL DEFAULT 1,
    "offsetX" DECIMAL(8,6) NOT NULL DEFAULT 0,
    "offsetY" DECIMAL(8,6) NOT NULL DEFAULT 0,
    "rotationOffset" DECIMAL(8,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrameCalibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TryOnSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOnSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eyewearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UsageEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionId" TEXT,
    "eyewearId" TEXT,
    "eventType" "public"."UsageEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "public"."OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "public"."OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_organizationId_name_key" ON "public"."Brand"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_organizationId_name_key" ON "public"."Category"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Eyewear_organizationId_status_createdAt_idx" ON "public"."Eyewear"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Eyewear_organizationId_sku_key" ON "public"."Eyewear"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "EyewearAsset_organizationId_eyewearId_idx" ON "public"."EyewearAsset"("organizationId", "eyewearId");

-- CreateIndex
CREATE UNIQUE INDEX "EyewearAsset_organizationId_sha256_key" ON "public"."EyewearAsset"("organizationId", "sha256");

-- CreateIndex
CREATE UNIQUE INDEX "FrameCalibration_eyewearId_key" ON "public"."FrameCalibration"("eyewearId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameCalibration_assetId_key" ON "public"."FrameCalibration"("assetId");

-- CreateIndex
CREATE INDEX "FrameCalibration_organizationId_idx" ON "public"."FrameCalibration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TryOnSession_publicId_key" ON "public"."TryOnSession"("publicId");

-- CreateIndex
CREATE INDEX "TryOnSession_organizationId_createdAt_idx" ON "public"."TryOnSession"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_organizationId_sessionId_eyewearId_key" ON "public"."Favorite"("organizationId", "sessionId", "eyewearId");

-- CreateIndex
CREATE INDEX "UsageEvent_organizationId_eventType_createdAt_idx" ON "public"."UsageEvent"("organizationId", "eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Brand" ADD CONSTRAINT "Brand_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Eyewear" ADD CONSTRAINT "Eyewear_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Eyewear" ADD CONSTRAINT "Eyewear_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Eyewear" ADD CONSTRAINT "Eyewear_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EyewearAsset" ADD CONSTRAINT "EyewearAsset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EyewearAsset" ADD CONSTRAINT "EyewearAsset_eyewearId_fkey" FOREIGN KEY ("eyewearId") REFERENCES "public"."Eyewear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FrameCalibration" ADD CONSTRAINT "FrameCalibration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FrameCalibration" ADD CONSTRAINT "FrameCalibration_eyewearId_fkey" FOREIGN KEY ("eyewearId") REFERENCES "public"."Eyewear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FrameCalibration" ADD CONSTRAINT "FrameCalibration_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."EyewearAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TryOnSession" ADD CONSTRAINT "TryOnSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."TryOnSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_eyewearId_fkey" FOREIGN KEY ("eyewearId") REFERENCES "public"."Eyewear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageEvent" ADD CONSTRAINT "UsageEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageEvent" ADD CONSTRAINT "UsageEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."TryOnSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageEvent" ADD CONSTRAINT "UsageEvent_eyewearId_fkey" FOREIGN KEY ("eyewearId") REFERENCES "public"."Eyewear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

