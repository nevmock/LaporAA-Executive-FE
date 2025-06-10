# Tahap 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Salin package.json dan package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Salin semua source code
COPY . .

# Build aplikasi
RUN npm run build

# Tahap 2: Production image
FROM node:20-alpine AS runner

# Atur direktori kerja
WORKDIR /app

# Install hanya production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Jalankan aplikasi
CMD ["npm", "start"]
