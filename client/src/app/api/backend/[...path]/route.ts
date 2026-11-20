import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface DemoSessionRecord {
  id: string;
  registerId: string;
  vendorId: string;
  openedAt: string;
  closedAt?: string | null;
  openingCash: number;
  closingCash?: number | null;
  expectedCash?: number | null;
  cashSales: number;
  cardSales: number;
  digitalSales: number;
  difference?: number | null;
  status: 'OPEN' | 'CLOSED';
}

const seededState = {
  vendors: [
    {
      id: 'vendor-1',
      name: 'Eye-Club Flagship Optics',
      slug: 'eye-club-flagship',
      email: 'ops@eye-club.local',
      phone: '+977-1-4220000',
      taxId: 'PAN-609812345',
      address: 'Durbar Marg, Kathmandu',
      brandColor: '#4f46e5',
      currency: 'NPR',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      commissionRate: 8.5,
      maxStores: 15,
      maxPosRegisters: 30,
      createdAt: '2026-09-01T08:00:00.000Z',
      stores: [
        {
          id: 'store-1',
          vendorId: 'vendor-1',
          name: 'Eye-Club Durbar Marg (Main)',
          address: 'Durbar Marg, Kathmandu',
          phone: '+977-1-4220000',
          openingHours: '10:00 AM - 7:30 PM',
          services: ['Comprehensive Eye Exam', 'Optical Dispensary', 'Contact Lens Studio'],
          posRegisters: [
            {
              id: 'reg-1',
              vendorId: 'vendor-1',
              storeId: 'store-1',
              name: 'Counter #1 - Main Optical POS',
              isActive: true,
            },
            {
              id: 'reg-2',
              vendorId: 'vendor-1',
              storeId: 'store-1',
              name: 'Counter #2 - Express Pickup & Rx',
              isActive: true,
            },
          ],
        },
      ],
      members: [
        {
          id: 'mem-1',
          vendorId: 'vendor-1',
          role: 'VENDOR_OWNER',
          user: {
            id: 'user-admin-1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@eye-club.local',
            role: 'SUPER_ADMIN',
          },
          store: { id: 'store-1', name: 'Eye-Club Durbar Marg (Main)' },
        },
        {
          id: 'mem-2',
          vendorId: 'vendor-1',
          role: 'CASHIER',
          user: {
            id: 'user-cashier-1',
            firstName: 'Nisha',
            lastName: 'Thapa',
            email: 'cashier@eye-club.local',
            role: 'CASHIER',
          },
          store: { id: 'store-1', name: 'Eye-Club Durbar Marg (Main)' },
        },
        {
          id: 'mem-3',
          vendorId: 'vendor-1',
          role: 'OPTOMETRIST',
          user: {
            id: 'user-optom-1',
            firstName: 'Dr. Suman',
            lastName: 'Karki',
            email: 'optometrist@eye-club.local',
            role: 'OPTOMETRIST',
          },
          store: { id: 'store-1', name: 'Eye-Club Durbar Marg (Main)' },
        },
      ],
      _count: { stores: 1, products: 4, orders: 2, posRegisters: 2 },
      metrics: { totalRevenue: 14500, collectedRevenue: 7500 },
    },
    {
      id: 'vendor-2',
      name: 'Himalayan Vision Clinic',
      slug: 'himalayan-vision',
      email: 'care@himalayanvision.np',
      phone: '+977-1-5541122',
      taxId: 'PAN-304981122',
      address: 'Jhamsikhel, Lalitpur',
      brandColor: '#0d9488',
      currency: 'NPR',
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      commissionRate: 10.0,
      maxStores: 5,
      maxPosRegisters: 10,
      createdAt: '2026-09-15T10:30:00.000Z',
      stores: [
        {
          id: 'store-2',
          vendorId: 'vendor-2',
          name: 'Himalayan Vision Jhamsikhel',
          address: 'Jhamsikhel Road, Lalitpur',
          phone: '+977-1-5541122',
          openingHours: '9:30 AM - 6:30 PM',
          services: ['Clinical Optometry', 'Optical Lab'],
          posRegisters: [
            {
              id: 'reg-3',
              vendorId: 'vendor-2',
              storeId: 'store-2',
              name: 'Clinic Dispensary POS #1',
              isActive: true,
            },
          ],
        },
      ],
      members: [],
      _count: { stores: 1, products: 2, orders: 0, posRegisters: 1 },
      metrics: { totalRevenue: 0, collectedRevenue: 0 },
    },
  ],
  posSessions: [
    {
      id: 'sess-demo-1',
      registerId: 'reg-1',
      vendorId: 'vendor-1',
      openedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      openingCash: 5000,
      cashSales: 2500,
      cardSales: 5000,
      digitalSales: 0,
      status: 'OPEN',
    },
  ] as DemoSessionRecord[],
  products: [
    {
      id: 'prod-ec-air02',
      vendorId: 'vendor-1',
      name: 'Eye-Club Air 02',
      slug: 'eye-club-air-02',
      skuBase: 'EC-AIR02',
      basePrice: 2799,
      status: 'PUBLISHED',
      frameShape: 'Rectangle',
      frameType: 'Full Rim',
      material: 'TR90',
      category: { id: 'cat-1', name: 'Eyeglasses', slug: 'eyeglasses' },
      brand: { id: 'brand-1', name: 'Eye-Club Air' },
      variants: [
        {
          id: 'var-ec-air02-blk',
          sku: 'EC-AIR02-BLK-M',
          color: 'Matte Black',
          size: 'Medium',
          price: 2799,
          images: [{ url: '/frames/atelier-01.png' }],
          inventory: [{ storeId: 'store-1', availableQuantity: 34 }],
        },
      ],
    },
    {
      id: 'prod-rb-aviator',
      vendorId: 'vendor-1',
      name: 'Ray-Ban Aviator Classic',
      slug: 'ray-ban-aviator-classic',
      skuBase: 'RB-3025',
      basePrice: 15500,
      status: 'PUBLISHED',
      frameShape: 'Aviator',
      frameType: 'Full Rim',
      material: 'Metal',
      category: { id: 'cat-2', name: 'Sunglasses', slug: 'sunglasses' },
      brand: { id: 'brand-2', name: 'Ray-Ban' },
      variants: [
        {
          id: 'var-rb-3025-gld',
          sku: 'RB-3025-GLD-L',
          color: 'Gold / Green',
          size: 'Large',
          price: 15500,
          images: [{ url: '/frames/atelier-02.png' }],
          inventory: [{ storeId: 'store-1', availableQuantity: 12 }],
        },
      ],
    },
    {
      id: 'prod-scholar',
      vendorId: 'vendor-1',
      name: 'Atelier 03 - The Scholar',
      slug: 'atelier-03-scholar',
      skuBase: 'AT-03',
      basePrice: 4200,
      status: 'PUBLISHED',
      frameShape: 'Round',
      frameType: 'Full Rim',
      material: 'Brushed Stainless',
      category: { id: 'cat-1', name: 'Eyeglasses', slug: 'eyeglasses' },
      brand: { id: 'brand-3', name: 'Atelier Studio' },
      variants: [
        {
          id: 'var-at-03-gld',
          sku: 'AT-03-GLD-M',
          color: 'Brushed Gold',
          size: 'Medium',
          price: 4200,
          images: [{ url: '/frames/atelier-03.svg' }],
          inventory: [{ storeId: 'store-1', availableQuantity: 25 }],
        },
      ],
    },
    {
      id: 'prod-muse',
      vendorId: 'vendor-1',
      name: 'Atelier 05 - The Muse Cat-Eye',
      slug: 'atelier-05-muse',
      skuBase: 'AT-05',
      basePrice: 4850,
      status: 'PUBLISHED',
      frameShape: 'Cat Eye',
      frameType: 'Full Rim',
      material: 'Italian Acetate',
      category: { id: 'cat-1', name: 'Eyeglasses', slug: 'eyeglasses' },
      brand: { id: 'brand-3', name: 'Atelier Studio' },
      variants: [
        {
          id: 'var-at-05-brg',
          sku: 'AT-05-BRG-M',
          color: 'Burgundy Tortoise',
          size: 'Medium',
          price: 4850,
          images: [{ url: '/frames/atelier-05.svg' }],
          inventory: [{ storeId: 'store-1', availableQuantity: 19 }],
        },
      ],
    },
  ],
  lensTypes: [
    {
      id: 'lt-1',
      name: 'Single Vision',
      packages: [
        {
          id: 'lens-sv-essential',
          name: 'Essential Anti-Glare (1.50)',
          price: 999,
          index: 1.5,
          features: ['Scratch Resistant', 'Standard Anti-Reflective'],
        },
        {
          id: 'lens-sv-comfort',
          name: 'Comfort Blue-Protect (1.60)',
          price: 1999,
          index: 1.6,
          features: ['20% Thinner', 'Blue-Light Protection', 'Hydrophobic Coating'],
        },
        {
          id: 'lens-sv-highindex',
          name: 'Ultra-Thin High Index (1.67)',
          price: 3499,
          index: 1.67,
          features: ['35% Thinner for High Power', 'Aspheric Design'],
        },
      ],
    },
    {
      id: 'lt-2',
      name: 'Progressive (Multifocal)',
      packages: [
        {
          id: 'lens-prog-wide',
          name: 'Digital Freeform Progressive (1.60)',
          price: 5800,
          index: 1.6,
          features: ['Seamless Distance + Near', 'Wide Corridor', 'Blue-Cut'],
        },
      ],
    },
  ],
  posOrders: [
    {
      id: 'pos-ord-1',
      orderNumber: 'POS-842109-312',
      vendorId: 'vendor-1',
      storeId: 'store-1',
      posRegisterId: 'reg-1',
      customerName: 'Ramesh Adhikari',
      customerPhone: '+977-9841223344',
      subtotal: 4798,
      discount: 298,
      taxAmount: 0,
      totalAmount: 4500,
      paidAmount: 2500,
      balanceDue: 2000,
      paymentMethod: 'CASH',
      paymentStatus: 'PARTIALLY_PAID',
      paymentBreakdown: { cash: 2500, changeGiven: 0 },
      labStatus: 'IN_LAB',
      status: 'LENS_PROCESSING',
      notes: 'Priority edging — customer traveling Friday.',
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      store: { id: 'store-1', name: 'Eye-Club Durbar Marg (Main)' },
      vendor: { id: 'vendor-1', name: 'Eye-Club Flagship Optics', currency: 'NPR' },
      items: [
        {
          id: 'item-1',
          productVariantId: 'var-ec-air02-blk',
          productName: 'Eye-Club Air 02 (Matte Black)',
          sku: 'EC-AIR02-BLK-M',
          quantity: 1,
          unitPrice: 2799,
          lensPackageId: 'lens-sv-comfort',
          lensPackageName: 'Comfort Blue-Protect (1.60)',
          lensPrice: 1999,
          totalPrice: 4798,
          prescriptionData: {
            odSph: '-1.75',
            odCyl: '-0.50',
            odAxis: '90',
            odAdd: '',
            osSph: '-2.00',
            osCyl: '-0.25',
            osAxis: '85',
            osAdd: '',
            pd: '63',
            lensType: 'Single Vision',
            coating: 'Blue-Cut + Hydrophobic',
            doctorName: 'Dr. Suman Karki',
          },
        },
      ],
      statusHistory: [],
    },
  ],
};

