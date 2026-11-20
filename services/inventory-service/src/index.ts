import {
  type DomainEventEnvelope,
  ReliableEventBus,
  type TenantContext,
} from '../../../packages/contracts/src/index';

export interface StockBucket {
  tenantId: string;
  opticalCentreId: string;
  variantId: string;
  sku: string;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
  unitCost: number;
}

export class InventoryDomainService {
  private readonly stocks = new Map<string, StockBucket>();
  private readonly reservations = new Map<
    string,
    { key: string; referenceId: string; quantity: number; status: 'RESERVED' | 'COMMITTED' | 'RELEASED' }
  >();

  constructor(private readonly eventBus = new ReliableEventBus()) {
    this.seedCentreStock('tenant-Tilganga-Hospital', 'centre-gaushala-main', 'var-ec-air02-blk', 'EC-AIR02-BLK-M', 24, 1400);
    this.seedCentreStock('tenant-Tilganga-Hospital', 'centre-gaushala-main', 'var-at-03-gld', 'AT-03-GLD-M', 16, 2100);
    this.seedCentreStock('tenant-Tilganga-Hospital', 'centre-gaushala-main', 'var-at-05-brg', 'AT-05-BRG-M', 4, 2400);
    this.seedCentreStock('tenant-Tilganga-Hospital', 'centre-gaushala-main', 'var-rb-3025-gld', 'RB-3025-GLD-L', 9, 8200);
  }

  private makeKey(tenantId: string, centreId: string, variantId: string): string {
    return `${tenantId}::${centreId}::${variantId}`;
  }

  seedCentreStock(
    tenantId: string,
    opticalCentreId: string,
    variantId: string,
    sku: string,
    onHand: number,
    unitCost = 1500,
  ): void {
    const key = this.makeKey(tenantId, opticalCentreId, variantId);
    this.stocks.set(key, {
      tenantId,
      opticalCentreId,
      variantId,
      sku,
      onHand,
      reserved: 0,
      lowStockThreshold: 5,
      unitCost,
    });
  }

  getAvailableQuantity(ctx: TenantContext, variantId: string): number {
    const bucket = this.stocks.get(this.makeKey(ctx.tenantId, ctx.opticalCentreId, variantId));
    if (!bucket) return 0;
    return Math.max(0, bucket.onHand - bucket.reserved);
  }

  reserveStock(
    ctx: TenantContext,
    input: { variantId: string; quantity: number; referenceId: string; correlationId: string },
  ): { reservationId: string; remainingAvailable: number } {
    if (input.quantity <= 0 || !Number.isInteger(input.quantity)) {
      throw new Error('Reservation quantity must be a positive integer.');
    }
    const existing = this.reservations.get(input.referenceId);
    if (existing && existing.status === 'RESERVED') {
      const bucket = this.stocks.get(existing.key)!;
      return {
        reservationId: input.referenceId,
        remainingAvailable: bucket.onHand - bucket.reserved,
      };
    }

    const key = this.makeKey(ctx.tenantId, ctx.opticalCentreId, input.variantId);
    const bucket = this.stocks.get(key);
    if (!bucket) {
      throw new Error(`Variant ${input.variantId} is not stocked at centre ${ctx.opticalCentreId}.`);
    }

    const available = bucket.onHand - bucket.reserved;
    if (available < input.quantity) {
      throw new Error(
        `Insufficient stock for ${bucket.sku}: requested ${input.quantity}, available ${available}.`,
      );
    }

    bucket.reserved += input.quantity;
    this.reservations.set(input.referenceId, {
      key,
      referenceId: input.referenceId,
      quantity: input.quantity,
      status: 'RESERVED',
    });

    const event: DomainEventEnvelope = {
      eventId: `evt-res-${input.referenceId}`,
      eventType: 'StockReserved',
      aggregateId: input.variantId,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      correlationId: input.correlationId,
      producerService: 'inventory-service',
      occurredAt: new Date().toISOString(),
      payload: {
        variantId: input.variantId,
        sku: bucket.sku,
        quantity: input.quantity,
        referenceId: input.referenceId,
        remainingAvailable: bucket.onHand - bucket.reserved,
      },
    };
    this.eventBus.stageInOutbox(event);

    return {
      reservationId: input.referenceId,
      remainingAvailable: bucket.onHand - bucket.reserved,
    };
  }

  commitReservation(ctx: TenantContext, referenceId: string, correlationId: string): void {
    const res = this.reservations.get(referenceId);
    if (!res || res.status !== 'RESERVED') {
      throw new Error(`Active stock reservation ${referenceId} not found.`);
    }
    const bucket = this.stocks.get(res.key)!;
    bucket.reserved -= res.quantity;
    bucket.onHand -= res.quantity;
    res.status = 'COMMITTED';

    this.eventBus.stageInOutbox({
      eventId: `evt-adj-${referenceId}`,
      eventType: 'InventoryAdjusted',
      aggregateId: bucket.variantId,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      correlationId,
      producerService: 'inventory-service',
      occurredAt: new Date().toISOString(),
      payload: {
        variantId: bucket.variantId,
        sku: bucket.sku,
        movement: 'SALE_COMMIT',
        quantityDelta: -res.quantity,
        onHandAfter: bucket.onHand,
      },
    });
  }

  releaseReservation(ctx: TenantContext, referenceId: string, correlationId: string): void {
    const res = this.reservations.get(referenceId);
    if (!res || res.status !== 'RESERVED') return;
    const bucket = this.stocks.get(res.key)!;
    bucket.reserved = Math.max(0, bucket.reserved - res.quantity);
    res.status = 'RELEASED';

    this.eventBus.stageInOutbox({
      eventId: `evt-rel-${referenceId}`,
      eventType: 'StockReleased',
      aggregateId: bucket.variantId,
      tenantId: ctx.tenantId,
      opticalCentreId: ctx.opticalCentreId,
      correlationId,
      producerService: 'inventory-service',
      occurredAt: new Date().toISOString(),
      payload: {
        variantId: bucket.variantId,
        sku: bucket.sku,
        quantityReleased: res.quantity,
        referenceId,
      },
    });
  }

  listCentreInventory(ctx: TenantContext): Array<StockBucket & { available: number; isLowStock: boolean }> {
    const results: Array<StockBucket & { available: number; isLowStock: boolean }> = [];
    for (const bucket of this.stocks.values()) {
      if (bucket.tenantId === ctx.tenantId && bucket.opticalCentreId === ctx.opticalCentreId) {
        const available = bucket.onHand - bucket.reserved;
        results.push({
          ...bucket,
          available,
          isLowStock: available <= bucket.lowStockThreshold,
        });
      }
    }
    return results;
  }
}
