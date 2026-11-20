import type { TenantContext } from '../../../packages/contracts/src/index';

export interface OpticalFrameCatalogEntry {
  id: string;
  variantId: string;
  tenantId: string;
  sku: string;
  barcode: string;
  brand: string;
  name: string;
  color: string;
  shape: string;
  material: string;
  size: string;
  frameWidthMm: number;
  bridgeWidthMm: number;
  templeLengthMm: number;
  weightGrams: number;
  unitPrice: number;
  imageUrl: string;
}

export class CatalogDomainService {
  private readonly frames: OpticalFrameCatalogEntry[] = [
    {
      id: 'atelier-01',
      variantId: 'var-ec-air02-blk',
      tenantId: 'tenant-Tilganga-Hospital',
      sku: 'EC-AIR02-BLK-M',
      barcode: '890123450001',
      brand: 'Eye-Club Clinical Air',
      name: 'Air 02 Beta-Titanium',
      color: 'Matte Obsidian',
      shape: 'Rectangle',
      material: 'Beta-Titanium / TR90',
      size: '52-18-145 (Medium)',
      frameWidthMm: 138,
      bridgeWidthMm: 18,
      templeLengthMm: 145,
      weightGrams: 11.8,
      unitPrice: 2799,
      imageUrl: '/frames/atelier-01.png',
    },
    {
      id: 'atelier-03',
      variantId: 'var-at-03-gld',
      tenantId: 'tenant-Tilganga-Hospital',
      sku: 'AT-03-GLD-M',
      barcode: '890123450003',
      brand: 'Atelier Medical',
      name: 'The Scholar Panto',
      color: 'Brushed Surgical Gold',
      shape: 'Round',
      material: 'Hypoallergenic Titanium',
      size: '49-20-142 (Medium)',
      frameWidthMm: 134,
      bridgeWidthMm: 20,
      templeLengthMm: 142,
      weightGrams: 10.4,
      unitPrice: 4200,
      imageUrl: '/frames/atelier-03.svg',
    },
    {
      id: 'atelier-05',
      variantId: 'var-at-05-brg',
      tenantId: 'tenant-Tilganga-Hospital',
      sku: 'AT-05-BRG-M',
      barcode: '890123450005',
      brand: 'Atelier Studio',
      name: 'The Muse Cat-Eye',
      color: 'Burgundy Acetate',
      shape: 'Cat Eye',
      material: 'Italian Mazzucchelli Acetate',
      size: '51-17-140 (Medium)',
      frameWidthMm: 136,
      bridgeWidthMm: 17,
      templeLengthMm: 140,
      weightGrams: 18.2,
      unitPrice: 4850,
      imageUrl: '/frames/atelier-05.svg',
    },
    {
      id: 'atelier-02',
      variantId: 'var-rb-3025-gld',
      tenantId: 'tenant-Tilganga-Hospital',
      sku: 'RB-3025-GLD-L',
      barcode: '890123450002',
      brand: 'Ray-Ban Medical Sun',
      name: 'Aviator UV400 Polarized',
      color: 'Gold / G-15 Green',
      shape: 'Aviator',
      material: 'Monel Alloy',
      size: '58-14-140 (Large)',
      frameWidthMm: 144,
      bridgeWidthMm: 14,
      templeLengthMm: 140,
      weightGrams: 24.0,
      unitPrice: 15500,
      imageUrl: '/frames/atelier-02.png',
    },
  ];

  listFrames(ctx: TenantContext, query = ''): OpticalFrameCatalogEntry[] {
    const q = query.trim().toLowerCase();
    return this.frames.filter((f) => {
      if (f.tenantId !== ctx.tenantId) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.sku.toLowerCase().includes(q) ||
        f.barcode.includes(q) ||
        f.brand.toLowerCase().includes(q) ||
        f.shape.toLowerCase().includes(q)
      );
    });
  }
}
