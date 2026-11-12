# Eye Club architecture

## Feature modules and service boundaries

The web (`client`) and NestJS API (`server`) are independently deployable services; PostgreSQL owns persistent commerce data. The API groups catalog, cart, orders, lenses, prescriptions, users, admin, stores and appointments into Nest modules. These share one database and deployment today: this is a modular backend, not independently deployed microservices per domain.

Frontend routes are thin entry points. Domain UI lives in `client/src/features/{catalog,lenses,storefront,try-on}`. Try-on components and hooks stay together; shared layout, auth providers and reusable libraries remain outside the feature folders. `packages/tryon-engine` is framework-independent geometry/rendering with a separately imported MediaPipe adapter. `packages/widget` reuses this engine.

Live inference deliberately runs in the browser rather than a network service. `/try-on` offers live camera and photo modes. Camera permission is requested only after Start. A VIDEO-mode detector consumes each new video frame once; original transparent frame assets follow eye translation, scale and roll. Frame selection changes the overlay without restarting the stream. Missing/multiple faces clear the overlay. Stop, mode switch, hidden document and unmount release tracks and the detector, including pending startup requests. No camera frames or landmarks go to the API.

The model pipeline uses face landmarks → geometry → calibrated frame transform → canvas composition. It is not a multi-generative-model system. Current assets provide a 2D frontal overlay, with no 3D temples, depth occlusion or guaranteed physical sizing. Inference currently runs on the main thread; target-device frame rate must be measured before making performance claims.

Catalog and order services can be extracted later with versioned contracts, separate data ownership and reliable events when scaling or team ownership calls for it. Adding a remote face-inference service would add latency and transfer sensitive camera imagery without improving the current use case.

## Geometry and data model reference

MediaPipe detects iris centers (468, 473), nose bridge (168) and temple boundaries (234, 454). Names left/right refer to **image** coordinates. Convert normalized landmarks to the actual raster's pixel coordinates before calculating distance or angle. Working in normalized x/y space would produce the wrong rotation for portrait or landscape images.

For each original frame asset, store normalized eye anchors and bridge pivot. Let `dFace` and `dAsset` be the eye separations in their respective pixel spaces:

```
scale = (dFace / dAsset) * calibration.scaleMultiplier
rotation = face.roll - assetAnchorAngle + calibration.rotationOffset
position = face.eyeMidpoint
         + rotate((assetBridge - assetEyeMidpoint) * scale, rotation)
         + rotate(calibrationOffset * dFace, face.roll)
```

Render with translate(position), rotate(rotation), scale(scale), and drawImage at negative assetBridge. The original frame's alpha and image pixels are preserved; Canvas interpolation only scales/rotates them. No image synthesis is used. Bridge is a rendering pivot, not a second competing face alignment constraint. Nose/temple landmarks are exposed for debugging and later pose/fit analysis. The present algorithm aligns eye centers, not real-world millimeters.

Photos are decoded with EXIF orientation, rasterized at up to 1920px along their longest edge, and never transmitted. The browser holds the photo, landmarks and output Canvas only in memory. Reset zeros stored canvases; unmount also disposes the model. Request generation guards prevent stale uploads/cancelled model loads from replacing current results. MediaPipe runs once per photo in IMAGE mode on the main thread; a Worker adapter is the next performance step if long tasks are problematic on target devices.

## Planned boundaries, not implemented

| Phase | Responsibility |
| --- | --- |
| 2 | Calibration editor, multiple real frame assets, live calibration preview, manual correction |
| 3 | NestJS, Prisma/PostgreSQL, auth, memberships/RBAC, products and S3 asset metadata |
| 4 | Merchant dashboard, catalogue workflow, analytics, organization management |
| 5 | Public widget configuration, restricted embed modal, shared engine |
| 6 | Deployment hardening, throttling, security review, monitoring, lifecycle cleanup |

TanStack Query and React Hook Form will be introduced with server data and editable calibration/product forms. They are unnecessary runtime dependencies for the current single-file upload. Zod validates the Phase 1 image metadata. The UI package uses the shadcn button variant convention and has a shadcn configuration for future components.

## PostgreSQL/Prisma model plan

