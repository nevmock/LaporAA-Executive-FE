# Tahap 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Salin package.json dan .npmrc untuk konfigurasi npm
COPY package.json .npmrc ./

# Install dependencies
RUN npm install

# Dockerfile (frontend / Next.js)
ARG NEXT_PUBLIC_BE_BASE_URL
ENV NEXT_PUBLIC_BE_BASE_URL=$NEXT_PUBLIC_BE_BASE_URL

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

EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]
