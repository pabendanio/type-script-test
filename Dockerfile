# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy the source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies for smaller final image
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001 -G nodejs

# Adjust ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose app port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
