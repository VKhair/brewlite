FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/api apps/api
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build:api

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/scripts apps/api/scripts
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts apps/api/prisma.config.ts

EXPOSE 3001
CMD ["sh", "-c", "npm run db:setup --workspace=api && npm run start:prod --workspace=api"]
