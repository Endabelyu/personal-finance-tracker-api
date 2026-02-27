# Production Dockerfile for Personal Finance Tracker
FROM node:20-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built application
COPY build ./build

# Expose the port the app runs on
EXPOSE 4000

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Start the application
CMD ["node", "build/server/index.js"]
