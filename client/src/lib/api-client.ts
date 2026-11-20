export type ProductType = "EYEGLASSES" | "SUNGLASSES";
export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export type ProductSummary = {
  id: string;
  name: string;
  sku: string;
  type: ProductType;
  status: ProductStatus;
  frameShape: string | null;
  frameColor: string | null;
  productUrl: string | null;
  createdAt: string;
  calibrated: boolean;
};

export type ProductPage = { items: ProductSummary[]; page: number; pageSize: number; total: number };
export type ProductInput = { name: string; sku: string; type: ProductType; description?: string; frameShape?: string; frameColor?: string; productUrl?: string };
export type CalibrationPayload = {
  assetId: string;
  leftAnchorX: number;
  leftAnchorY: number;
  rightAnchorX: number;
  rightAnchorY: number;
  bridgeX: number;
  bridgeY: number;
  scaleMultiplier: number;
  offsetX: number;
  offsetY: number;
  rotationOffset: number;
};
export type AnalyticsOverview = { windowDays: number; totals: { events: number; sessions: number; favorites: number; productClicks: number }; mostSelected: Array<{ eyewearId: string | null; selections: number }> };
export type WidgetConfig = { publicKey: string; organizationSlug: string; enabled: boolean; allowedOrigins: unknown };

export class ApiClientError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "ApiClientError"; }
}

const apiOrigin = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const tokenKey = "virtual-eyewear.access-token";
const refreshKey = "virtual-eyewear.refresh-token";

function getToken() { return typeof window === "undefined" ? undefined : window.sessionStorage.getItem(tokenKey) ?? undefined; }
export function setAccessToken(token: string) { if (typeof window !== "undefined") window.sessionStorage.setItem(tokenKey, token); }
export function clearAccessToken() { if (typeof window !== "undefined") window.sessionStorage.removeItem(tokenKey); }
function getRefreshToken() { return typeof window === "undefined" ? undefined : window.sessionStorage.getItem(refreshKey) ?? undefined; }
function withQuery(path: string, query: URLSearchParams) { return query.size ? `${path}?${query.toString()}` : path; }

async function request<T>(path: string, init: RequestInit = {}, organizationId?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const token = getToken();
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (organizationId) headers.set("x-organization-id", organizationId);
  const endpoint = typeof window !== "undefined" && (path.startsWith("/auth/password-reset") || path.startsWith("/auth/email-verification") || path.startsWith("/public/") || path.startsWith("/tryons/")) ? `/api/backend${path}` : `${apiOrigin()}/api/v1${path}`;
  const response = await fetch(endpoint, { ...init, headers });
  if (!response.ok) {
    let message = `API request failed (${response.status})`;
    try { const body = await response.json() as { message?: string | string[]; error?: { message?: string | string[] } }; const detail = body.error?.message ?? body.message; message = Array.isArray(detail) ? detail.join(", ") : detail ?? message; } catch { /* preserve status message */ }
    throw new ApiClientError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  const result = await request<{ accessToken: string; refreshToken: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  setAccessToken(result.accessToken);
  if (typeof window !== "undefined") window.sessionStorage.setItem(refreshKey, result.refreshToken);
  return result;
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiClientError(401, "No refresh session is available.");
  const result = await request<{ accessToken: string; refreshToken: string }>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) });
  setAccessToken(result.accessToken);
  if (typeof window !== "undefined") window.sessionStorage.setItem(refreshKey, result.refreshToken);
  return result;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) await request<{ success: true }>("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
  clearAccessToken();
  if (typeof window !== "undefined") window.sessionStorage.removeItem(refreshKey);
}

export function listProducts(organizationId: string, params: { page?: number; pageSize?: number; search?: string; type?: ProductType; status?: ProductStatus } = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) { if (value !== undefined && value !== "") query.set(key, String(value)); }
  return request<ProductPage>(withQuery("/products", query), undefined, organizationId);
}

export function uploadFrameAsset(organizationId: string, productId: string, file: File) {
  const body = new FormData(); body.append("file", file);
  return request<{ id: string; storageKey: string; mimeType: string; bytes: number; width: number; height: number; sha256: string; hasAlpha: boolean }>(`/products/${encodeURIComponent(productId)}/assets/upload`, { method: "POST", body }, organizationId);
}

export function createProduct(organizationId: string, input: ProductInput) {
  return request<ProductSummary>("/products", { method: "POST", body: JSON.stringify(input) }, organizationId);
}

export function updateProduct(organizationId: string, productId: string, input: Partial<ProductInput> & { status?: ProductStatus }) {
  return request<Pick<ProductSummary, "id" | "name" | "sku" | "type" | "status">>(`/products/${encodeURIComponent(productId)}`, { method: "PATCH", body: JSON.stringify(input) }, organizationId);
}
export function duplicateProduct(organizationId: string, productId: string) { return request<Pick<ProductSummary, "id" | "name" | "sku" | "type" | "status">>(`/products/${encodeURIComponent(productId)}/duplicate`, { method: "POST" }, organizationId); }

export function saveCalibration(organizationId: string, productId: string, payload: CalibrationPayload) {
  return request<{ id: string; eyewearId: string; assetId: string }>(`/products/${encodeURIComponent(productId)}/calibration`, { method: "PATCH", body: JSON.stringify(payload) }, organizationId);
}

