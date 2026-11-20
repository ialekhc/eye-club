import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { AccessTokenGuard } from "./auth.guard.js";
import { RolesGuard } from "./roles.guard.js";
import { Roles } from "./roles.decorator.js";
import { UserRole } from "@prisma/client";

@Controller("admin/audit")
@UseGuards(AccessTokenGuard, RolesGuard)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listLogs(@Query() query: { page?: string; limit?: string }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    const skip = (page - 1) * limit;

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true }
          }
        }
      }),
      this.prisma.auditLog.count()
    ]);

    return {
      data: logs,
      meta: { total, page, limit }
    };
  }
}
