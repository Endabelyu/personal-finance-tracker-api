FROM node:20-alpine
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (need devDeps for build + tsx)
RUN npm ci --legacy-peer-deps

# Copy all source files
COPY . .

# Build the React Router app (generates build/client + build/server)
RUN npm run build

# Expose the port
EXPOSE 3005

# Set environment
ENV NODE_ENV=production
ENV PORT=3005

# Start the Hono custom server
CMD ["npm", "start"]
