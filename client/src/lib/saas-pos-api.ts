import { commerceRequest, jsonBody } from './commerce-api';

export type SaaSTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type VendorStatus = 'ACTIVE' | 'TRIALING' | 'SUSPENDED';
export type StaffRole =
  | 'VENDOR_OWNER'
  | 'STORE_MANAGER'
  | 'OPTOMETRIST'
  | 'CASHIER'
  | 'INVENTORY_MANAGER';

export type PaymentMethodType =
  | 'CASH'
  | 'CARD'
  | 'SPLIT'
  | 'ESEWA'
  | 'KHALTI'
  | 'INSURANCE';

export type LabStatusType =
  | 'NONE'
  | 'PENDING_LAB'
  | 'IN_LAB'
  | 'QUALITY_CHECK'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED';

export interface PosSessionRecord {
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
  notes?: string;
  cashier?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PosRegisterRecord {
  id: string;
  vendorId: string;
  storeId: string;
  name: string;
  isActive: boolean;
  store?: {
    id: string;
    name: string;
    address: string;
    phone?: string;
  };
  vendor?: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    brandColor: string;
  };
  sessions?: PosSessionRecord[];
}

export interface StoreBranchRecord {
  id: string;
  vendorId: string;
  name: string;
  address: string;
  phone?: string;
  openingHours?: string;
  services: string[];
  posRegisters: PosRegisterRecord[];
}

export interface VendorMemberRecord {
  id: string;
  vendorId: string;
  role: StaffRole;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  store?: {
    id: string;
    name: string;
  } | null;
}

export interface VendorRecord {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  taxId?: string;
  address?: string;
  brandColor: string;
  currency: string;
  plan: SaaSTier;
  status: VendorStatus;
  commissionRate: number;
  maxStores: number;
  maxPosRegisters: number;
  createdAt: string;
  stores: StoreBranchRecord[];
  members: VendorMemberRecord[];
  _count: {
    stores: number;
    products: number;
    orders: number;
    posRegisters: number;
  };
  metrics: {
    totalRevenue: number;
    collectedRevenue: number;
  };
}

export interface PosPrescriptionData {
  odSph: string;
  odCyl: string;
  odAxis: string;
  odAdd: string;
  osSph: string;
  osCyl: string;
  osAxis: string;
  osAdd: string;
  pd: string;
  lensType: string;
  coating: string;
  doctorName?: string;
  notes?: string;
}

export interface PosCatalogProduct {
  id: string;
  vendorId?: string | null;
  name: string;
  slug: string;
  skuBase: string;
  basePrice: number;
  frameShape: string;
  frameType: string;
  material: string;
  category: { name: string; slug: string };
  brand: { name: string };
  variants: Array<{
    id: string;
    sku: string;
    color: string;
    size: string;
    price?: number;
    stock: number;
    imageUrl: string;
  }>;
}

export interface PosLensPackageOption {
  id: string;
  lensTypeName: string;
  name: string;
  price: number;
  index: number;
  features: string[];
}

export interface PosOrderItemRecord {
  id: string;
  productVariantId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lensPackageId?: string;
  lensPackageName?: string;
  lensPrice: number;
  totalPrice: number;
  prescriptionData?: PosPrescriptionData | null;
}

export interface PosOrderRecord {
  id: string;
  orderNumber: string;
  vendorId: string;
  storeId: string;
  posRegisterId?: string;
  posSessionId?: string;
  customerName: string;
  customerPhone?: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'COMPLETED';
  paymentBreakdown?: {
    cash?: number;
    card?: number;
    digital?: number;
    insurance?: number;
    changeGiven?: number;
  };
  labStatus: LabStatusType;
  notes?: string;
  createdAt: string;
  items: PosOrderItemRecord[];
  store?: { id: string; name: string };
  vendor?: { id: string; name: string; currency: string };
}


