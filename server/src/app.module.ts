import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { HealthController } from "./health.controller";
import { PrismaService } from "./prisma.service";
import { LocalObjectStorageService, OBJECT_STORAGE } from "./object-storage.service";
import { S3ObjectStorageService } from "./s3-object-storage.service";
import { LoginRateLimitGuard, PublicRateLimitGuard } from "./rate-limit.guard";
import { RateLimitService } from "./rate-limit.service";
import { AuditService } from "./audit.service";
import { AuditController } from "./audit.controller";
import { CatalogModule } from "./catalog/catalog.module";
import { LensesModule } from "./lenses/lenses.module";
import { PrescriptionsModule } from "./prescriptions/prescriptions.module";
import { CartModule } from "./cart/cart.module";
import { OrdersModule } from "./orders/orders.module";
import { UsersModule } from "./users/users.module";
import { AdminModule } from "./admin/admin.module";
import { StoresModule } from "./stores/stores.module";
import { AppointmentsModule } from "./appointments/appointments.module";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? "development-only-change-me",
      signOptions: { expiresIn: (process.env.JWT_ACCESS_TTL ?? "15m") as any }
    }),
    CatalogModule,
    LensesModule,
    PrescriptionsModule,
    CartModule,
    OrdersModule,
    UsersModule,
    AdminModule,
    StoresModule,
    AppointmentsModule
  ],
  controllers: [
    AuthController,
    HealthController,
    AuditController
  ],
  providers: [
    PrismaService,
    AuditService,
    LocalObjectStorageService,
    S3ObjectStorageService,
    RateLimitService,
    LoginRateLimitGuard,
    PublicRateLimitGuard,
    {
      provide: OBJECT_STORAGE,
      useFactory: (local: LocalObjectStorageService, s3: S3ObjectStorageService) => process.env.STORAGE_PROVIDER === "s3" ? s3 : local,
      inject: [LocalObjectStorageService, S3ObjectStorageService]
    }
  ]
})
export class AppModule {}
