import {
  type DomainEventEnvelope,
  ReliableEventBus,
  type TenantContext,
  type TenantType,
} from '../../../packages/contracts/src/index';

export interface RegisteredWorkstation {
  id: string;
  tenantId: string;
  opticalCentreId: string;
  workstationCode: string;
  deviceName: string;
  licenseKey: string;
  status: 'ACTIVE' | 'REVOKED';
}

export class TenantDomainService {
  private readonly workstations = new Map<string, RegisteredWorkstation>();

  constructor(private readonly eventBus = new ReliableEventBus()) {
    this.workstations.set('TIO-WS-01', {
      id: 'ws-dispensary-01',
      tenantId: 'tenant-Tilganga-Hospital',
      opticalCentreId: 'centre-gaushala-main',
      workstationCode: 'TIO-WS-01',
      deviceName: 'Wing-A Optical Fitting Desk #1',
      licenseKey: 'LIC-TIO-2026-WS01',
      status: 'ACTIVE',
    });
  }

  registerWorkstation(input: Omit<RegisteredWorkstation, 'id' | 'status'>): RegisteredWorkstation {
    const ws: RegisteredWorkstation = {
      ...input,
      id: `ws-${Date.now()}`,
      status: 'ACTIVE',
    };
    this.workstations.set(ws.workstationCode, ws);
    return ws;
  }

  validateWorkstationBinding(ctx: TenantContext, licenseKey: string): RegisteredWorkstation {
    if (ctx.subscriptionStatus === 'EXPIRED' || ctx.subscriptionStatus === 'SUSPENDED') {
      const event: DomainEventEnvelope = {
        eventId: `evt-sub-exp-${Date.now()}`,
        eventType: 'SubscriptionExpired',
        aggregateId: ctx.tenantId,
        tenantId: ctx.tenantId,
        opticalCentreId: ctx.opticalCentreId,
        correlationId: `corr-${Date.now()}`,
        producerService: 'tenant-service',
        occurredAt: new Date().toISOString(),
        payload: { tenantId: ctx.tenantId, status: ctx.subscriptionStatus },
      };
      this.eventBus.stageInOutbox(event);
      throw new Error(`Tenant subscription is ${ctx.subscriptionStatus}. Workstation activation blocked.`);
    }

    const ws = this.workstations.get(ctx.workstationCode);
    if (!ws || ws.status !== 'ACTIVE' || ws.licenseKey !== licenseKey) {
      throw new Error('Workstation license verification failed.');
    }
    if (ws.tenantId !== ctx.tenantId || ws.opticalCentreId !== ctx.opticalCentreId) {
      throw new Error('Workstation is registered to a different tenant or optical centre.');
    }
    return ws;
  }

  createHierarchyNode(input: {
    tenantName: string;
    tenantType: TenantType;
    opticalBusinessName: string;
    opticalCentreName: string;
    centreCode: string;
  }) {
    const tenantId = `tenant-${Date.now()}`;
    const businessId = `biz-${Date.now()}`;
    const centreId = `centre-${Date.now()}`;
    return {
      tenantId,
      tenantName: input.tenantName,
      tenantType: input.tenantType,
      opticalBusinessId: businessId,
      opticalBusinessName: input.opticalBusinessName,
      opticalCentreId: centreId,
      opticalCentreName: input.opticalCentreName,
      centreCode: input.centreCode,
    };
  }
}
