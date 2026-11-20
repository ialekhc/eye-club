import {
  type PhysicalComfortAssessment,
  ReliableEventBus,
  type TenantContext,
  type TrialSessionRecord,
  type TrialShortlistedFrame,
} from '../../../packages/contracts/src/index';

export class TrialDomainService {
  private readonly sessions = new Map<string, TrialSessionRecord>();

  constructor(private readonly eventBus = new ReliableEventBus()) {}

  startTrialSession(
    ctx: TenantContext,
    input: {
      patientId?: string;
      patientName: string;
      hospitalPatientId?: string;
      cameraConsentGranted: boolean;
      correlationId: string;
    },
  ): TrialSessionRecord {
    const id = `trial-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const session: TrialSessionRecord = {
      id,
      sessionCode: `TRL-${Date.now().toString().slice(-5)}`,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      workstationId: ctx.workstationId,
      staffId: ctx.staffId,
      patientId: input.patientId,
      patientName: input.patientName.trim() || 'Anonymous Walk-In Patient',
      hospitalPatientId: input.hospitalPatientId,
      state: 'ACTIVE',
      cameraConsentGranted: input.cameraConsentGranted,
      shortlistedFrames: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);

    this.eventBus.stageInOutbox({
      eventId: `evt-trial-start-${session.id}`,
      eventType: 'TrialStarted',
      aggregateId: session.id,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      correlationId: input.correlationId,
      producerService: 'trial-service',
      occurredAt: session.startedAt,
      payload: {
        trialSessionId: session.id,
        patientId: session.patientId,
        patientName: session.patientName,
        workstationId: ctx.workstationId,
      },
    });

    return session;
  }

  shortlistFrame(
    ctx: TenantContext,
    sessionId: string,
    frame: Omit<TrialShortlistedFrame, 'comfortAssessment'>,
    correlationId: string,
  ): TrialSessionRecord {
    const session = this.getAuthorizedSession(ctx, sessionId);
    const existingIdx = session.shortlistedFrames.findIndex((f) => f.variantId === frame.variantId);
    if (existingIdx >= 0) {
      session.shortlistedFrames[existingIdx] = {
        ...session.shortlistedFrames[existingIdx]!,
        ...frame,
      };
    } else {
      session.shortlistedFrames.push({ ...frame });
    }
    session.state = 'SHORTLISTING';
    session.updatedAt = new Date().toISOString();

    this.eventBus.stageInOutbox({
      eventId: `evt-shortlist-${session.id}-${frame.variantId}`,
      eventType: 'FrameShortlisted',
      aggregateId: session.id,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      correlationId,
      producerService: 'trial-service',
      occurredAt: session.updatedAt,
      payload: {
        trialSessionId: session.id,
        frameId: frame.frameId,
        variantId: frame.variantId,
        sku: frame.sku,
      },
    });

    return session;
  }

  recordPhysicalComfort(
    ctx: TenantContext,
    sessionId: string,
    assessment: PhysicalComfortAssessment,
  ): TrialSessionRecord {
    const session = this.getAuthorizedSession(ctx, sessionId);
    const frameEntry = session.shortlistedFrames.find((f) => f.variantId === assessment.variantId);
    if (!frameEntry) {
      throw new Error(`Frame variant ${assessment.variantId} is not shortlisted in session ${sessionId}.`);
    }
    frameEntry.physicalTryOnTested = true;
    frameEntry.comfortAssessment = assessment;
    session.state = 'COMFORT_CHECK';
    session.updatedAt = new Date().toISOString();
    return session;
  }

  finalizeSelectionForPos(
    ctx: TenantContext,
    sessionId: string,
    selectedVariantId: string,
    correlationId: string,
  ): TrialSessionRecord {
    const session = this.getAuthorizedSession(ctx, sessionId);
    const selected = session.shortlistedFrames.find((f) => f.variantId === selectedVariantId);
    if (!selected) {
      throw new Error('Selected frame must be in the patient trial shortlist.');
    }

    session.selectedFrameVariantId = selectedVariantId;
    session.state = 'TRANSFERRED_TO_POS';
    session.updatedAt = new Date().toISOString();

    this.eventBus.stageInOutbox({
      eventId: `evt-trial-complete-${session.id}`,
      eventType: 'TrialCompleted',
      aggregateId: session.id,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      correlationId,
      producerService: 'trial-service',
      occurredAt: session.updatedAt,
      payload: {
        trialSessionId: session.id,
        selectedVariantId,
        sku: selected.sku,
        unitPrice: selected.unitPrice,
        patientName: session.patientName,
      },
    });

    return session;
  }

  getAuthorizedSession(ctx: TenantContext, sessionId: string): TrialSessionRecord {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Trial session ${sessionId} not found.`);
    if (session.tenantId !== ctx.tenantId || session.opticalCentreId !== ctx.opticalCentreId) {
      throw new Error('Cross-tenant or cross-centre trial session access denied.');
    }
    return session;
  }
}
