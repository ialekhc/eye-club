# Eye Club

Eye Club is a multi-brand eyewear storefront with private virtual try-on. Shoppers can browse frames from different brands, filter the collection, save favorites, add products to a bag, and fit a frame to a photo locally in the browser.

The repository also contains the merchant foundation: a NestJS API, PostgreSQL/Prisma schema, tenant-scoped product catalogue, frame asset upload, calibration, analytics, widget configuration, and a merchant products dashboard.

## What works today

- Customer storefront at `/`
- Brand and category filters
- Product favorites and a client-side shopping bag
- Checkout handoff placeholder ready for Stripe, Shopify, or brand-owned checkout
- Live camera mirror and private photo try-on at `/try-on`
- On-device MediaPipe face detection and frame fitting
- Merchant catalogue management at `/dashboard/products`
- Multi-tenant API and PostgreSQL schema for products, brands, categories, assets, and memberships
- Docker Compose services for PostgreSQL, API, and web

The storefront currently uses the 12 included sample frame assets so it works immediately without a database. The API-backed public catalogue is available for a merchant collection through `/?organization=<organization-slug>`.

## Requirements

- Node.js 22 or newer
- npm 11 or newer
- Chrome or Chromium for the verified try-on experience
- Internet access for package installation and the first MediaPipe model download
- Docker Engine and Compose v2 for the full API/database stack

## Quick start: storefront demo

Run these commands from the repository root:

```sh
npm ci
npm run assets:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The shop is the home page. Browse the collection, filter by brand or category, open the bag, or select **Try on** to open the fitting room.

The try-on flow accepts JPG, PNG, and WebP photos. Photos and face landmarks stay in browser memory and are not uploaded.

## Commands

```sh
npm run dev          # Start the Next.js web app
npm run lint         # Run ESLint
npm run typecheck    # Check the engine, UI, web, and widget packages
npm test             # Run Vitest tests
npm run build        # Build the production web app with webpack
npm start            # Start the production web app after building
```

To regenerate the included transparent frame PNGs:

```sh
node scripts/render-sample-frame.mjs
```

## Environment variables

The storefront demo has working defaults. For API-backed catalogue data, create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_VISION_WASM_PATH=/vision
NEXT_PUBLIC_FACE_MODEL_PATH=/models/face_landmarker.task
```

`NEXT_PUBLIC_API_URL` is only needed when using the API services. The MediaPipe paths are public build-time values and should remain same-origin.

## Full local stack with Docker

Start PostgreSQL, the API, and the web app with:

```sh
docker compose config --quiet
docker compose up --build
```

The services are:

| Service | URL | Purpose |
| --- | --- | --- |
| Web | `http://localhost:3000` | Customer storefront and try-on |
| API | `http://localhost:4000` | Merchant and public catalogue API |
| PostgreSQL | `localhost:5432` | Tenant and product data |

The API runs Prisma migrations before startup. Docker must be running before executing Compose commands.

### Create a demo merchant catalogue

The seed profile is opt-in so production startup never creates demo credentials. Set a password with at least 12 characters, then run:

```sh
SEED_OWNER_PASSWORD='your-local-password' docker compose --profile seed run --rm seed
```

The seed output supplies the organization and owner details. Use those values to sign in at `/dashboard/products`, create brands/categories and add products. A product needs a transparent frame asset and calibration before it can be published.

## Merchant workflow

1. Sign in at `/dashboard/products` with the seeded owner account and organization ID.
2. Create a product with name, SKU, type, product URL, and optional brand/category data through the API.
3. Upload a transparent PNG or WebP frame asset.
4. Calibrate its eye anchors in the fitting studio.
5. Publish the product after calibration.
6. Link customers to `/?organization=<organization-slug>` or embed the widget using the configured public key.

The merchant API is tenant-scoped. Frontend organization identifiers are routing inputs only and are not authorization credentials.

## API smoke test

After starting the full stack and creating the seed organization:

```sh
SEED_OWNER_PASSWORD='your-local-password' \
SMOKE_ORGANIZATION_ID='organization-id' \
node scripts/api-smoke.mjs
```

The smoke test covers login, organization access, tenant rejection, product listing, refresh-token rotation, and refresh-token replay rejection.

## Production notes

- Replace the in-memory public rate limiter with Redis or another shared limiter before horizontal scaling.
- Connect the checkout button to the chosen payment provider and order service before accepting payments.
- Move frame assets from local storage to S3-compatible object storage for multi-instance deployments.
- Add a real storefront catalogue endpoint that returns brand, category, price, currency, inventory, and fulfillment fields when the database becomes the source of customer-facing products.
- Run `npm run build` and the API/database validation checks in CI before deployment.

## Repository layout

```text
client/                 Next.js storefront, try-on studio, merchant pages
server/                 NestJS tenant API and Prisma integration
server/prisma/          PostgreSQL schema, migrations, and seed
packages/tryon-engine/    Pure geometry, calibration, face adapter, renderer
packages/ui/              Shared UI components
packages/widget/              Embeddable storefront/try-on widget boundary
scripts/                  Asset setup, rendering, and API smoke checks
docs/                     Architecture and validation records
```

## Privacy

Customer photos are processed in browser memory. There is no photo upload endpoint in the try-on flow, no photo persistence, and no external face inference service. Virtual placement is an approximate visual preview, not a physical measurement or guarantee of fit.
Live camera mode requires HTTPS (or localhost) and camera permission. Start the camera on `/try-on`, then select frames from the collection. Tracking runs locally in VIDEO mode. Stop, switch to photo mode, hide the page, or leave the route to release the camera. Current assets provide a 2D frontal overlay, not full 3D occlusion.
