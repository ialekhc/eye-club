FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY packages/tryon-engine/package.json packages/tryon-engine/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/widget/package.json packages/widget/package.json
RUN npm ci
COPY . .
RUN npm run db:generate && npm run build:api && npm prune --omit=dev --ignore-scripts

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=4000 STORAGE_LOCAL_DIR=/app/.data/objects
COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server ./server
RUN mkdir -p /app/.data/objects && chown -R node:node /app/.data
USER node
EXPOSE 4000
CMD ["sh", "-c", "npm run db:migrate && node server/dist/main.js"]