export function createTryOnSession(organizationSlug: string) { return request<{ publicId: string; expiresAt: string }>("/tryons/sessions", { method: "POST", body: JSON.stringify({ organizationSlug }) }); }
export function trackTryOnEvent(publicId: string, eventType: string, eyewearId?: string) { return request<{ accepted: true }>(`/tryons/sessions/${encodeURIComponent(publicId)}/events`, { method: "POST", body: JSON.stringify({ eventType, ...(eyewearId ? { eyewearId } : {}) }) }); }
export function getAnalyticsOverview(organizationId: string, days = 30) { return request<AnalyticsOverview>(`/analytics/overview?days=${days}`, undefined, organizationId); }
export function getWidgetConfig(publicKey: string) { return request<WidgetConfig>(`/widget/config/${encodeURIComponent(publicKey)}`); }
export type PublicCatalogueProduct = { id: string; name: string; sku: string; type: ProductType; frameShape: string | null; frameColor: string | null; price: string | number | null; currency: string; productUrl: string | null; brand: { id: string; name: string } | null; category: { id: string; name: string } | null; calibration: Record<string, string | number> | null; asset: { storageKey: string; mimeType: string; width: number; height: number; url: string } | null };
export async function getPublicCatalogue(organizationSlug: string, params: { brand?: string; category?: string; type?: ProductType } = {}) { const query = new URLSearchParams(); for (const [key, value] of Object.entries(params)) { if (value) query.set(key, value); } const path = withQuery(`/public/catalogue/${encodeURIComponent(organizationSlug)}`, query); const result = await request<PublicCatalogueProduct[]>(path); return result.map((item) => ({ ...item, asset: item.asset ? { ...item.asset, url: typeof window !== "undefined" ? item.asset.url.replace("/api/v1/", "/api/backend/") : `${apiOrigin()}${item.asset.url}` } : null })); }
export type WidgetConfiguration = { id: string; publicKey: string; allowedOrigins: unknown; enabled: boolean; createdAt?: string; updatedAt?: string };
export function listWidgetConfigurations(organizationId: string) { return request<WidgetConfiguration[]>(`/widget/${encodeURIComponent(organizationId)}/configurations`, undefined, organizationId); }
export function createWidgetConfiguration(organizationId: string, allowedOrigins: string[]) { return request<WidgetConfiguration>(`/widget/${encodeURIComponent(organizationId)}/configurations`, { method: "POST", body: JSON.stringify({ allowedOrigins }) }, organizationId); }
export function updateWidgetConfiguration(organizationId: string, id: string, input: { allowedOrigins?: string[]; enabled?: boolean }) { return request<WidgetConfiguration>(`/widget/${encodeURIComponent(organizationId)}/configurations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }, organizationId); }
export function getSubscription(organizationId: string) { return request<{ id: string; plan: string; status: string; currentPeriodEnd: string | null }>("/billing/subscription", undefined, organizationId); }
export function getBillingUsage(organizationId: string) { return request<{ periodStart: string; sessions: number; events: number; activeProducts: number }>("/billing/usage", undefined, organizationId); }
export function listMembers(organizationId: string) { return request<Array<{ id: string; role: string; user: { email: string; displayName: string } }>>(`/organizations/${encodeURIComponent(organizationId)}/members`, undefined, organizationId); }
export function inviteMember(organizationId: string, email: string, role: string) { return request<{ id: string; email: string; role: string; expiresAt: string; token: string }>(`/organizations/${encodeURIComponent(organizationId)}/invitations`, { method: "POST", body: JSON.stringify({ email, role }) }, organizationId); }
export function listInvitations(organizationId: string) { return request<Array<{ id: string; email: string; role: string; expiresAt: string }>>(`/organizations/${encodeURIComponent(organizationId)}/invitations`, undefined, organizationId); }
export function revokeInvitation(organizationId: string, id: string) { return request<{ success: true }>(`/organizations/${encodeURIComponent(organizationId)}/invitations/${encodeURIComponent(id)}`, { method: "DELETE" }, organizationId); }
export function acceptInvitation(token: string) { return request<{ accepted: true; organizationId: string; role: string }>(`/organizations/invitations/${encodeURIComponent(token)}/accept`, { method: "POST" }); }
export function requestPasswordReset(email: string) { return request<{ accepted: true; token?: string }>("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email }) }); }
export function confirmPasswordReset(token: string, password: string) { return request<{ reset: true }>("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token, password }) }); }
export function requestEmailVerification(email: string) { return request<{ accepted: true; token?: string }>("/auth/email-verification/request", { method: "POST", body: JSON.stringify({ email }) }); }
export function confirmEmailVerification(token: string) { return request<{ verified: true }>("/auth/email-verification/confirm", { method: "POST", body: JSON.stringify({ token }) }); }
export function listAuditLogs(organizationId: string, params: { page?: number; pageSize?: number; action?: string } = {}) { const query = new URLSearchParams(); for (const [key, value] of Object.entries(params)) { if (value !== undefined && value !== "") query.set(key, String(value)); } return request<{ items: Array<{ id: string; action: string; metadata: unknown; createdAt: string; user: { email: string; displayName: string } | null }>; page: number; pageSize: number; total: number }>(withQuery("/audit/logs", query), undefined, organizationId); }