function normalize<T>(value: T): T {
  if (Array.isArray(value)) return value.map(normalize) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, field]) => [key, ['basePrice','price','lensPrice','unitPrice','totalPrice','subtotal','discount','taxAmount','totalAmount','paidAmount','balanceDue','commissionRate','openingCash','cashSales','cardSales','digitalSales','closingCash','expectedCash','difference'].includes(key) && field !== null ? Number(field) : normalize(field)])) as T;
  return value;
}
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> { return normalize(await commerceRequest<T>(path, { method, ...(body ? { body: jsonBody(body) } : {}) })); }
export const fetchSaasVendors = () => request<VendorRecord[]>('/vendors');
export const createSaasVendor = (input: { name: string; slug: string; email: string; phone?: string; taxId?: string; address?: string; brandColor?: string; plan: SaaSTier; commissionRate: number; primaryStoreName?: string }) => request<VendorRecord>('/vendors', 'POST', input);
export async function updateSaasVendorStatusOrPlan(id: string, patch: Partial<Pick<VendorRecord, 'plan' | 'status' | 'commissionRate'>>) { await request(`/vendors/${id}`, 'PATCH', patch); return fetchSaasVendors(); }
export async function addVendorBranch(id: string, input: { name: string; address: string; phone?: string; registerName?: string }) { await request(`/vendors/${id}/stores`, 'POST', input); return fetchSaasVendors(); }
export async function addVendorStaffMember(id: string, input: { firstName: string; lastName: string; email: string; role: StaffRole; storeId?: string }) { const member = await request<{ invitationToken: string }>(`/vendors/${id}/members`, 'POST', input); return { vendors: await fetchSaasVendors(), token: member.invitationToken }; }
export function fetchPosOrders(vendorId?: string, storeId?: string) { const query = new URLSearchParams(); if(vendorId) query.set('vendorId',vendorId); if(storeId) query.set('storeId',storeId); return request<PosOrderRecord[]>(`/pos/orders?${query}`); }
export const submitPosOrder = (input: {
  vendorId: string; storeId: string; posRegisterId?: string; posSessionId?: string; customerName: string; customerPhone?: string;
  items: Array<{ productVariantId: string; productName: string; sku: string; quantity: number; unitPrice: number; lensPackageId?: string; lensPackageName?: string; lensPrice: number; prescriptionData?: PosPrescriptionData }>;
  discount: number; taxAmount: number; paymentMethod: PaymentMethodType; paidAmount: number; paymentBreakdown?: { cash?: number; card?: number; digital?: number; insurance?: number; changeGiven?: number }; notes?: string;
}) => request<PosOrderRecord>('/pos/checkout', 'POST', input);
export async function updatePosOrderLabStatus(id: string, input: { labStatus?: LabStatusType; collectBalance?: boolean; collectionSessionId?: string }, vendorId?: string, storeId?: string) { await request(`/pos/orders/${id}/status`, 'PATCH', input); return fetchPosOrders(vendorId, storeId); }
export const openPosSession = (input: { registerId: string; vendorId: string; storeId: string; openingCash: number }) => request<PosSessionRecord>('/pos/sessions/open', 'POST', input);
export const closePosSession = (id: string, closingCash: number) => request<PosSessionRecord>(`/pos/sessions/${id}/close`, 'POST', { closingCash });
export const fetchPosRegisters = (vendorId: string, storeId: string) => request<PosRegisterRecord[]>(`/pos/registers?vendorId=${encodeURIComponent(vendorId)}&storeId=${encodeURIComponent(storeId)}`);
export async function fetchPosCatalog(vendorId: string, storeId: string): Promise<{ products: PosCatalogProduct[]; packages: PosLensPackageOption[] }> {
  const raw = await request<{ products: Array<Omit<PosCatalogProduct, 'variants'> & { variants: Array<{ id: string; sku: string; color: string; size: string; price?: number; images: Array<{ url: string }>; inventory: Array<{ availableQuantity: number }> }> }>; lensTypes: Array<{ name: string; packages: Array<Omit<PosLensPackageOption,'lensTypeName'>> }> }>(`/pos/catalog?vendorId=${encodeURIComponent(vendorId)}&storeId=${encodeURIComponent(storeId)}`);
  return { products: raw.products.map(product => ({ ...product, frameShape: product.frameShape ?? '', brand: product.brand ?? { name: '' }, category: product.category ?? { name: '', slug: '' }, variants: product.variants.map(variant => ({ ...variant, stock: variant.inventory.reduce((sum,row) => sum + row.availableQuantity,0), imageUrl: variant.images[0]?.url ?? '/frames/atelier-01.png' })) })), packages: raw.lensTypes.flatMap(type => type.packages.map(pkg => ({ ...pkg, lensTypeName: type.name }))) };
}
