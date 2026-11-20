-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "frameAsset" JSONB,
ADD COLUMN     "frameCalibration" JSONB;

-- CreateTable
CREATE TABLE "public"."WidgetConfiguration" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "allowedOrigins" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WidgetConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TryOnSession" (
    "publicId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOnSession_pkey" PRIMARY KEY ("publicId")
);

-- CreateTable
CREATE TABLE "public"."UsageEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eyewearId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WidgetConfiguration_publicKey_key" ON "public"."WidgetConfiguration"("publicKey");

-- CreateIndex
CREATE INDEX "UsageEvent_vendorId_createdAt_idx" ON "public"."UsageEvent"("vendorId", "createdAt");
