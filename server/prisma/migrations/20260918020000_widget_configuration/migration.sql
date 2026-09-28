CREATE TABLE "public"."WidgetConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "allowedOrigins" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WidgetConfiguration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WidgetConfiguration_publicKey_key" ON "public"."WidgetConfiguration"("publicKey");
CREATE INDEX "WidgetConfiguration_organizationId_enabled_idx" ON "public"."WidgetConfiguration"("organizationId", "enabled");
ALTER TABLE "public"."WidgetConfiguration" ADD CONSTRAINT "WidgetConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
