import { describe, expect, it } from 'vitest';
import { ReliableEventBus } from '../packages/contracts/src/index';
import {
  buildTestComfortAssessment,
  buildTestDomainEvent,
  buildTestTenantContext,
} from '../packages/testing/src/index';
import { StructuredLogger } from '../packages/logger/src/index';
import { IdentityDomainService } from '../services/identity-service/src/index';
import { TenantDomainService } from '../services/tenant-service/src/index';
import { PatientDomainService } from '../services/patient-service/src/index';
import { CatalogDomainService } from '../services/catalog-service/src/index';
import { InventoryDomainService } from '../services/inventory-service/src/index';
import { TrialDomainService } from '../services/trial-service/src/index';
import { PosDomainService } from '../services/pos-service/src/index';
import { ReportingDomainService } from '../services/reporting-service/src/index';
import {
  STRICT_ELECTRON_WEB_PREFERENCES,
  validateExternalNavigationUrl,
} from '../apps/desktop/src/main';
import { invokeRestrictedIpc } from '../apps/desktop/src/preload';

describe('Eye Club SaaS — Staff-Assisted Desktop Workstation & Microservices Workflow', () => {
  it('executes complete Patient -> Frame Trial -> Comfort Check -> Selection -> POS -> Invoice -> Reporting workflow', async () => {
    const eventBus = new ReliableEventBus();
    const patientService = new PatientDomainService();
    const catalogService = new CatalogDomainService();
    const inventoryService = new InventoryDomainService(eventBus);
    const trialService = new TrialDomainService(eventBus);
    const posService = new PosDomainService(inventoryService, eventBus);
    const reportingService = new ReportingDomainService(eventBus);

    const ctx = buildTestTenantContext();

    // 1. Identify patient by Hospital Patient ID
    const foundPatients = patientService.searchPatients(ctx, 'HOSP-99241');
    expect(foundPatients).toHaveLength(1);
    const patient = foundPatients[0]!;

    // 2. Start staff-assisted trial session
    const session = trialService.startTrialSession(ctx, {
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      hospitalPatientId: patient.hospitalPatientId,
      cameraConsentGranted: true,
      correlationId: 'corr-flow-1',
    });
    expect(session.state).toBe('ACTIVE');

    // 3. Browse catalog & shortlist 2 frames
    const frames = catalogService.listFrames(ctx);
    expect(frames.length).toBeGreaterThanOrEqual(2);
    const frameA = frames[0]!;
    const frameB = frames[1]!;

    trialService.shortlistFrame(
      ctx,
      session.id,
      {
        frameId: frameA.id,
        variantId: frameA.variantId,
        sku: frameA.sku,
        brand: frameA.brand,
        name: frameA.name,
        color: frameA.color,
        size: frameA.size,
        frameWidthMm: frameA.frameWidthMm,
        bridgeWidthMm: frameA.bridgeWidthMm,
        templeLengthMm: frameA.templeLengthMm,
        unitPrice: frameA.unitPrice,
        stockAvailable: inventoryService.getAvailableQuantity(ctx, frameA.variantId),
        isPreferred: true,
        virtualTryOnTested: true,
        physicalTryOnTested: false,
      },
      'corr-flow-1',
    );

    trialService.shortlistFrame(
      ctx,
      session.id,
      {
        frameId: frameB.id,
        variantId: frameB.variantId,
        sku: frameB.sku,
        brand: frameB.brand,
        name: frameB.name,
        color: frameB.color,
        size: frameB.size,
        frameWidthMm: frameB.frameWidthMm,
        bridgeWidthMm: frameB.bridgeWidthMm,
        templeLengthMm: frameB.templeLengthMm,
        unitPrice: frameB.unitPrice,
        stockAvailable: inventoryService.getAvailableQuantity(ctx, frameB.variantId),
        isPreferred: false,
        virtualTryOnTested: true,
        physicalTryOnTested: false,
      },
      'corr-flow-1',
    );

    // 4. Record physical comfort evaluation
    const afterComfort = trialService.recordPhysicalComfort(
      ctx,
      session.id,
      buildTestComfortAssessment({
        frameId: frameA.id,
        variantId: frameA.variantId,
        noseBridgeFit: 'OPTIMAL',
        templePressure: 'COMFORTABLE',
        overallPreference: 5,
      }),
    );
    expect(afterComfort.state).toBe('COMFORT_CHECK');
    expect(afterComfort.shortlistedFrames[0]?.physicalTryOnTested).toBe(true);

    // 5. Finalize selection and transfer to POS
    const transferred = trialService.finalizeSelectionForPos(
      ctx,
      session.id,
      frameA.variantId,
      'corr-flow-1',
    );
    expect(transferred.state).toBe('TRANSFERRED_TO_POS');
    expect(transferred.selectedFrameVariantId).toBe(frameA.variantId);

    // 6. Complete POS Sale with stock reservation & prescription lens
    const stockBefore = inventoryService.getAvailableQuantity(ctx, frameA.variantId);
    const invoice = posService.completeAssistedSale(ctx, {
      trialSessionId: session.id,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      hospitalPatientId: patient.hospitalPatientId,
      items: [
        {
          variantId: frameA.variantId,
          sku: frameA.sku,
          productName: frameA.name,
          quantity: 1,
          frameUnitPrice: frameA.unitPrice,
          lensPackageName: 'Single Vision 1.60 Blue-Cut',
          lensUnitPrice: 1999,
        },
      ],
      discountAmount: 298,
      taxRatePercent: 13,
      paidAmount: 5085,
      paymentMethod: 'CASH',
      correlationId: 'corr-flow-1',
    });

    expect(invoice.invoiceNumber).toContain('INV-TIO-WS-01');
    expect(invoice.paymentStatus).toBe('COMPLETED');
    expect(inventoryService.getAvailableQuantity(ctx, frameA.variantId)).toBe(stockBefore - 1);

    // 7. Flush Transactional Outbox & verify Reporting projections
    const flushResult = await eventBus.flushOutbox();
    expect(flushResult.published).toBeGreaterThanOrEqual(6);
    expect(flushResult.deadLettered).toBe(0);

    const report = reportingService.getCentreReport(ctx);
    expect(report.trialsStarted).toBe(1);
    expect(report.framesShortlisted).toBe(2);
    expect(report.trialsCompleted).toBe(1);
    expect(report.salesCompleted).toBe(1);
    expect(report.trialToSaleConversionRate).toBe(100);
    expect(report.grossRevenue).toBe(invoice.totalAmount);
  });

  it('prevents overselling and rolls back stock reservations on transaction failure', () => {
    const eventBus = new ReliableEventBus();
    const inventoryService = new InventoryDomainService(eventBus);
    const posService = new PosDomainService(inventoryService, eventBus);
    const ctx = buildTestTenantContext();

    const available = inventoryService.getAvailableQuantity(ctx, 'var-at-05-brg');
    expect(available).toBe(4);

    expect(() =>
      posService.completeAssistedSale(ctx, {
        patientName: 'Oversell Test',
        items: [
          {
            variantId: 'var-at-05-brg',
            sku: 'AT-05-BRG-M',
            productName: 'The Muse Cat-Eye',
            quantity: 10,
            frameUnitPrice: 4850,
            lensUnitPrice: 0,
          },
        ],
        discountAmount: 0,
        taxRatePercent: 0,
        paidAmount: 48500,
        paymentMethod: 'CASH',
        correlationId: 'corr-oversell',
      }),
    ).toThrow(/Insufficient stock/);

    // Stock must remain unchanged after failed reservation
    expect(inventoryService.getAvailableQuantity(ctx, 'var-at-05-brg')).toBe(4);
  });

  it('enforces multi-tenant isolation, workstation licensing, and dead-letter queue routing', async () => {
    const identityService = new IdentityDomainService();
    const eventBus = new ReliableEventBus({ maxRetries: 2 });
    const tenantService = new TenantDomainService(eventBus);
    const ctx = buildTestTenantContext();

    // Valid workstation license passes
    expect(tenantService.validateWorkstationBinding(ctx, 'LIC-TIO-2026-WS01').status).toBe('ACTIVE');

    // Cross-tenant access is blocked
    expect(() =>
      identityService.assertCrossTenantIsolation(ctx, 'tenant-Other-Hospital'),
    ).toThrow(/Cross-tenant access denied/);

    // Expired subscription emits SubscriptionExpired and blocks workstation
    const expiredCtx = buildTestTenantContext({ subscriptionStatus: 'EXPIRED' });
    expect(() =>
      tenantService.validateWorkstationBinding(expiredCtx, 'LIC-TIO-2026-WS01'),
    ).toThrow(/Subscription is EXPIRED/i);

    // Dead-letter queue routes failing consumer events after maxRetries
    eventBus.subscribe('SubscriptionExpired', () => {
      throw new Error('Downstream billing webhook timeout');
    });
    const result = await eventBus.flushOutbox();
    expect(result.deadLettered).toBe(1);
    expect(eventBus.getDeadLetterQueue()).toHaveLength(1);
  });

  it('enforces Electron desktop security policies, IPC allowlist, and log redaction', async () => {
    expect(STRICT_ELECTRON_WEB_PREFERENCES.contextIsolation).toBe(true);
    expect(STRICT_ELECTRON_WEB_PREFERENCES.nodeIntegration).toBe(false);
    expect(STRICT_ELECTRON_WEB_PREFERENCES.sandbox).toBe(true);

    expect(
      validateExternalNavigationUrl('https://api.eyeclub.hospital/api/v1', 'https://api.eyeclub.hospital'),
    ).toBe(true);
    expect(
      validateExternalNavigationUrl('https://evil.example.com/phish', 'https://api.eyeclub.hospital'),
    ).toBe(false);

    await expect(
      invokeRestrictedIpc('workstation:get-identity', async (ch) => ({ channel: ch })),
    ).resolves.toEqual({ channel: 'workstation:get-identity' });

    expect(() =>
      invokeRestrictedIpc('shell:exec-arbitrary-command', async () => ({})),
    ).toThrow(/Security Violation/);

    const logger = new StructuredLogger('identity-service');
    const formatted = JSON.parse(
      logger.format('info', 'Staff login', {
        email: 'optician@hospital.np',
        password: 'super-secret-password',
        accessToken: 'jwt-secret-token',
      }),
    );
    expect(formatted.password).toBe('[REDACTED]');
    expect(formatted.accessToken).toBe('[REDACTED]');
    expect(formatted.Info ?? formatted.email).toBe('optician@hospital.np');

    const evt = buildTestDomainEvent('TrialStarted', { session: 'TRL-1' });
    expect(evt.eventType).toBe('TrialStarted');
  });
});
