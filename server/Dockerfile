FROM node:18-alpine AS builder
WORKDIR /app

# Install full dependencies for build
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy built files and service account
COPY --from=builder /app/dist ./dist
COPY serviceAccountKey.json* ./

# Expose port
EXPOSE 3001

# Start command
CMD ["node", "dist/index.js"]
