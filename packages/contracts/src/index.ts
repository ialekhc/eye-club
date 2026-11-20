/**
 * Shared Domain Contracts, Organization Hierarchy, Event Bus & Outbox Primitives
 * across Eye Club SaaS Microservices and Desktop Workstation.
 */

export type TenantType = 'HOSPITAL' | 'HOSPITAL_OPTICAL_BUSINESS' | 'INDEPENDENT_OPTICAL_CENTRE';

export type StaffRole =
  | 'PLATFORM_SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'HOSPITAL_DIRECTOR'
  | 'CENTRE_MANAGER'
  | 'OPTOMETRIST'
  | 'DISPENSING_OPTICIAN'
  | 'POS_CASHIER';

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  tenantType: TenantType;
  opticalBusinessId: string;
  opticalCentreId: string;
  opticalCentreName: string;
  workstationId: string;
  workstationCode: string;
  staffId: string;
  staffRole: StaffRole;
  subscriptionStatus: 'ACTIVE' | 'TRIALING' | 'EXPIRED' | 'SUSPENDED';
}

export type ComfortScore = 1 | 2 | 3 | 4 | 5;

export interface PhysicalComfortAssessment {
  frameId: string;
  variantId: string;
  noseBridgeFit: 'TOO_TIGHT' | 'OPTIMAL' | 'LOOSE';
  templePressure: 'HIGH_PRESSURE' | 'COMFORTABLE' | 'SLIPPING';
  frameWidthSuitability: 'NARROW' | 'PROPORTIONAL' | 'WIDE';
  weightComfort: ComfortScore;
  stability: ComfortScore;
  overallPreference: ComfortScore;
  staffRecommendation: string;
  recordedByStaffId: string;
  recordedAt: string;
}

export interface TrialShortlistedFrame {
  frameId: string;
  variantId: string;
  sku: string;
  brand: string;
  name: string;
  color: string;
  size: string;
  frameWidthMm: number;
  bridgeWidthMm: number;
  templeLengthMm: number;
  unitPrice: number;
  stockAvailable: number;
  isPreferred: boolean;
  virtualTryOnTested: boolean;
  physicalTryOnTested: boolean;
  comfortAssessment?: PhysicalComfortAssessment;
}

export type TrialSessionState =
  | 'ACTIVE'
  | 'SHORTLISTING'
  | 'COMFORT_CHECK'
  | 'FRAME_SELECTED'
  | 'TRANSFERRED_TO_POS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PatientRecord {
  id: string;
  tenantId: string;
  opticalCentreId: string;
  hospitalPatientId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  isAnonymousWalkIn: boolean;
  latestPrescription?: {
    id: string;
    odSph: string;
    odCyl: string;
    odAxis: string;
    odAdd: string;
    osSph: string;
    osCyl: string;
    osAxis: string;
    osAdd: string;
    pdMm: string;
    prescribedBy: string;
    recordedAt: string;
  };
  trialCount: number;
  purchaseCount: number;
  createdAt: string;
}

export interface TrialSessionRecord {
  id: string;
  sessionCode: string;
  tenantId: string;
  opticalCentreId: string;
  workstationId: string;
  staffId: string;
  patientId?: string;
  patientName: string;
  hospitalPatientId?: string;
  state: TrialSessionState;
  cameraConsentGranted: boolean;
  shortlistedFrames: TrialShortlistedFrame[];
  selectedFrameVariantId?: string;
  posOrderId?: string;
  startedAt: string;
  updatedAt: string;
}

export type DomainEventType =
  | 'TrialStarted'
  | 'FrameShortlisted'
  | 'TrialCompleted'
  | 'StockReserved'
  | 'StockReleased'
  | 'SaleCompleted'
  | 'InventoryAdjusted'
  | 'SubscriptionExpired';

export interface DomainEventEnvelope<TPayload = Record<string, unknown>> {
  eventId: string;
  eventType: DomainEventType;
  aggregateId: string;
  tenantId: string;
  opticalCentreId: string;
  correlationId: string;
  producerService: string;
  occurredAt: string;
  payload: TPayload;
}

export interface OutboxRecord<TPayload = Record<string, unknown>> {
  id: string;
  event: DomainEventEnvelope<TPayload>;
  status: 'PENDING' | 'PUBLISHED' | 'DEAD_LETTER';
  attempts: number;
  lastError?: string;
  createdAt: string;
  publishedAt?: string;
}

export type EventConsumerHandler<TPayload = Record<string, unknown>> = (
  event: DomainEventEnvelope<TPayload>,
) => Promise<void> | void;

/**
 * Reliable Transactional Outbox & Idempotent Event Bus (RabbitMQ-compatible).
 * Supports retries, dead-letter queue routing, and correlation ID propagation.
 */
export class ReliableEventBus {
  private readonly outbox: OutboxRecord[] = [];
  private readonly processedEventIds = new Set<string>();
  private readonly deadLetterQueue: OutboxRecord[] = [];
  private readonly handlers = new Map<DomainEventType, EventConsumerHandler[]>();
  private readonly maxRetries: number;

  constructor(options: { maxRetries?: number } = {}) {
    this.maxRetries = options.maxRetries ?? 3;
  }

  subscribe(eventType: DomainEventType, handler: EventConsumerHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  stageInOutbox<TPayload extends Record<string, unknown>>(
    event: DomainEventEnvelope<TPayload>,
  ): OutboxRecord<TPayload> {
    const record: OutboxRecord<TPayload> = {
      id: `outbox-${event.eventId}`,
      event,
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    this.outbox.push(record);
    return record;
  }

  async flushOutbox(): Promise<{ published: number; deadLettered: number }> {
    let published = 0;
    let deadLettered = 0;

    for (const record of this.outbox) {
      if (record.status !== 'PENDING') continue;

      const consumers = this.handlers.get(record.event.eventType) ?? [];
      const dedupeKey = `${record.event.eventType}:${record.event.eventId}`;

      if (this.processedEventIds.has(dedupeKey)) {
        record.status = 'PUBLISHED';
        record.publishedAt = new Date().toISOString();
        continue;
      }

      let succeeded = false;
      while (record.attempts < this.maxRetries && !succeeded) {
        record.attempts += 1;
        try {
          for (const handler of consumers) {
            await handler(record.event);
          }
          this.processedEventIds.add(dedupeKey);
          record.status = 'PUBLISHED';
          record.publishedAt = new Date().toISOString();
          published += 1;
          succeeded = true;
        } catch (err) {
          record.lastError = err instanceof Error ? err.message : 'Consumer execution failed';
        }
      }

      if (!succeeded) {
        record.status = 'DEAD_LETTER';
        this.deadLetterQueue.push(record);
        deadLettered += 1;
      }
    }

    return { published, deadLettered };
  }

  getOutboxSnapshot(): readonly OutboxRecord[] {
    return this.outbox;
  }

  getDeadLetterQueue(): readonly OutboxRecord[] {
    return this.deadLetterQueue;
  }
}
