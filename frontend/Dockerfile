FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm ci --maxsockets=2

FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=1024"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
