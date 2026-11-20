import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  async get() {
    try { await this.prisma.$queryRaw`SELECT 1`; return { status: "ok", service: "virtual-eyewear-api", database: "ok" }; }
    catch { throw new ServiceUnavailableException({ status: "degraded", service: "virtual-eyewear-api", database: "unavailable" }); }
  }
}
