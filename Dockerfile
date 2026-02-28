# # Production Dockerfile for Personal Finance Tracker
# FROM node:20-alpine

# WORKDIR /app

# # Copy package files
# COPY package.json package-lock.json ./

# # Install all dependencies
# RUN npm ci --legacy-peer-deps

# # Copy source files
# COPY . .

# # Build the application
# RUN npm run build

# # Expose the port
# EXPOSE 3005

# # Set environment
# ENV NODE_ENV=production
# ENV PORT=3005

# # Start the application using Hono server
# # Start the application using tsx (for TypeScript server)
# CMD ["npx", "tsx", "server/index.ts"]
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy pre-built output from CI (no build step needed here)
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

COPY build/ ./build/

EXPOSE 3005
CMD ["node", "build/server/index.js"]
