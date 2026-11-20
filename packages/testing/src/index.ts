import type {
  DomainEventEnvelope,
  DomainEventType,
  PhysicalComfortAssessment,
  TenantContext,
  TrialSessionRecord,
} from '../../contracts/src/index';

export function buildTestTenantContext(overrides: Partial<TenantContext> = {}): TenantContext {
  return {
    tenantId: 'tenant-Tilganga-Hospital',
    tenantName: 'Tilganga Institute of Ophthalmology',
    tenantType: 'HOSPITAL_OPTICAL_BUSINESS',
    opticalBusinessId: 'biz-tilganga-optics',
    opticalCentreId: 'centre-gaushala-main',
    opticalCentreName: 'Tilganga Optical Dispensary - Wing A',
    workstationId: 'ws-dispensary-01',
    workstationCode: 'TIO-WS-01',
    staffId: 'staff-optician-01',
    staffRole: 'DISPENSING_OPTICIAN',
    subscriptionStatus: 'ACTIVE',
    ...overrides,
  };
}

export function buildTestComfortAssessment(
  overrides: Partial<PhysicalComfortAssessment> = {},
): PhysicalComfortAssessment {
  return {
    frameId: 'atelier-01',
    variantId: 'var-ec-air02-blk',
    noseBridgeFit: 'OPTIMAL',
    templePressure: 'COMFORTABLE',
    frameWidthSuitability: 'PROPORTIONAL',
    weightComfort: 5,
    stability: 5,
    overallPreference: 5,
    staffRecommendation: 'Ideal bridge contact and zero temple pinch behind auricle.',
    recordedByStaffId: 'staff-optician-01',
    recordedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildTestTrialSession(
  overrides: Partial<TrialSessionRecord> = {},
): TrialSessionRecord {
  return {
    id: 'trial-session-01',
    sessionCode: 'TRL-2026-001',
    tenantId: 'tenant-Tilganga-Hospital',
    opticalCentreId: 'centre-gaushala-main',
    workstationId: 'ws-dispensary-01',
    staffId: 'staff-optician-01',
    patientId: 'pat-01',
    patientName: 'Sita Devi Shrestha',
    hospitalPatientId: 'HOSP-99241',
    state: 'ACTIVE',
    cameraConsentGranted: true,
    shortlistedFrames: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildTestDomainEvent<TPayload extends Record<string, unknown>>(
  eventType: DomainEventType,
  payload: TPayload,
  overrides: Partial<DomainEventEnvelope<TPayload>> = {},
): DomainEventEnvelope<TPayload> {
  return {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    eventType,
    aggregateId: 'agg-01',
    tenantId: 'tenant-Tilganga-Hospital',
    opticalCentreId: 'centre-gaushala-main',
    correlationId: `corr-${Date.now()}`,
    producerService: 'trial-service',
    occurredAt: new Date().toISOString(),
    payload,
    ...overrides,
  };
}
