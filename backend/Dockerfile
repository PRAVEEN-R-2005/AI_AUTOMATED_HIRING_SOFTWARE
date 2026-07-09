# Use official Node.js LTS slim base image
FROM node:20-slim

# Set non-root environment variables
ENV NODE_ENV=production

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install only production dependencies to keep the image slim
RUN npm ci --omit=dev

# Copy the rest of the application source code
COPY . .

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start the application using node
CMD ["npm", "start"]
