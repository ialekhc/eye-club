import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(action: string, input: { userId?: string; entity?: string; entityId?: string; metadata?: import("@prisma/client").Prisma.InputJsonValue }) {
    return this.prisma.auditLog.create({
      data: {
        action,
        userId: input.userId,
        entity: input.entity || "System",
        entityId: input.entityId || "System",
        metadata: input.metadata
      }
    }).catch(() => undefined);
  }
}
