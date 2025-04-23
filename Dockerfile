FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json ./
# Copy prisma schema first, so it exists when postinstall runs
COPY prisma ./prisma/

# Use the flag to allow build scripts and also specify the schema in env var
ENV PRISMA_SCHEMA_PATH=/app/prisma/schema.prisma
RUN pnpm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Generate Prisma client with explicit schema path
ENV PRISMA_SCHEMA_PATH=/app/prisma/schema.prisma
RUN pnpm prisma generate

# Next.js collects completely anonymous telemetry data about general usage
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Update next.config.js with output: 'standalone' if it doesn't exist
RUN if [ ! -f next.config.js ]; then \
    echo '/** @type {import("next").NextConfig} */ \
    const nextConfig = { \
      reactStrictMode: false, \
      crossOrigin: "anonymous", \
      output: "standalone", \
      typescript: { \
        ignoreBuildErrors: true, \
      }, \
      eslint: { \
        ignoreDuringBuilds: true, \
      }, \
      images: { \
        remotePatterns: [ \
          { \
            protocol: "https", \
            hostname: "**", \
          }, \
        ], \
      }, \
      async headers() { \
        return [ \
          { \
            source: "/:path*", \
            headers: [ \
              { key: "Access-Control-Allow-Credentials", value: "true" }, \
              { key: "Access-Control-Allow-Origin", value: "*" }, \
              { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" }, \
              { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }, \
            ], \
          }, \
        ]; \
      }, \
    }; \
    module.exports = nextConfig;' > next.config.js; \
    fi

RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy node_modules with Prisma client
COPY --from=builder /app/node_modules ./node_modules

# Ensure proper ownership of the .next directory
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# Set environment variable for Prisma schema path
ENV PRISMA_SCHEMA_PATH=/app/prisma/schema.prisma

USER nextjs

EXPOSE 5000

ENV PORT 5000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 