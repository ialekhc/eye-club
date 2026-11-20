import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { MICROSERVICE_REGISTRY } from './microservices.registry.js';

@Controller('microservices')
export class MicroservicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('topology')
  getTopology() {
    const activeRole = process.env.MICROSERVICE_ROLE || 'api-gateway';
    return {
      architecture: 'microservices',
      activeNodeRole: activeRole,
      communicationPattern: 'HTTP/REST via API Gateway + Shared JWT Security Context',
      services: MICROSERVICE_REGISTRY.map((svc) => ({
        ...svc,
        configuredEndpoint:
          process.env[svc.envUrlVar] || `http://localhost:${svc.defaultPort}`,
      })),
    };
  }

  @Get('health')
  async getClusterHealth() {
    const started = Date.now();
    let dbConnected = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
    const latencyMs = Date.now() - started;

    const services = await Promise.all(
      MICROSERVICE_REGISTRY.map(async (svc) => {
        const customUrl = process.env[svc.envUrlVar];
        if (customUrl) {
          const pingStart = Date.now();
          try {
            const res = await fetch(`${customUrl}/api/v1/health`, {
              signal: AbortSignal.timeout(2500),
            });
            return {
              id: svc.id,
              name: svc.name,
              boundedContext: svc.boundedContext,
              port: svc.defaultPort,
              endpoint: customUrl,
              mode: 'dedicated-container',
              status: res.ok ? 'HEALTHY' : 'DEGRADED',
              latencyMs: Date.now() - pingStart,
              routePrefixes: svc.routePrefixes,
            };
          } catch {
            return {
              id: svc.id,
              name: svc.name,
              boundedContext: svc.boundedContext,
              port: svc.defaultPort,
              endpoint: customUrl,
              mode: 'dedicated-container',
              status: 'UNREACHABLE',
              latencyMs: Date.now() - pingStart,
              routePrefixes: svc.routePrefixes,
            };
          }
        }

        return {
          id: svc.id,
          name: svc.name,
          boundedContext: svc.boundedContext,
          port: svc.defaultPort,
          endpoint: `http://localhost:${svc.defaultPort}`,
          mode: 'co-hosted-gateway',
          status: dbConnected ? 'HEALTHY' : 'READY_NO_DB',
          latencyMs,
          routePrefixes: svc.routePrefixes,
        };
      }),
    );

    return {
      timestamp: new Date().toISOString(),
      overallStatus: services.every((s) => s.status !== 'UNREACHABLE')
        ? 'HEALTHY'
        : 'DEGRADED',
      databaseConnected: dbConnected,
      services,
    };
  }
}
