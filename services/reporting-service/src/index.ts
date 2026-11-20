import type { DomainEventEnvelope, ReliableEventBus, TenantContext } from '../../../packages/contracts/src/index';

export interface CentreAnalyticsSummary {
  tenantId: string;
  opticalCentreId: string;
  trialsStarted: number;
  framesShortlisted: number;
  trialsCompleted: number;
  salesCompleted: number;
  trialToSaleConversionRate: number;
  grossRevenue: number;
  collectedRevenue: number;
}

export class ReportingDomainService {
  private readonly metricsByCentre = new Map<string, CentreAnalyticsSummary>();

  constructor(eventBus: ReliableEventBus) {
    eventBus.subscribe('TrialStarted', (evt) => this.recordEvent(evt));
    eventBus.subscribe('FrameShortlisted', (evt) => this.recordEvent(evt));
    eventBus.subscribe('TrialCompleted', (evt) => this.recordEvent(evt));
    eventBus.subscribe('SaleCompleted', (evt) => this.recordEvent(evt));
  }

  private getOrCreate(tenantId: string, opticalCentreId: string): CentreAnalyticsSummary {
    const key = `${tenantId}::${opticalCentreId}`;
    const existing = this.metricsByCentre.get(key);
    if (existing) return existing;
    const initial: CentreAnalyticsSummary = {
      tenantId,
      opticalCentreId,
      trialsStarted: 0,
      framesShortlisted: 0,
      trialsCompleted: 0,
      salesCompleted: 0,
      trialToSaleConversionRate: 0,
      grossRevenue: 0,
      collectedRevenue: 0,
    };
    this.metricsByCentre.set(key, initial);
    return initial;
  }

  private recordEvent(event: DomainEventEnvelope): void {
    const summary = this.getOrCreate(event.tenantId, event.opticalCentreId);
    if (event.eventType === 'TrialStarted') summary.trialsStarted += 1;
    if (event.eventType === 'FrameShortlisted') summary.framesShortlisted += 1;
    if (event.eventType === 'TrialCompleted') summary.trialsCompleted += 1;
    if (event.eventType === 'SaleCompleted') {
      summary.salesCompleted += 1;
      summary.grossRevenue += Number(event.payload.totalAmount ?? 0);
      summary.collectedRevenue += Number(event.payload.paidAmount ?? 0);
    }
    summary.trialToSaleConversionRate =
      summary.trialsStarted > 0
        ? Number(((summary.salesCompleted / summary.trialsStarted) * 100).toFixed(1))
        : 0;
  }

  getCentreReport(ctx: TenantContext): CentreAnalyticsSummary {
    return this.getOrCreate(ctx.tenantId, ctx.opticalCentreId);
  }
}
