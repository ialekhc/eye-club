FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY packages/widget/package.json packages/widget/package.json
COPY packages/tryon-engine/package.json packages/tryon-engine/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci
COPY . .
RUN npm run assets:setup && npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /app/client/.next/standalone ./
COPY --from=builder --chown=node:node /app/client/.next/static ./client/.next/static
COPY --from=builder --chown=node:node /app/client/public ./client/public
USER node
EXPOSE 3000
CMD ["node", "client/server.js"]
