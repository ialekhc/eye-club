export type MicroserviceRole =
  | 'api-gateway'
  | 'identity-tenant-service'
  | 'catalog-tryon-service'
  | 'commerce-order-service'
  | 'clinical-store-service'
  | 'pos-lab-service';

export interface MicroserviceDefinition {
  id: MicroserviceRole;
  name: string;
  boundedContext: string;
  defaultPort: number;
  envUrlVar: string;
  routePrefixes: string[];
  ownedEntities: string[];
  description: string;
}

export const MICROSERVICE_REGISTRY: readonly MicroserviceDefinition[] = [
  {
    id: 'api-gateway',
    name: 'API Gateway & Edge Router',
    boundedContext: 'Strict Reverse-Proxy Ingress, JWT Edge Verification & Mesh Telemetry',
    defaultPort: 4000,
    envUrlVar: 'GATEWAY_SERVICE_URL',
    routePrefixes: ['/api/v1/health', '/api/v1/microservices'],
    ownedEntities: ['RateLimitBucket', 'ServiceHealthSnapshot'],
    description:
      'Pure API Gateway process. Owns zero business tables; authenticates edge traffic, assigns correlation IDs, and reverse-proxies requests to isolated downstream microservices (:4001–:4005).',
  },
  {
    id: 'identity-tenant-service',
    name: 'Identity & SaaS Tenant Service',
    boundedContext: 'IAM, Multi-Vendor SaaS Tenancy & Security Audit',
    defaultPort: 4001,
    envUrlVar: 'IDENTITY_SERVICE_URL',
    routePrefixes: ['/api/v1/auth', '/api/v1/users', '/api/v1/vendors', '/api/v1/audit'],
    ownedEntities: ['User', 'RefreshToken', 'Vendor', 'VendorMember', 'AuditLog'],
    description:
      'Isolated IAM & multi-tenant SaaS microservice. Mounts only Auth, Users, Vendors, and Audit modules.',
  },
  {
    id: 'catalog-tryon-service',
    name: 'Catalog & Virtual Try-On Asset Service',
    boundedContext: 'Optical Catalog, Frame Calibrations, Lenses & Embeddable Widget',
    defaultPort: 4002,
    envUrlVar: 'CATALOG_SERVICE_URL',
    routePrefixes: [
      '/api/v1/catalog',
      '/api/v1/lenses',
      '/api/v1/frames',
      '/api/v1/public/catalogue',
      '/api/v1/tryons',
      '/api/v1/widget',
    ],
    ownedEntities: [
      'Product',
      'ProductVariant',
      'ProductImage',
      'Brand',
      'Category',
      'LensType',
      'LensPackage',
      'FrameCalibration',
      'WidgetConfiguration',
    ],
    description:
      'Isolated Catalog & Try-On microservice. Mounts only Catalog, Lenses, Frame Asset, and Widget controllers.',
  },
  {
    id: 'commerce-order-service',
    name: 'Commerce & Order Fulfillment Service',
    boundedContext: 'Shopping Cart, Wishlist, Checkout & Order Lifecycle',
    defaultPort: 4003,
    envUrlVar: 'COMMERCE_SERVICE_URL',
    routePrefixes: ['/api/v1/cart', '/api/v1/wishlist', '/api/v1/orders', '/api/v1/admin'],
    ownedEntities: ['Cart', 'CartItem', 'Wishlist', 'Order', 'OrderItem', 'OrderStatusHistory'],
    description:
      'Isolated E-Commerce microservice. Mounts only Cart, Wishlist, Online Orders, and Admin Fulfillment modules.',
  },
  {
    id: 'clinical-store-service',
    name: 'Clinical Rx & Store Appointments Service',
    boundedContext: 'Optometry Prescriptions, Retail Branches & Eye Exams',
    defaultPort: 4004,
    envUrlVar: 'CLINICAL_SERVICE_URL',
    routePrefixes: ['/api/v1/stores', '/api/v1/appointments', '/api/v1/prescriptions'],
    ownedEntities: ['Store', 'Inventory', 'Appointment', 'Prescription'],
    description:
      'Isolated Clinical & Store Locations microservice. Mounts only Stores, Eye Exam Appointments, and Patient Prescriptions modules.',
  },
  {
    id: 'pos-lab-service',
    name: 'Optical POS & Lab Edging Service',
    boundedContext: 'In-Store Point of Sale, Cashier Shifts & Optical Lab Queue',
    defaultPort: 4005,
    envUrlVar: 'POS_SERVICE_URL',
    routePrefixes: ['/api/v1/pos'],
    ownedEntities: ['PosRegister', 'PosSession', 'Order (POS Channel)', 'LabStatus'],
    description:
      'Isolated Point-of-Sale & Optical Lab microservice. Mounts only POS Registers, Shift Sessions, Counter Checkout, and Lab Queue modules.',
  },
] as const;

export function parseMicroserviceRole(raw?: string): MicroserviceRole {
  const found = MICROSERVICE_REGISTRY.find((s) => s.id === raw);
  return found ? found.id : 'api-gateway';
}

export function getMicroserviceDefinition(role: MicroserviceRole): MicroserviceDefinition {
  return MICROSERVICE_REGISTRY.find((s) => s.id === role) ?? MICROSERVICE_REGISTRY[0]!;
}

export function resolveUpstreamUrl(service: MicroserviceDefinition): string {
  return process.env[service.envUrlVar] || `http://127.0.0.1:${service.defaultPort}`;
}

export function resolveServiceForPath(pathname: string): MicroserviceDefinition {
  const cleanPath = pathname.split('?')[0] ?? '/';
  const normalized = cleanPath.startsWith('/api/v1')
    ? cleanPath
    : `/api/v1${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;

  for (const service of MICROSERVICE_REGISTRY) {
    if (service.id === 'api-gateway') continue;
    if (
      service.routePrefixes.some(
        (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
      )
    ) {
      return service;
    }
  }
  return MICROSERVICE_REGISTRY[0]!;
}

export function isPathAllowedOnMicroservice(role: MicroserviceRole, pathname: string): boolean {
  const cleanPath = pathname.split('?')[0] ?? '/';
  if (cleanPath === '/api/v1/health' || cleanPath.startsWith('/docs')) {
    return true;
  }
  const target = resolveServiceForPath(cleanPath);
  return target.id === role;
}
