# -------------------------------------------------------------
# StickTheBizz Backend Dockerfile for Render / Railway / Cloud
# -------------------------------------------------------------

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json ./

# Install all dependencies
RUN npm install

# Copy source code and schema
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

# Generate Prisma Client & Compile TypeScript
RUN npx prisma generate
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Copy package and install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

EXPOSE 8000

CMD ["node", "dist/server.js"]

