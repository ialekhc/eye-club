import { describe, expect, it } from "vitest";
import {
  isPathAllowedOnMicroservice,
  MICROSERVICE_REGISTRY,
  resolveServiceForPath,
} from "./microservices.registry";
import { getMicroserviceComposition } from "../app.module";

describe("Strict Microservices Architecture Boundaries", () => {
  it("defines 6 isolated microservices on distinct ports 4000..4005", () => {
    expect(MICROSERVICE_REGISTRY).toHaveLength(6);
    const ports = MICROSERVICE_REGISTRY.map((s) => s.defaultPort);
    expect(new Set(ports).size).toBe(6);
    expect(ports).toEqual([4000, 4001, 4002, 4003, 4004, 4005]);
  });

  it("maps every domain route prefix deterministically to its owning microservice", () => {
    expect(resolveServiceForPath("/api/v1/auth/login").id).toBe("identity-tenant-service");
    expect(resolveServiceForPath("/api/v1/vendors/vendor-1").id).toBe("identity-tenant-service");
    expect(resolveServiceForPath("/api/v1/catalog/products").id).toBe("catalog-tryon-service");
    expect(resolveServiceForPath("/api/v1/lenses/types").id).toBe("catalog-tryon-service");
    expect(resolveServiceForPath("/api/v1/cart").id).toBe("commerce-order-service");
    expect(resolveServiceForPath("/api/v1/orders/checkout").id).toBe("commerce-order-service");
    expect(resolveServiceForPath("/api/v1/stores").id).toBe("clinical-store-service");
    expect(resolveServiceForPath("/api/v1/prescriptions").id).toBe("clinical-store-service");
    expect(resolveServiceForPath("/api/v1/pos/checkout").id).toBe("pos-lab-service");
    expect(resolveServiceForPath("/api/v1/microservices/health").id).toBe("api-gateway");
  });

  it("strictly rejects cross-domain requests on downstream microservices", () => {
    expect(isPathAllowedOnMicroservice("pos-lab-service", "/api/v1/pos/registers")).toBe(true);
    expect(isPathAllowedOnMicroservice("pos-lab-service", "/api/v1/catalog/products")).toBe(false);
    expect(isPathAllowedOnMicroservice("identity-tenant-service", "/api/v1/vendors")).toBe(true);
    expect(isPathAllowedOnMicroservice("identity-tenant-service", "/api/v1/pos/checkout")).toBe(false);
    expect(isPathAllowedOnMicroservice("catalog-tryon-service", "/api/v1/health")).toBe(true);
  });

  it("isolates NestJS modules per microservice role with zero domain module leakage on api-gateway", () => {
    const gatewayComp = getMicroserviceComposition("api-gateway");
    expect(gatewayComp.imports).toHaveLength(2); // SecurityModule + MicroservicesModule only

    const posComp = getMicroserviceComposition("pos-lab-service");
    expect(posComp.imports.map((m) => m.name)).toEqual(["SecurityModule", "PosModule"]);

    const identityComp = getMicroserviceComposition("identity-tenant-service");
    expect(identityComp.imports.map((m) => m.name)).toEqual([
      "SecurityModule",
      "UsersModule",
      "VendorsModule",
    ]);
  });
});
