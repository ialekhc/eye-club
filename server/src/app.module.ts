import { DynamicModule, Module, Type } from "@nestjs/common";
import { WidgetController } from "./widget.controller.js";
import { FramesController } from "./frames.controller.js";
import { WishlistController } from "./wishlist.controller.js";
import { SecurityModule } from "./security.module.js";
import { AuthController } from "./auth.controller.js";
import { HealthController } from "./health.controller.js";
import { PrismaService } from "./prisma.service.js";
import { LocalObjectStorageService, OBJECT_STORAGE } from "./object-storage.service.js";
import { S3ObjectStorageService } from "./s3-object-storage.service.js";
import { LoginRateLimitGuard, PublicRateLimitGuard } from "./rate-limit.guard.js";
import { RateLimitService } from "./rate-limit.service.js";
import { AuditService } from "./audit.service.js";
import { AuditController } from "./audit.controller.js";
import { CatalogModule } from "./catalog/catalog.module.js";
import { LensesModule } from "./lenses/lenses.module.js";
import { PrescriptionsModule } from "./prescriptions/prescriptions.module.js";
import { CartModule } from "./cart/cart.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { UsersModule } from "./users/users.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { StoresModule } from "./stores/stores.module.js";
import { AppointmentsModule } from "./appointments/appointments.module.js";
import { VendorsModule } from "./vendors/vendors.module.js";
import { PosModule } from "./pos/pos.module.js";
import { MicroservicesModule } from "./microservices/microservices.module.js";
import type { MicroserviceRole } from "./microservices/microservices.registry.js";

export function getMicroserviceComposition(role: MicroserviceRole): {
  imports: Array<Type<unknown>>;
  controllers: Array<Type<unknown>>;
} {
  switch (role) {
    case "api-gateway":
      // Pure API Gateway mounts zero business domain modules; only gateway health & mesh telemetry
      return {
        imports: [SecurityModule, MicroservicesModule],
        controllers: [HealthController],
      };

    case "identity-tenant-service":
      return {
        imports: [SecurityModule, UsersModule, VendorsModule],
        controllers: [AuthController, AuditController, HealthController],
      };

    case "catalog-tryon-service":
      return {
        imports: [SecurityModule, CatalogModule, LensesModule],
        controllers: [FramesController, WidgetController, HealthController],
      };

    case "commerce-order-service":
      return {
        imports: [SecurityModule, CartModule, OrdersModule, AdminModule],
        controllers: [WishlistController, HealthController],
      };

    case "clinical-store-service":
      return {
        imports: [SecurityModule, StoresModule, AppointmentsModule, PrescriptionsModule],
        controllers: [HealthController],
      };

    case "pos-lab-service":
      return {
        imports: [SecurityModule, PosModule],
        controllers: [HealthController],
      };
  }
}

@Module({})
export class AppModule {
  static forMicroservice(role: MicroserviceRole): DynamicModule {
    const composition = getMicroserviceComposition(role);
    return {
      module: AppModule,
      imports: composition.imports,
      controllers: composition.controllers,
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
          useFactory: (local: LocalObjectStorageService, s3: S3ObjectStorageService) =>
            process.env.STORAGE_PROVIDER === "s3" ? s3 : local,
          inject: [LocalObjectStorageService, S3ObjectStorageService],
        },
      ],
    };
  }
}
