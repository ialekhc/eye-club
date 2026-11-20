import { ReliableEventBus, type TenantContext } from '../../../packages/contracts/src/index';
import type { InventoryDomainService } from '../../inventory-service/src/index';

export interface PosCheckoutInput {
  trialSessionId?: string;
  patientId?: string;
  patientName: string;
  hospitalPatientId?: string;
  items: Array<{
    variantId: string;
    sku: string;
    productName: string;
    quantity: number;
    frameUnitPrice: number;
    lensPackageName?: string;
    lensUnitPrice: number;
  }>;
  discountAmount: number;
  taxRatePercent: number;
  paidAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'SPLIT' | 'HOSPITAL_BILLING' | 'ESEWA';
  prescription?: {
    odSph: string;
    odCyl: string;
    odAxis: string;
    osSph: string;
    osCyl: string;
    osAxis: string;
    pdMm: string;
  };
  correlationId: string;
}

export class PosDomainService {
  constructor(
    private readonly inventoryService: InventoryDomainService,
    private readonly eventBus = new ReliableEventBus(),
  ) {}

  completeAssistedSale(ctx: TenantContext, input: PosCheckoutInput) {
    if (!input.items.length) {
      throw new Error('POS sale requires at least one frame or optical item.');
    }

    const reservationRefs: string[] = [];
    try {
      for (const item of input.items) {
        const refId = `pos-res-${input.correlationId}-${item.variantId}`;
        this.inventoryService.reserveStock(ctx, {
          variantId: item.variantId,
          quantity: item.quantity,
          referenceId: refId,
          correlationId: input.correlationId,
        });
        reservationRefs.push(refId);
      }

      for (const refId of reservationRefs) {
        this.inventoryService.commitReservation(ctx, refId, input.correlationId);
      }
    } catch (err) {
      for (const refId of reservationRefs) {
        this.inventoryService.releaseReservation(ctx, refId, input.correlationId);
      }
      throw err;
    }

    const subtotal = input.items.reduce(
      (sum, item) => sum + (item.frameUnitPrice + item.lensUnitPrice) * item.quantity,
      0,
    );
    const taxable = Math.max(0, subtotal - input.discountAmount);
    const taxAmount = Math.round((taxable * input.taxRatePercent) / 100);
    const totalAmount = taxable + taxAmount;
    const paidAmount = Math.min(totalAmount, Math.max(0, input.paidAmount));
    const balanceDue = Math.max(0, totalAmount - paidAmount);

    const invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${ctx.workstationCode}-${Date.now().toString().slice(-5)}`,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      workstationId: ctx.workstationId,
      staffId: ctx.staffId,
      trialSessionId: input.trialSessionId,
      patientId: input.patientId,
      patientName: input.patientName,
      hospitalPatientId: input.hospitalPatientId,
      subtotal,
      discountAmount: input.discountAmount,
      taxAmount,
      totalAmount,
      paidAmount,
      balanceDue,
      paymentMethod: input.paymentMethod,
      paymentStatus: balanceDue === 0 ? 'COMPLETED' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING',
      items: input.items,
      prescription: input.prescription,
      createdAt: new Date().toISOString(),
    };

    this.eventBus.stageInOutbox({
      eventId: `evt-sale-${invoice.id}`,
      eventType: 'SaleCompleted',
      aggregateId: invoice.id,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      correlationId: input.correlationId,
      producerService: 'pos-service',
      occurredAt: invoice.createdAt,
      payload: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        trialSessionId: invoice.trialSessionId,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        balanceDue: invoice.balanceDue,
      },
    });

    return invoice;
  }
}
