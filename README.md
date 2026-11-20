# Eye Club

**Eyewear shopping, private virtual try-on, and optical retail operations in one monorepo.**

Eye Club combines a Next.js storefront with a browser-based fitting studio and a NestJS/PostgreSQL backend. The current code also includes lens selection, prescriptions, store appointments, vendor administration, and an optical point-of-sale (POS) workspace.

> **Project status:** active development. Several screens use sample data or browser-local fallbacks. The API, migration history, and older merchant screens are not yet fully aligned. This README describes the current source, including the uncommitted vendor/POS additions, rather than claiming every workflow is production-ready.

## Contents

- [Application at a glance](#application-at-a-glance)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Application guide](#application-guide)
- [Virtual try-on](#virtual-try-on)
- [Database and domain model](#database-and-domain-model)
- [API reference](#api-reference)
- [Widget integration](#widget-integration)
- [Development and verification](#development-and-verification)
- [Deployment](#deployment)
- [Known integration gaps](#known-integration-gaps)
- [Troubleshooting](#troubleshooting)
- [Repository map and further documentation](#repository-map-and-further-documentation)

## Application at a glance

```mermaid
flowchart LR
    E[Eye Club] --> S[Shopping]
    E --> T[Virtual try-on]
    E --> R[Retail operations]
    S --> S1[Categories and product variants]
    S --> S2[Lenses and prescriptions]
    S --> S3[Cart and checkout screens]
    T --> T1[Photo fitting]
    T --> T2[Live camera mirror]
    T --> T3[Frame calibration]
    R --> R1[Vendors and branches]
    R --> R2[Registers and POS sales]
    R --> R3[Orders and lab tracking]
```

| Area | Source includes | Current boundary |
| --- | --- | --- |
| Storefront | Landing page, category browsing, brands, product details and variants | Catalogue requests fall back to sample products when the API fails |
| Try-on | Local photo processing, live camera tracking, transparent frame overlays, calibration and fit controls | 2D visual preview; no physical sizing or depth occlusion |
| Lens selection | Lens type/package UI and backend models | Requires API data for lens options |
| Customer account | Login, profile, order and prescription pages | Screen presence does not imply a complete connected workflow |
| Checkout | Address/payment steps and success screen; separate backend cart-to-order service | Current checkout page shows a simulated confirmation; payment capture is not integrated |
| Stores | Store listing, appointment booking UI and API modules | Needs database setup and end-to-end verification |
| Vendor management | Plans, vendor status, branch/register/staff management | Browser-local demo fallback; backend authorization needs work |
| POS | Register sessions, frame/lens sales, payments, balances and lab status | Demo fallback can persist locally without a successful API write |
| Legacy merchant dashboard | Product, team, billing, widget and analytics pages | Uses older organization-oriented contracts |

## Architecture

```mermaid
flowchart TB
    subgraph Browser[Customer or staff browser]
        UI[Next.js application]
        DEMO[Sample data and local storage]
        subgraph Private[Local try-on processing]
            INPUT[Photo or camera]
            MP[MediaPipe face landmarks]
            ENGINE[Geometry and calibration engine]
            CANVAS[Canvas frame overlay]
            INPUT --> MP --> ENGINE --> CANVAS
        end
        UI --> INPUT
        UI -. Demo fallback .-> DEMO
    end
    UI <-->|HTTP API requests| API[NestJS modular API]
    API <-->|Prisma| DB[(PostgreSQL)]
    API --> STORAGE[Local or S3-compatible object storage]
    API -. Optional shared rate limiting .-> REDIS[(Redis)]
    ASSETS[Same-origin WASM, model and frame assets] --> MP
    ASSETS --> CANVAS
```

The web and API are separate deployable services. Backend domains are Nest modules in a single application sharing one database. Face inference runs in the browser: the try-on pipeline sends neither customer photos nor landmarks to the API. Other app activity, including authentication, catalogue retrieval and orders, uses network services.

The framework-independent engine lives in `packages/tryon-engine`. Next.js feature components coordinate browser resources and UI; the API handles persistent business data.

## Technology stack

Versions below are declared in package manifests, not a guarantee that every dependency installs or every package currently builds.

| Layer | Technology |
| --- | --- |
| Web | Next.js 16.3.5, React 19.3.0, TypeScript |
| Styling and UI | Tailwind CSS 4, Lucide icons, shared UI package |
| Forms and validation | React Hook Form, Zod; class-validator/class-transformer on the API |
| Try-on | MediaPipe Tasks Vision, Canvas 2D, custom geometry/calibration |
| Authentication | NextAuth credentials provider; API JWTs and Argon2id password hashes |
| Backend | NestJS, Express, Swagger/OpenAPI |
| Persistence | PostgreSQL, Prisma 6.16.0 |
| Storage and limits | Local filesystem or AWS SDK S3 adapter; optional ioredis |
| Verification | Vitest, Playwright, ESLint, TypeScript |
| Local infrastructure | Docker Compose; PostgreSQL 16 image |

## Getting started

### Requirements

- Node.js **22 or newer** and npm (the existing setup guidance uses npm 11+).
- A modern browser with WebAssembly and Canvas support. Chromium is the configured browser-test target.
- Internet access for dependencies, the initial face-model download, and externally hosted storefront images.
- Docker Engine with Compose v2 for local PostgreSQL or the container stack.
- pnpm if using the API's standalone lockfile.

### 1. Start the web demo

Run from the repository root:

```sh
npm ci
npm run assets:setup
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**. Visit **[/try-on](http://localhost:3000/try-on)** for the fitting studio and **[/eyeglasses](http://localhost:3000/eyeglasses)** for the catalogue.

`assets:setup` copies MediaPipe WASM files into `client/public/vision`, downloads the face model into `client/public/models`, and verifies its pinned SHA-256 checksum. An existing valid model is reused.

The landing page, catalogue fallback, and local try-on can be explored without PostgreSQL. This is a demo path; it does not verify authentication, order persistence or payment processing.

### 2. Configure the web app

Create `client/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_VISION_WASM_PATH=/vision
NEXT_PUBLIC_FACE_MODEL_PATH=/models/face_landmarker.task
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
```

Set the API URL explicitly: the NextAuth provider otherwise falls back to port **3001**, while catalogue clients use **4000**. Restart Next.js after changing configuration.

### 3. Prepare the API and database

The API has a separate pnpm lockfile. From the repository root:

```sh
pnpm --dir server install --frozen-lockfile
```

Provide these variables in the shell that runs API commands (the example files are references; copying them does not export variables automatically):

```sh
export DATABASE_URL='postgresql://eyewear:eyewear@localhost:5432/eyewear?schema=public'
export JWT_ACCESS_SECRET='replace-with-at-least-32-random-characters'
export CORS_ORIGINS='http://localhost:3000'
export PORT=4000

docker compose up -d postgres
pnpm --dir server exec prisma validate
pnpm --dir server exec prisma generate
```

**Database migration caveat:** committed migrations describe the older organization/eyewear schema, while the current Prisma schema describes vendors, products, POS and commerce. `prisma migrate deploy` alone does not establish the current application schema. Reconcile and review migrations before relying on a connected stack. For contributors intentionally prototyping against an **empty, disposable local database**, `pnpm --dir server exec prisma db push` can create the current schema; it is not a production migration strategy. Do not use reset or data-loss flags on a database containing needed data.

Once the database matches the current schema:

```sh
pnpm --dir server run dev
```

The default API port is **4000**. Check **[health](http://localhost:4000/api/v1/health)** and **[Swagger](http://localhost:4000/docs)**. Read the [route-prefix caveat](#api-reference) before connecting clients.

### 4. Optional demo seed

The current `server/prisma/seed.ts` deletes catalogue, vendor, inventory and related data before creating demo vendors, stores, registers, products and lens packages. It also creates or updates `admin@eye-club.local` with the hard-coded demo password `password123` and the `SUPER_ADMIN` role.

Run it **only against a disposable development database** after reviewing the script:

```sh
pnpm --dir server run prisma:seed
```

The current seed does not read `SEED_OWNER_PASSWORD`; those variables belong to older setup instructions. The deletion order may also fail on populated databases with dependent records. Never use this seed to initialize a production system.

## Configuration

| Variable | Consumer | Purpose/default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Web | API origin; explicitly set to `http://localhost:4000` locally |
| `NEXT_PUBLIC_VISION_WASM_PATH` | Try-on | Same-origin WASM directory, `/vision` |
| `NEXT_PUBLIC_FACE_MODEL_PATH` | Try-on | Same-origin model, `/models/face_landmarker.task` |
| `NEXTAUTH_URL` | NextAuth | Canonical web URL |
| `NEXTAUTH_SECRET` | NextAuth | Session signing secret; replace the development fallback |
| `DATABASE_URL` | Prisma/API | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | API | Access-token signing secret; production startup requires at least 32 characters |
| `JWT_ACCESS_TTL` | API | Access-token lifetime, default `15m` |
| `PORT` | API | Listening port, default `4000` |
| `CORS_ORIGINS` | API | Comma-separated allowed origins; default `http://localhost:3000` |
| `NODE_ENV` | Runtime | Enables production behavior and startup checks |
| `STORAGE_PROVIDER` | API | `local` by default; `s3` selects the S3 adapter |
| `STORAGE_LOCAL_DIR` | API | Local storage directory, default `./.data/objects` |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` | S3 adapter | Bucket and provider configuration; region defaults to `auto` |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | S3 adapter | Storage credentials; never expose through public web variables |
| `S3_FORCE_PATH_STYLE` | S3 adapter | Set `true` for providers requiring path-style requests |
| `REDIS_URL` | Rate limiter | Optional Redis connection; otherwise limits are process-local |

See [root environment examples](.env.example) and [API environment examples](server/.env.example). These files contain legacy seed settings as well as current configuration. `NEXT_PUBLIC_*` values are public and generally fixed into the web build; they must never contain secrets.

## Application guide

### Customer routes

| Route | Purpose |
| --- | --- |
| `/` | Storefront landing page |
| `/[category]` | Category catalogue, for example `/eyeglasses` or `/sunglasses` |
| `/products/[slug]` | Product details and variants |
| `/products/[slug]/lenses` | Lens selection wizard |
| `/try-on` | Photo and live-camera fitting studio |
| `/cart`, `/checkout` | Shopping cart and checkout interface |
| `/login` | Credentials login |
| `/account` | Account overview |
| `/account/orders`, `/account/prescriptions` | Customer records |
| `/stores`, `/book-exam` | Store discovery and eye-exam booking |
| `/invite/[token]`, `/reset-password`, `/verify-email` | Existing account lifecycle screens; backend integration needs review |

The intended shopping journey is category → product/variant → optional lenses/prescription → cart → checkout → order tracking. The current checkout success screen is simulated and must not be treated as evidence that an order or payment was created.

### Retail and administration routes

| Route | Purpose |
| --- | --- |
| `/admin` | Administrative overview |
| `/admin/catalog`, `/admin/orders` | Catalogue and order administration |
| `/admin/vendors` | Vendor, plan, branch and staff management |
| `/pos`, `/admin/pos` | Optical POS workspace |
| `/dashboard/products` | Earlier merchant product/calibration workflow |
| `/dashboard/team`, `/dashboard/billing` | Earlier team and billing screens |
| `/dashboard/widget`, `/dashboard/analytics` | Earlier widget and analytics screens |

Vendor and POS clients attempt API requests and can fall back to demo records in local storage. A local success or visible record does not establish server persistence. Browser-local records are specific to that browser/origin.

```mermaid
flowchart LR
    V[Vendor and branch] --> REG[Select register]
    REG --> SESSION[Open cashier session]
    SESSION --> SALE[Choose frame and lenses]
    SALE --> RX[Attach prescription if needed]
    RX --> PAY[Record payment and balance]
    PAY --> LAB{Lab work required?}
    LAB -->|Yes| QUEUE[Pending lab and processing]
    QUEUE --> PICKUP[Ready for pickup]
    LAB -->|No| DONE[Immediate delivery]
    PICKUP --> DONE
    SESSION --> CLOSE[Close session and reconcile cash]
```

This diagram describes the retail workflow represented by the source. Verify each step against a connected database before operational use.

## Virtual try-on

### Photo and camera workflow

1. Open `/try-on` and select photo or live camera mode.
2. Upload a supported photo, or explicitly start the camera and grant permission.
3. Select a frame; the engine aligns a transparent asset to detected eye landmarks.
4. Use available fit/calibration controls to refine placement.
5. Reset the photo or stop the camera when finished.

| Photo constraint | Value |
| --- | --- |
| Accepted formats | JPEG, PNG, WebP; MIME and file signature are checked |
| Maximum file size | 10 MiB |
| Minimum dimensions | 128 × 128 pixels |
| Maximum input area | 24,000,000 pixels |
| Processing size | Longest edge resized to at most 1920 pixels |

```mermaid
flowchart LR
    A[Validate and decode image] --> B[Convert landmarks to image pixels]
    B --> C[Eye midpoint, separation and roll]
    C --> D[Apply calibrated asset anchors]
    D --> E[Translate, rotate and scale]
    E --> F[Composite original transparent frame]
```

The engine calculates scale from face-eye separation divided by asset-eye separation, adjusted by a calibration multiplier. Rotation combines face roll, the asset anchor angle and a calibration offset. The bridge anchor acts as the rendering pivot. Calculations use pixel coordinates so portrait and landscape images retain correct geometry.

Photo inference uses MediaPipe IMAGE mode; live tracking uses VIDEO mode. Camera resources are released on stop, mode switch, hidden document and route cleanup. Missing or multiple faces clear the live overlay.

### Privacy and limitations

Photos, camera frames and face landmarks remain in browser memory in the try-on flow. Model/WASM assets are served from the web app after setup. This privacy statement applies to try-on imagery, not to account, prescription or order data stored by commerce features.

Camera access requires HTTPS or localhost and browser permission. Current overlays are frontal 2D assets: there is no 3D temple rendering, depth occlusion or guaranteed real-world fit. Inference runs on the main thread; benchmark target devices before making frame-rate claims.

To regenerate sample transparent frames:

```sh
node scripts/render-sample-frame.mjs
```

## Database and domain model

The current [Prisma schema](server/prisma/schema.prisma) is the reference for entity definitions. Monetary columns use PostgreSQL decimals, though some service calculations convert values to JavaScript numbers and still need financial correctness review.

```mermaid
erDiagram
    VENDOR ||--o{ STORE : operates
    VENDOR ||--o{ PRODUCT : owns
    VENDOR ||--o{ VENDOR_MEMBER : has
    USER ||--o{ VENDOR_MEMBER : joins
    STORE ||--o{ POS_REGISTER : contains
    POS_REGISTER ||--o{ POS_SESSION : opens
    POS_SESSION ||--o{ ORDER : records
    USER ||--o{ ORDER : places
    USER ||--o{ PRESCRIPTION : saves
    PRODUCT ||--o{ PRODUCT_VARIANT : offers
    PRODUCT_VARIANT ||--o{ INVENTORY : stocks
    STORE ||--o{ INVENTORY : holds
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT_VARIANT ||--o{ ORDER_ITEM : fulfills
    LENS_PACKAGE ||--o{ ORDER_ITEM : configures
    STORE ||--o{ APPOINTMENT : schedules
```

Additional entities include brands, hierarchical categories, collections, images, carts, wishlists, addresses, reviews, coupons, CMS banners, refresh tokens and audit logs. The diagram is a selected relationship map; it omits optionality and secondary relations for readability.

| Domain | Important states/types |
| --- | --- |
| Vendor | `ACTIVE`, `TRIALING`, `SUSPENDED` |
| SaaS tier | `STARTER`, `PROFESSIONAL`, `ENTERPRISE` |
| Product | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| POS session | `OPEN`, `CLOSED` |
| Order channel | `ONLINE`, `POS` |
| Payment status | `PENDING`, `PARTIALLY_PAID`, `COMPLETED`, `FAILED`, `REFUNDED` |
| Payment method | Cash, card, split, insurance, eSewa, Khalti, cash on delivery enum values |
| Delivery | Home delivery, store pickup, in-store immediate |
| Lab | `NONE`, `PENDING_LAB`, `IN_LAB`, `QUALITY_CHECK`, `READY_FOR_PICKUP`, `DELIVERED` |

Payment enums record supported data categories; they do not demonstrate integrations with those payment providers. Roles include `SUPER_ADMIN`, `VENDOR_OWNER`, `ADMIN`, `STORE_MANAGER`, `OPTOMETRIST`, `CASHIER`, `ORDER_MANAGER`, `INVENTORY_MANAGER`, `CUSTOMER_SUPPORT` and `CUSTOMER`; enforcement varies by endpoint.

## API reference

**Important route-prefix caveat:** `server/src/main.ts` applies the global prefix `api/v1`, while most controllers also declare `api/v1/...`. Consequently, their current effective paths contain **`/api/v1/api/v1/...`**. Health declares only `health`, so it remains `/api/v1/health`. Frontend clients request a single prefix. Align these declarations before expecting normal API-backed flows to work.

Swagger at **`http://localhost:4000/docs`** exposes the routes generated by the running application. The table below shows the **controller-declared paths before the additional global prefix**; it is a source map, not a claim that single-prefix requests currently succeed.

| Controller path | Operations |
| --- | --- |
| `/api/v1/auth` | `POST register`, `POST login`, `POST refresh`, `POST logout` |
| `/api/v1/catalog` | `GET products`, `GET products/:slug`, `GET categories`, `GET brands` |
| `/api/v1/lenses` | `GET types`, `GET types/:id` |
| `/api/v1/cart` | `GET /`, `POST /`, `PUT :id`, `DELETE :id` |
| `/api/v1/orders` | `GET /`, `GET :id`, `POST checkout` |
| `/api/v1/prescriptions` | `GET /`, `GET :id`, `POST /` |
| `/api/v1/stores` | `GET /`, `GET :id` |
| `/api/v1/appointments` | `POST /`, `GET me`, `PUT :id/cancel` |
| `/api/v1/vendors` | `GET /`, `GET :id`, `POST /`, `PATCH :id`, `POST :id/stores`, `POST :id/registers`, `POST :id/members` |
| `/api/v1/pos` | `GET registers`, `GET catalog`, `GET orders`, `POST checkout`, `POST sessions/open`, `POST sessions/:id/close`, `PATCH orders/:id/status` |
| `/api/v1/admin` | `GET dashboard`, `GET orders`, `GET products`, `PUT orders/:id/status`, `PUT products/:id/status` |
| `/api/v1/admin/audit` | `GET /` |

### Authentication and authorization

API login/register responses contain an access token, a refresh token and a user summary. Protected endpoints expect `Authorization: Bearer <access-token>`. Passwords use Argon2id; refresh tokens are stored as hashes, expire after 30 days, and are revoked when rotated or logged out. Access JWT lifetime defaults to 15 minutes; the response currently reports `expiresIn: 900` even if the TTL is customized.

The NextAuth credentials provider stores the API access token in its JWT/session flow. It does not currently implement API token refresh. Admin controllers use bearer and role guards, but the vendor and POS controllers currently have no attached authentication/role guards. Vendor query parameters are filters, not proof of tenant access. Complete server-side authorization before exposing these operations publicly.

The API has global DTO validation, an exception filter, request IDs, request-duration logs, CORS and response headers. TypeScript-only body interfaces do not provide runtime DTO validation automatically. The configured CORS methods also omit `PUT`, which some controllers use.

## Widget integration

Build the dependency-free widget:

```sh
npm run build:widget
```

The TypeScript build emits the script under `packages/widget/dist`. Host the output at your chosen URL, then include it on a merchant page:

```html
<script
  src="https://cdn.example.com/tryon.js"
  data-origin="https://tryon.example.com"
  data-public-key="PUBLIC_WIDGET_KEY"
></script>
<button
  data-virtual-tryon
  data-product="PRODUCT_ID"
  data-organization="ORGANIZATION_SLUG"
>
  Virtual try-on
</button>
```

The script opens a modal iframe for `/try-on`, passes product/organization/widget query parameters and allows camera use. Use public context only; never embed API secrets.

**Integration work remains:** the web CSP currently sets `frame-ancestors 'none'`, blocking external iframe embedding. The existing widget README references a public configuration API that is absent from the current registered controllers. Reconcile iframe policy, allowed merchant origins, configuration lookup and the current vendor model before shipping an embed. See [widget notes](packages/widget/README.md).

## Development and verification

### Root commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js development server |
| `npm run assets:setup` | Copy WASM and verify/download the face model |
| `npm run lint` | ESLint with zero warnings allowed |
| `npm run typecheck` | Check engine, UI, client and widget; **does not include API** |
| `npm test` | Run configured Vitest tests |
| `npm run test:e2e` | Run Playwright browser tests |
| `npm run build` | Production web build with webpack; **does not build API/widget** |
| `npm start` | Start the built web app |
| `npm run build:widget` | Compile widget script |

API checks, separately:

```sh
pnpm --dir server exec prisma validate
pnpm --dir server exec prisma generate
pnpm --dir server exec tsc -p tsconfig.json --noEmit
pnpm --dir server run build
```

Playwright starts a development web server on `127.0.0.1:3100`; install its browser with `npx playwright install chromium` when needed. Tests cover portions of geometry, manual adjustment, photo validation, calibration, API client behavior and browser flows. They do not establish that all commerce/POS journeys work.

The committed CI workflow still points to `apps/api`; this repository uses `server`. The old API smoke script also targets organization-based contracts. Update those checks alongside the API migration before relying on CI or smoke results as release evidence.

When contributing, keep route entry points thin, place domain UI under `client/src/features`, keep geometry independent of React, and update docs when behavior or configuration changes. Run checks relevant to the affected package and report any existing failures separately.

## Deployment

The repository contains [web](client/Dockerfile) and [API](server/Dockerfile) Dockerfiles plus [Compose configuration](docker-compose.yml). Compose defines web, API, PostgreSQL and an optional seed service.

```sh
docker compose config --quiet
```

A full-stack launch command is `docker compose up --build`, but the checked-in configuration needs attention before it is a reliable deployment path:

- The API container uses `NODE_ENV=production`; supply `JWT_ACCESS_SECRET` with at least 32 characters. Compose's default development secret fails this check.
- API startup runs `prisma migrate deploy`; the migration/schema mismatch must be resolved first.
- Only PostgreSQL has a named persistent volume. Configure persistent storage for local API objects or use S3 storage.
- The web container needs appropriate build-time public API configuration and a server-reachable API URL. Container `localhost` refers to that container, not another service.
- Web CSP must allow the actual API origin; camera use needs HTTPS outside localhost.
- Keep the destructive seed profile out of production initialization.

Production readiness also requires verified vendor isolation and role enforcement, validated request DTOs, real checkout/payment integration, database backups and reviewed migration rollouts. Configure shared rate limiting for multiple API instances and test storage, authentication and full order flows against the deployed environment.

## Known integration gaps

| Gap | Observable effect | Required follow-up |
| --- | --- | --- |
| Duplicate API prefix | Normal frontend requests miss effective controller routes | Keep the version prefix in one place |
| Current schema vs historical migrations | Migrated DB lacks current commerce/vendor/POS structures | Create reviewed migrations from the deployed baseline |
| Legacy merchant contracts | Organization/product dashboard requests may have no matching endpoint | Migrate or retire old clients and screens |
| API URL and CSP mismatch | Login may target 3001; browser requests to 4000 may be blocked | Set API URL and align `connect-src` |
| Browser-local fallbacks | UI can show success without backend persistence | Verify server writes; surface demo/offline state |
| Simulated checkout | Success screen does not confirm a real purchase | Connect order creation and payment verification |
| Vendor/POS guard coverage | Sensitive operations lack attached guards | Enforce identity, role and vendor/store scope server-side |
| Token lifecycle | NextAuth session can outlast API access token | Implement refresh/error handling |
| CI and smoke drift | Historical paths/contracts fail to validate current app | Point checks at `server` and current workflows |
| Widget framing/configuration | External embed is blocked or lacks matching configuration API | Align CSP, origin policy and configuration contracts |

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| Face model or WASM fails to load | Rerun `npm run assets:setup`; inspect `/vision` and `/models/face_landmarker.task`; check public path settings |
| Model checksum mismatch | Replace the invalid local model using the setup script's guidance; keep checksum verification enabled |
| Camera cannot start | Use HTTPS/localhost, allow browser permission, close competing camera apps and check iframe permissions |
| Photo rejected | Use a valid JPEG/PNG/WebP within the size and dimension limits above |
| Frame placement looks wrong | Use a clear frontal face, verify asset eye anchors and adjust calibration; 2D overlays cannot resolve strong head turns |
| Catalogue shows sample products | Inspect API connectivity, effective route prefix and database contents; fallback data can mask failures |
| Login fails | Set `NEXT_PUBLIC_API_URL`, verify effective auth path, database schema and account credentials |
| Browser reports CSP/CORS errors | Align web `connect-src`, API `CORS_ORIGINS`, requested methods and deployed origins |
| API exits at startup | Check database reachability, schema compatibility and production JWT-secret length |
| Missing Prisma models or generated types | Regenerate Prisma client after schema edits and verify database schema alignment |
| POS data differs across browsers | Check local storage fallback versus persisted API data |
| CI cannot find `apps/api` | Update stale workflow paths to `server` |

## Repository map and further documentation

```text
.
├── client/
│   ├── src/app/                 Next.js routes and NextAuth handler
│   ├── src/features/            Catalog, storefront, lenses, try-on, vendors, POS
│   ├── src/components/          Layout and providers
│   ├── src/lib/                 API clients, validation, assets and auth
│   └── public/                  Frame assets, generated WASM and face model
├── server/
│   ├── src/                     Nest modules, guards, storage and shared services
│   └── prisma/                  Current schema, historical migrations, demo seed
├── packages/
│   ├── tryon-engine/            Geometry, detector adapter, calibration, renderer
│   ├── ui/                      Shared UI components
│   ├── widget/                  Browser modal/iframe integration
│   ├── config/                  Shared TypeScript configuration
│   ├── database/                Placeholder package documentation
│   └── types/                   Placeholder package documentation
├── scripts/                    Vision setup, sample-frame rendering, old API smoke
├── e2e/                        Playwright tests
├── docs/                       Architecture and historical validation records
├── .github/workflows/          CI configuration
└── docker-compose.yml          Local service definitions
```

- [Architecture and geometry notes](docs/architecture.md)
- [API package notes](server/README.md)
- [Widget package notes](packages/widget/README.md)
- [Initial validation record](docs/validation.md)
- [Phase 2 validation record](docs/phase2-validation.md)
- [Phase 3 validation record](docs/phase3-validation.md)

Older documents describe previous phases and may refer to organization-based APIs or planned components. Compare them with the current code and the integration gaps above. Historical validation is not evidence that the current working tree passes those checks.

No root license file is currently included. Add an explicit license before representing the repository as licensed for reuse.
