FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/api apps/api
# Prisma đọc cấu hình khi sinh client. Bước này không kết nối cơ sở dữ liệu.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/brewlite_build npm run build:api

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ADD https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/rds-ca.pem
ENV NODE_EXTRA_CA_CERTS=/app/rds-ca.pem
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/scripts apps/api/scripts
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts apps/api/prisma.config.ts

EXPOSE 3001
CMD ["sh", "-ec", "node apps/api/scripts/migrate.cjs; if [ \"$BREWLITE_SEED_ON_START\" = true ]; then node apps/api/scripts/seed.cjs; fi; exec node apps/api/dist/main"]
