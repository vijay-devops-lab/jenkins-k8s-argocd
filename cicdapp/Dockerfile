# # Build stage
# FROM node:18 AS builder
# WORKDIR /app
# COPY . .

# # Production stage
# FROM node:18-alpine
# WORKDIR /app
# COPY --from=builder /app .
# EXPOSE 3000
# CMD ["node", "index.js"]

# Build stage
FROM node:18 AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

# Runtime stage
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000
CMD ["node", "index.js"]