| Entity | Ownership and key constraints |
| --- | --- |
| User | Global identity, unique normalized email, password hash; platform SUPER_ADMIN authorization separate from merchant memberships |
| Organization | Merchant account, unique public slug; explicit lifecycle status |
| OrganizationMember | organizationId + userId unique; role ORGANIZATION_OWNER, ADMIN or STAFF |
| Subscription | organizationId; external provider references, plan/status; provider-verified updates |
| Brand / Category | organizationId; tenant-scoped unique name/slug |
| Eyewear | organizationId, SKU unique per organization, name, description, brand/category references, type, gender, shape/colors, dimensions, decimal price/currency, validated product URL, future model URL, DRAFT/ACTIVE/INACTIVE status, timestamps, archivedAt |
| EyewearAsset | organizationId + eyewearId; storage key, MIME, bytes, dimensions, alpha status, checksum; no image blobs |
| FrameCalibration | organizationId + eyewearId + assetId/version; normalized eye/bridge anchors, scale, offsets, rotation; invalidated on asset replacement |
| TryOnSession | organizationId; anonymous random session identifier, expiration; no face image or landmark persistence |
| TryOnResult | organizationId + sessionId + eyewearId; only explicit consented saves, private object key and retention timestamp |
| Favorite | organizationId + sessionId + eyewearId unique; no unnecessary customer identity |
| ApiKey | organizationId, hashed token, visible prefix, scopes, expiresAt/revokedAt; plaintext shown once |
| WidgetConfiguration | organizationId, random public identifier, enabled flag, origin allowlist and presentation settings |
| UsageEvent | organizationId + sessionId, enumerated event, optional eyewearId, timestamp, tightly allowlisted metadata |

Composite foreign keys `(organizationId, referencedId)` prevent relationships across tenants. Index tenant/status/createdAt query paths. Price is Decimal with currency, never a binary floating-point monetary column. Validate dimensions and normalized coordinates with DB constraints as well as DTO schemas.

## Tenant access and authentication plan

1. Authenticate an access token, then look up active membership. A route/header organization selector is only a requested scope, never proof of access.
2. Resolve an immutable server-side tenant context after membership validation. Every query, mutation, asset operation, nested relationship and analytics operation uses it.
3. Enforce action-specific RBAC in guards/services; owners control team/billing, staff have narrower catalogue permissions. SUPER_ADMIN access is explicit and auditable, not an accidental bypass of ordinary endpoints.
4. Use composite keys and optionally PostgreSQL RLS as defense in depth. Test reads/writes and cross-tenant relation injection with two organizations against a real test database.
5. Hash passwords with Argon2id; use short-lived access JWTs and rotated, hashed refresh tokens in Secure HttpOnly cookies; add replay revocation, CSRF defenses, login throttling and session invalidation. Never place refresh tokens in browser storage.
6. Map service results to explicit response DTOs; no raw Prisma model exposure. Provide Swagger for `/api/v1`, bounded pagination and allowlisted sort/filter fields.

Public access resolves a random widget/public organization identifier through a restricted configuration endpoint. Only ACTIVE, non-archived products whose current assets have valid calibration are visible. Validate origin allowlists without treating CORS alone as authorization; apply separate anonymous limits and public field projections. Tenant private API keys never belong in the browser.

## Asset and privacy lifecycle plan

Merchant assets use an S3-compatible storage adapter with tenant-scoped keys, constrained signed upload URLs, MIME/signature/dimension/alpha validation and safe decoding before publication. Saved customer results belong in a separate private bucket/prefix with consent, short-lived download authorization and TTL cleanup. Temporary uploads use a shorter TTL and cleanup jobs that also remove abandoned multipart uploads. Logs/monitoring must redact photo payloads, landmarks, tokens and signed URLs. The Phase 1 upload never reaches a server and therefore requires no server-side temporary storage.

## Future AR and deployment

Replace the detector adapter for VIDEO/worker inference and the renderer with Three.js/WebGL. Add pose and 3D frame data through versioned contracts; do not reinterpret the current 2D calibration as a physical measurement. Occlusion, temples, pupillary distance, GLB assets, mobile SDK and shop integrations require later work.

Phase 1 ships a standalone Next.js Docker image, with a non-root runtime. A reverse proxy can terminate TLS and forward to web:3000; preserve normal Next.js asset routing and response security headers. When the API exists, route `/api/v1` to the NestJS service and use an internal network for PostgreSQL. Do not add an unauthenticated API placeholder or run unused storage/database services now.
