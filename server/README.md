# API service

The NestJS REST service contains Swagger/OpenAPI, Prisma persistence, DTO validation, JWT access/refresh authentication, membership-based tenant guards, role guards, product and asset management, calibration, organizations/team invitations, analytics, billing usage, API keys and widget/public catalogue endpoints. It is deliberately separate from the browser-only fitting engine.

Password verification uses Argon2id and refresh tokens are hashed, rotated and revocable. Public endpoints have a bounded in-memory rate guard. No frontend organization identifier is trusted: `x-organization-id` is checked against the authenticated membership on every protected request.

Run from the monorepo root after dependencies are installed:

```sh
npm run prisma:generate --workspace=@eyewear/api
npm run prisma:validate --workspace=@eyewear/api
npm run build --workspace=@eyewear/api
```

Apply the initial schema and optional demo account with:

```sh
export DATABASE_URL='postgresql://eyewear:eyewear@localhost:5432/eyewear?schema=public'
pnpm --dir server exec prisma migrate deploy
SEED_OWNER_PASSWORD='change-this-demo-password' pnpm --dir server prisma:seed
```

The seed requires a password of at least 12 characters and is intended for local development only. See [the architecture plan](../../docs/architecture.md).

The API has a standalone `pnpm-lock.yaml` because the root npm lockfile predates this workspace. Prisma validation, client generation, TypeScript checking and `nest build` now pass through that lockfile. Migrations are committed under `prisma/migrations`; production deployment should add PostgreSQL-backed integration tests and replace local object storage with an S3-compatible signed-upload adapter.