async function handleSeededFallback(
  method: string,
  path: string[],
  url: URL,
  bodyText: string,
  userEmail?: string | null,
): Promise<Response> {
  const joined = '/' + path.join('/');
  const body = bodyText ? JSON.parse(bodyText) : {};

  if (joined === '/microservices/topology' && method === 'GET') {
    return Response.json({
      architecture: 'microservices',
      activeNodeRole: 'api-gateway',
      communicationPattern: 'HTTP/REST via API Gateway + Shared JWT Security Context',
      services: [
        {
          id: 'api-gateway',
          name: 'API Gateway & Edge Router',
          boundedContext: 'Edge Routing, Auth Verification, Rate Limiting & Telemetry',
          defaultPort: 4000,
          configuredEndpoint: 'http://localhost:4000',
          routePrefixes: ['/api/v1/health', '/api/v1/microservices'],
          ownedEntities: ['RateLimitBucket', 'ServiceHealthSnapshot'],
          description: 'Unified ingress gateway enforcing JWT validation, correlation IDs, CORS, rate limits, and routing to domain microservices.',
        },
        {
          id: 'identity-tenant-service',
          name: 'Identity & SaaS Tenant Service',
          boundedContext: 'IAM, Multi-Vendor SaaS Tenancy & Security Audit',
          defaultPort: 4001,
          configuredEndpoint: 'http://localhost:4001',
          routePrefixes: ['/api/v1/auth', '/api/v1/users', '/api/v1/vendors', '/api/v1/audit'],
          ownedEntities: ['User', 'RefreshToken', 'Vendor', 'VendorMember', 'AuditLog'],
          description: 'Manages user authentication, Argon2id credentials, refresh token rotation, SaaS vendor onboarding, subscription plans, and audit trails.',
        },
        {
          id: 'catalog-tryon-service',
          name: 'Catalog & Virtual Try-On Asset Service',
          boundedContext: 'Optical Catalog, Frame Calibrations, Lenses & Embeddable Widget',
          defaultPort: 4002,
          configuredEndpoint: 'http://localhost:4002',
          routePrefixes: ['/api/v1/catalog', '/api/v1/lenses', '/api/v1/frames', '/api/v1/public/catalogue', '/api/v1/tryons', '/api/v1/widget'],
          ownedEntities: ['Product', 'ProductVariant', 'Brand', 'Category', 'LensType', 'LensPackage', 'FrameCalibration', 'WidgetConfiguration'],
          description: 'Serves optical frame catalogs, lens packages, transparent frame overlays, anchor calibration coordinates, and widget configurations.',
        },
        {
          id: 'commerce-order-service',
          name: 'Commerce & Order Fulfillment Service',
          boundedContext: 'Shopping Cart, Wishlist, Checkout & Order Lifecycle',
          defaultPort: 4003,
          configuredEndpoint: 'http://localhost:4003',
          routePrefixes: ['/api/v1/cart', '/api/v1/wishlist', '/api/v1/orders', '/api/v1/admin'],
          ownedEntities: ['Cart', 'CartItem', 'Wishlist', 'Order', 'OrderItem', 'OrderStatusHistory'],
          description: 'Handles customer shopping carts, wishlists, online checkout transactions, stock reservation, and back-office order fulfillment.',
        },
        {
          id: 'clinical-store-service',
          name: 'Clinical Rx & Store Appointments Service',
          boundedContext: 'Optometry Prescriptions, Retail Branches & Eye Exams',
          defaultPort: 4004,
          configuredEndpoint: 'http://localhost:4004',
          routePrefixes: ['/api/v1/stores', '/api/v1/appointments', '/api/v1/prescriptions'],
          ownedEntities: ['Store', 'Inventory', 'Appointment', 'Prescription'],
          description: 'Manages physical optical store branches, 12-step eye examination scheduling, and patient OD/OS diopter & PD prescriptions.',
        },
        {
          id: 'pos-lab-service',
          name: 'Optical POS & Lab Edging Service',
          boundedContext: 'In-Store Point of Sale, Cashier Shifts & Optical Lab Queue',
          defaultPort: 4005,
          configuredEndpoint: 'http://localhost:4005',
          routePrefixes: ['/api/v1/pos'],
          ownedEntities: ['PosRegister', 'PosSession', 'Order (POS Channel)', 'LabStatus'],
          description: 'Powers retail counter registers, cashier cash-drawer shift reconciliation, split/deposit tenders, and optical lab lens edging workflows.',
        },
      ],
    });
  }

  if (joined === '/microservices/health' && method === 'GET') {
    return Response.json({
      timestamp: new Date().toISOString(),
      overallStatus: 'HEALTHY',
      databaseConnected: true,
      services: [
        { id: 'api-gateway', name: 'API Gateway & Edge Router', boundedContext: 'Edge Routing & Telemetry', port: 4000, endpoint: 'http://localhost:4000', mode: 'active-mesh', status: 'HEALTHY', latencyMs: 1, routePrefixes: ['/api/v1/health', '/api/v1/microservices'] },
        { id: 'identity-tenant-service', name: 'Identity & SaaS Tenant Service', boundedContext: 'IAM & Multi-Vendor Tenancy', port: 4001, endpoint: 'http://localhost:4001', mode: 'active-mesh', status: 'HEALTHY', latencyMs: 2, routePrefixes: ['/api/v1/auth', '/api/v1/users', '/api/v1/vendors', '/api/v1/audit'] },
        { id: 'catalog-tryon-service', name: 'Catalog & Virtual Try-On Asset Service', boundedContext: 'Catalog, Lenses & Try-On Assets', port: 4002, endpoint: 'http://localhost:4002', mode: 'active-mesh', status: 'HEALTHY', latencyMs: 2, routePrefixes: ['/api/v1/catalog', '/api/v1/lenses', '/api/v1/frames', '/api/v1/tryons'] },
        { id: 'commerce-order-service', name: 'Commerce & Order Fulfillment Service', boundedContext: 'Cart, Checkout & Orders', port: 4003, endpoint: 'http://localhost:4003', mode: 'active-mesh', status: 'HEALTHY', latencyMs: 3, routePrefixes: ['/api/v1/cart', '/api/v1/wishlist', '/api/v1/orders', '/api/v1/admin'] },
        { id: 'clinical-store-service', name: 'Clinical Rx & Store Appointments Service', boundedContext: 'Stores, Exams & Prescriptions', port: 4004, endpoint: 'http://localhost:4004', mode: 'active-mesh', status: 'HEALTHY', latencyMs: 2, routePrefixes: ['/api/v1/stores', '/api/v1/appointments', '/api/v1/prescriptions'] },
        { id: 'pos-lab-service', name: 'Optical POS & Lab Edging Service', boundedContext: 'POS Registers, Shifts & Lab Queue', port: 4005, endpoint: 'http://localhost:4005', mode: 'active-mesh', status: 'HEALTHY', latencyMs: 1, routePrefixes: ['/api/v1/pos'] },
      ],
    });
  }

  if (joined === '/vendors' && method === 'GET') {
    return Response.json(seededState.vendors);
  }

  if (joined === '/vendors' && method === 'POST') {
    const vendorId = `vendor-${Date.now()}`;
    const storeId = `store-${Date.now()}`;
    const regId = `reg-${Date.now()}`;
    const created = {
      id: vendorId,
      name: body.name || 'New Optical Vendor',
      slug: body.slug || `vendor-${Date.now()}`,
      email: body.email || 'vendor@eye-club.local',
      phone: body.phone || '',
      taxId: body.taxId || '',
      address: body.address || 'Kathmandu',
      brandColor: body.brandColor || '#4f46e5',
      currency: 'NPR',
      plan: body.plan || 'PROFESSIONAL',
      status: 'ACTIVE',
      commissionRate: Number(body.commissionRate ?? 10),
      maxStores: 5,
      maxPosRegisters: 10,
      createdAt: new Date().toISOString(),
      stores: [
        {
          id: storeId,
          vendorId,
          name: body.primaryStoreName || `${body.name} - Main Branch`,
          address: body.address || 'Kathmandu',
          phone: body.phone || '',
          openingHours: '10:00 AM - 7:00 PM',
          services: ['Eye Exam', 'Optical Dispensary'],
          posRegisters: [
            {
              id: regId,
              vendorId,
              storeId,
              name: 'Counter #1 - Main POS',
              isActive: true,
            },
          ],
        },
      ],
      members: [],
      _count: { stores: 1, products: 0, orders: 0, posRegisters: 1 },
      metrics: { totalRevenue: 0, collectedRevenue: 0 },
    };
    seededState.vendors.unshift(created);
    return Response.json(created, { status: 201 });
  }

  if (path[0] === 'vendors' && path[1] && !path[2] && method === 'PATCH') {
    const v = seededState.vendors.find((item) => item.id === path[1]);
    if (v) Object.assign(v, body);
    return Response.json(v ?? {});
  }

  if (path[0] === 'vendors' && path[1] && path[2] === 'stores' && method === 'POST') {
    const v = seededState.vendors.find((item) => item.id === path[1]);
    if (v) {
      const storeId = `store-${Date.now()}`;
      const newStore = {
        id: storeId,
        vendorId: v.id,
        name: body.name,
        address: body.address,
        phone: body.phone || '',
        openingHours: '10:00 AM - 7:00 PM',
        services: ['Eye Exam', 'Optical Dispensary'],
        posRegisters: [
          {
            id: `reg-${Date.now()}`,
            vendorId: v.id,
            storeId,
            name: body.registerName || 'Counter #1 - Main POS',
            isActive: true,
          },
        ],
      };
      v.stores.push(newStore);
      v._count.stores = v.stores.length;
      return Response.json(newStore, { status: 201 });
    }
  }

  if (path[0] === 'vendors' && path[1] && path[2] === 'members' && method === 'POST') {
    const v = seededState.vendors.find((item) => item.id === path[1]);
    const token = `inv-${Date.now()}`;
    if (v) {
      v.members.push({
        id: `mem-${Date.now()}`,
        vendorId: v.id,
        role: body.role || 'CASHIER',
        user: {
          id: `u-${Date.now()}`,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          role: body.role || 'CASHIER',
        },
        store: v.stores[0] ? { id: v.stores[0].id, name: v.stores[0].name } : { id: 'store-1', name: 'Main Branch' },
      });
    }
    return Response.json({ invitationToken: token }, { status: 201 });
  }

  if (joined === '/pos/registers' && method === 'GET') {
    const vendorId = url.searchParams.get('vendorId');
    const storeId = url.searchParams.get('storeId');
    const allRegisters = seededState.vendors.flatMap((v) =>
      v.stores.flatMap((s) =>
        s.posRegisters.map((r) => ({
          ...r,
          vendor: { id: v.id, name: v.name, slug: v.slug, currency: v.currency, brandColor: v.brandColor },
          store: { id: s.id, name: s.name, address: s.address, phone: s.phone },
          sessions: seededState.posSessions.filter(
            (sess) => sess.registerId === r.id && sess.status === 'OPEN',
          ),
        })),
      ),
    );
    return Response.json(
      allRegisters.filter(
        (r) => (!vendorId || r.vendorId === vendorId) && (!storeId || r.storeId === storeId),
      ),
    );
  }

  if (joined === '/pos/sessions/open' && method === 'POST') {
    const existing = seededState.posSessions.find(
      (s) => s.registerId === body.registerId && s.status === 'OPEN',
    );
    if (existing) return Response.json(existing);
    const created: DemoSessionRecord = {
      id: `sess-${Date.now()}`,
      registerId: body.registerId,
      vendorId: body.vendorId,
      openedAt: new Date().toISOString(),
      openingCash: Number(body.openingCash ?? 0),
      cashSales: 0,
      cardSales: 0,
      digitalSales: 0,
      status: 'OPEN',
    };
    seededState.posSessions.push(created);
    return Response.json(created, { status: 201 });
  }

  if (path[0] === 'pos' && path[1] === 'sessions' && path[2] && path[3] === 'close' && method === 'POST') {
    const sess = seededState.posSessions.find((s) => s.id === path[2]);
    if (sess) {
      sess.status = 'CLOSED';
      sess.closedAt = new Date().toISOString();
      sess.closingCash = Number(body.closingCash ?? 0);
      sess.expectedCash = sess.openingCash + sess.cashSales;
      sess.difference = sess.closingCash - sess.expectedCash;
    }
    return Response.json(sess ?? {});
  }

  if (joined === '/pos/catalog' && method === 'GET') {
    return Response.json({
      products: seededState.products,
      lensTypes: seededState.lensTypes,
    });
  }

  if (joined === '/pos/orders' && method === 'GET') {
    return Response.json(seededState.posOrders);
  }

  if (joined === '/pos/checkout' && method === 'POST') {
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = items.reduce(
      (acc: number, item: { unitPrice: number; lensPrice?: number; quantity: number }) =>
        acc + (Number(item.unitPrice) + Number(item.lensPrice ?? 0)) * Number(item.quantity),
      0,
    );
    const discount = Number(body.discount ?? 0);
    const taxAmount = Number(body.taxAmount ?? 0);
    const totalAmount = Math.max(0, subtotal - discount + taxAmount);
    const paidAmount = Math.min(totalAmount, Number(body.paidAmount ?? totalAmount));
    const balanceDue = Math.max(0, totalAmount - paidAmount);
    const requiresLab = items.some(
      (item: { lensPackageId?: string; prescriptionData?: unknown }) =>
        Boolean(item.lensPackageId) || Boolean(item.prescriptionData),
    );

    const newOrder = {
      id: `pos-ord-${Date.now()}`,
      orderNumber: `POS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      vendorId: body.vendorId || 'vendor-1',
      storeId: body.storeId || 'store-1',
      posRegisterId: body.posRegisterId || 'reg-1',
      customerName: body.customerName || 'Walk-in Customer',
      customerPhone: body.customerPhone || '',
      subtotal,
      discount,
      taxAmount,
      totalAmount,
      paidAmount,
      balanceDue,
      paymentMethod: body.paymentMethod || 'CASH',
      paymentStatus: balanceDue <= 0 ? 'COMPLETED' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING',
      paymentBreakdown: body.paymentBreakdown || { cash: paidAmount, changeGiven: 0 },
      labStatus: requiresLab ? 'PENDING_LAB' : 'DELIVERED',
      status: requiresLab ? 'LENS_PROCESSING' : 'DELIVERED',
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
      store: { id: 'store-1', name: 'Eye-Club Durbar Marg (Main)' },
      vendor: { id: 'vendor-1', name: 'Eye-Club Flagship Optics', currency: 'NPR' },
      items: items.map((item: Record<string, unknown>, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        ...item,
        totalPrice:
          (Number(item.unitPrice ?? 0) + Number(item.lensPrice ?? 0)) * Number(item.quantity ?? 1),
      })),
      statusHistory: [],
    };
    seededState.posOrders.unshift(newOrder as (typeof seededState.posOrders)[0]);
    return Response.json(newOrder, { status: 201 });
  }

  if (path[0] === 'pos' && path[1] === 'orders' && path[2] && path[3] === 'status' && method === 'PATCH') {
    const ord = seededState.posOrders.find((o) => o.id === path[2]);
    if (ord) {
      if (body.labStatus) ord.labStatus = body.labStatus;
      if (body.collectBalance) {
        ord.paidAmount = ord.totalAmount;
        ord.balanceDue = 0;
        ord.paymentStatus = 'COMPLETED';
      }
    }
    return Response.json(ord ?? {});
  }

  if (joined === '/admin/dashboard' && method === 'GET') {
    return Response.json({
      metrics: {
        totalOrders: seededState.posOrders.length,
        totalProducts: seededState.products.length,
        totalUsers: 5,
        revenue: seededState.posOrders.reduce((sum, o) => sum + o.paidAmount, 0),
      },
      recentOrders: seededState.posOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: String(o.totalAmount),
      })),
    });
  }

  if (joined === '/admin/products' && method === 'GET') {
    return Response.json(seededState.products);
  }

  if (joined === '/admin/orders' && method === 'GET') {
    return Response.json(seededState.posOrders);
  }

  if (joined === '/admin/analytics' && method === 'GET') {
    return Response.json({
      windowDays: 30,
      totals: { events: 24, sessions: 12, favorites: 6, productClicks: 9 },
      mostSelected: [{ eyewearId: 'atelier-01', selections: 14 }],
    });
  }

  if (joined === '/admin/widgets' && method === 'GET') {
    return Response.json([]);
  }

  if (joined === '/stores' && method === 'GET') {
    return Response.json(seededState.vendors.flatMap((v) => v.stores));
  }

  if (joined === '/catalog/categories' && method === 'GET') {
    return Response.json([
      { id: 'cat-1', name: 'Eyeglasses', slug: 'eyeglasses' },
      { id: 'cat-2', name: 'Sunglasses', slug: 'sunglasses' },
    ]);
  }

  if (joined === '/catalog/brands' && method === 'GET') {
    return Response.json([
      { id: 'brand-1', name: 'Eye-Club Air' },
      { id: 'brand-2', name: 'Ray-Ban' },
      { id: 'brand-3', name: 'Atelier Studio' },
    ]);
  }

  if (joined === '/users/profile' && method === 'GET') {
    return Response.json({
      firstName: 'Demo',
      lastName: 'User',
      email: userEmail || 'admin@eye-club.local',
      phone: '+977-9800000000',
    });
  }

  if (['/cart', '/orders', '/prescriptions', '/wishlist', '/appointments/me'].includes(joined) && method === 'GET') {
    return Response.json([]);
  }

  return Response.json({ ok: true });
}

function resolveTargetMicroserviceOrigin(path: string[]): { serviceId: string; origin: string } {
  const first = path[0] ?? '';
  const defaultGateway =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  if (['auth', 'users', 'vendors', 'audit'].includes(first)) {
    return {
      serviceId: 'identity-tenant-service',
      origin: process.env.IDENTITY_SERVICE_URL || defaultGateway,
    };
  }
  if (['catalog', 'lenses', 'frames', 'public', 'tryons', 'widget'].includes(first)) {
    return {
      serviceId: 'catalog-tryon-service',
      origin: process.env.CATALOG_SERVICE_URL || defaultGateway,
    };
  }
  if (['cart', 'wishlist', 'orders', 'admin'].includes(first)) {
    return {
      serviceId: 'commerce-order-service',
      origin: process.env.COMMERCE_SERVICE_URL || defaultGateway,
    };
  }
  if (['stores', 'appointments', 'prescriptions'].includes(first)) {
    return {
      serviceId: 'clinical-store-service',
      origin: process.env.CLINICAL_SERVICE_URL || defaultGateway,
    };
  }
  if (first === 'pos') {
    return {
      serviceId: 'pos-lab-service',
      origin: process.env.POS_SERVICE_URL || defaultGateway,
    };
  }
  return {
    serviceId: 'api-gateway',
    origin: defaultGateway,
  };
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  if (
    !['GET', 'HEAD'].includes(request.method) &&
    request.headers.get('origin') &&
    request.headers.get('origin') !== new URL(request.url).origin
  ) {
    return Response.json({ message: 'Origin not allowed.' }, { status: 403 });
  }
  const { path } = await context.params;
  if (path.some((segment) => !/^[a-zA-Z0-9_-]+$/.test(segment))) {
    return Response.json({ message: 'Invalid API path.' }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  const { serviceId, origin } = resolveTargetMicroserviceOrigin(path);
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Microservice-Target': serviceId,
  });
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  const bodyText = ['GET', 'HEAD'].includes(request.method) ? '' : await request.text();
  try {
    const response = await fetch(
      `${origin}/api/v1/${path.map(encodeURIComponent).join('/')}${new URL(request.url).search}`,
      {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : bodyText,
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      },
    );
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'no-store',
        'X-Microservice-Target': serviceId,
      },
    });
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      return handleSeededFallback(
        request.method,
        path,
        new URL(request.url),
        bodyText,
        session?.user?.email,
      );
    }
    return Response.json(
      { message: 'The application service is unavailable. Please retry shortly.' },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
