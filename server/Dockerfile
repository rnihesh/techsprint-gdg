FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist ./dist
COPY serviceAccountKey.json* ./

# Expose port
EXPOSE 3001

# Start command
CMD ["node", "dist/index.js"]
