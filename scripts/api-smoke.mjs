const origin = process.env.API_ORIGIN ?? "http://127.0.0.1:4000/api/v1";
const email = process.env.SEED_OWNER_EMAIL ?? "owner@example.test";
const password = process.env.SEED_OWNER_PASSWORD;
const secondEmail = process.env.SEED_SECOND_OWNER_EMAIL ?? "second-owner@example.test";
const secondPassword = process.env.SEED_SECOND_OWNER_PASSWORD ?? password;
const organizationRef = process.env.SMOKE_ORGANIZATION_ID ?? process.env.SMOKE_ORGANIZATION_SLUG;

if (!password || !organizationRef) throw new Error("SEED_OWNER_PASSWORD and SMOKE_ORGANIZATION_ID (or SMOKE_ORGANIZATION_SLUG) are required.");

async function request(path, options = {}) {
  const response = await fetch(`${origin}${path}`, { ...options, headers: { "content-type": "application/json", ...(options.headers ?? {}) } });
  const body = await response.json().catch(() => null);
  return { response, body };
}

const health = await fetch(`${origin}/health`);
if (!health.ok) throw new Error(`Health check failed: ${health.status}`);

const login = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
if (!login.response.ok || !login.body?.accessToken || !login.body?.refreshToken) throw new Error(`Login failed: ${login.response.status}`);
const accessToken = login.body.accessToken;
const refreshToken = login.body.refreshToken;
const auth = { authorization: `Bearer ${accessToken}` };

const organizations = await request("/organizations", { headers: auth });
const organization = organizations.body?.find((candidate) => candidate.id === organizationRef || candidate.slug === organizationRef);
if (!organizations.response.ok || !organization) throw new Error("Seed organization is not visible to the authenticated owner.");
const organizationId = organization.id;

const products = await request("/products", { headers: { ...auth, "x-organization-id": organizationId } });
if (!products.response.ok || !Array.isArray(products.body?.items)) throw new Error(`Product list failed: ${products.response.status}`);

const forbidden = await request("/products", { headers: { ...auth, "x-organization-id": "organization-that-does-not-exist" } });
if (forbidden.response.status !== 403) throw new Error(`Tenant isolation check expected 403, received ${forbidden.response.status}`);

const refresh = await request("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) });
if (!refresh.response.ok || !refresh.body?.accessToken) throw new Error(`Refresh failed: ${refresh.response.status}`);
const replay = await request("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) });
if (replay.response.status !== 401) throw new Error(`Refresh replay check expected 401, received ${replay.response.status}`);

if (process.env.SMOKE_SECOND_ORGANIZATION) {
  const secondLogin = await request("/auth/login", { method: "POST", body: JSON.stringify({ email: secondEmail, password: secondPassword }) });
  if (!secondLogin.response.ok || !secondLogin.body?.accessToken) throw new Error(`Second owner login failed: ${secondLogin.response.status}`);
  const secondAuth = { authorization: `Bearer ${secondLogin.body.accessToken}` };
  const secondOrganizations = await request("/organizations", { headers: secondAuth });
  const secondOrganization = secondOrganizations.body?.find((candidate) => candidate.slug === process.env.SMOKE_SECOND_ORGANIZATION || candidate.id === process.env.SMOKE_SECOND_ORGANIZATION);
  if (!secondOrganization) throw new Error("Second seeded organization is not visible to its owner.");
  const crossTenant = await request("/products", { headers: { ...secondAuth, "x-organization-id": organizationId } });
  if (crossTenant.response.status !== 403) throw new Error(`Cross-tenant access expected 403, received ${crossTenant.response.status}`);
  const ownTenant = await request("/products", { headers: { ...secondAuth, "x-organization-id": secondOrganization.id } });
  if (!ownTenant.response.ok) throw new Error(`Second owner product access failed: ${ownTenant.response.status}`);
}

console.log(JSON.stringify({ status: "ok", organizationId, productCount: products.body.items.length, refreshRotation: "ok", tenantIsolation: process.env.SMOKE_SECOND_ORGANIZATION ? "two-organization" : "invalid-scope" }));
