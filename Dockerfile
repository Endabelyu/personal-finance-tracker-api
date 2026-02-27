# Production Dockerfile for Personal Finance Tracker
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci --legacy-peer-deps

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (needed for SSR with React 19)
RUN npm ci --legacy-peer-deps

# Copy built application from builder
COPY --from=builder /app/build ./build

# Expose the port
EXPOSE 4000

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Start the application
CMD ["node", "build/server/index.js"]
