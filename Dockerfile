FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
RUN npm ci --ignore-scripts
COPY . .
RUN npm run db:generate && npm run build
ENV NODE_ENV=production PORT=3000 NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["node", "deploy/start.mjs"]
