# Phase 3 validation record

The initial API foundation is present under `apps/api`:

- NestJS application bootstrap with `/api/v1` prefix and Swagger at `/docs`.
- Prisma schema for organizations, memberships, roles, catalogue products, assets, calibrations, try-on sessions, favorites and privacy-conscious usage events.
- DTO whitelist/transform validation.
- JWT access-token guard.
- Membership-based tenant guard. The `x-organization-id` header is only a requested scope; it is never accepted without a matching authenticated membership or explicit SUPER_ADMIN status.
- Role guard and tenant-scoped product list/create endpoints.
- Tenant-scoped product update and archive endpoints; archive is a reversible inactive state rather than a destructive delete.
- Tenant-scoped asset metadata registration and calibration upsert endpoints. Binary upload transport remains behind the storage adapter boundary.
- Multipart PNG/WebP uploads through a local object-storage adapter with magic-byte, alpha, dimension, size and SHA-256 validation. The adapter can be replaced by S3-compatible storage without changing product controllers.
- Pure tenant-scope tests covering injected organization filters and normalized identifiers.
- Argon2id password verification wiring.
- Rotating, hashed refresh-token persistence with refresh and logout endpoints.
- Organization list/create endpoints plus tenant-scoped member listing, invitations for registered users, and owner/admin role management.
- Expiring public try-on sessions, privacy-conscious event collection, session favorites, and tenant-scoped analytics overview aggregates.
- Tenant-scoped widget configuration CRUD with generated public keys, enabled state, and validated allowed origins.
- Public widget configuration requests enforce the stored `Origin` allowlist; API responses include baseline security headers and explicit CORS methods/headers.
- Public session, event, favorite and widget-config routes have an isolated rate-limit guard; replace its in-memory bucket with a distributed store before multi-instance deployment.
- The API container now runs `prisma migrate deploy` before NestJS startup and stores local frame objects under the configured `STORAGE_LOCAL_DIR` in development.

The API validation gate passes with NestJS 12, Prisma 6.16 and TypeScript:

```sh
npm run prisma:generate --workspace=@eyewear/api
npm run prisma:validate --workspace=@eyewear/api
npm run build --workspace=@eyewear/api
```

The equivalent commands were run through the API's standalone pnpm lockfile because the root npm lockfile predates this workspace. Prisma validation, Prisma Client generation, TypeScript checking and `nest build` all pass. The seed command is configured as `prisma.seed` and requires `SEED_OWNER_PASSWORD`; it has not been run against a live database. `docker compose config --quiet` also passes; the Docker daemon itself was unavailable for an image run.

Refresh-token rotation/revocation and account invitations are implemented. Before production release, add PostgreSQL-backed integration tests with two organizations, password recovery, distributed login/public throttling, and an S3-compatible signed-upload adapter. The browser can use the public catalogue API while merchant administration remains authenticated and tenant-scoped.
