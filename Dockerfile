FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_HANZI_URL
ARG NEXT_PUBLIC_GUWEN_URL
ARG NEXT_PUBLIC_TASKHELPER_URL
ENV NEXT_PUBLIC_HANZI_URL=$NEXT_PUBLIC_HANZI_URL NEXT_PUBLIC_GUWEN_URL=$NEXT_PUBLIC_GUWEN_URL NEXT_PUBLIC_TASKHELPER_URL=$NEXT_PUBLIC_TASKHELPER_URL NEXT_TELEMETRY_DISABLED=1
# Build-only value; runtime env_file supplies an independent random session secret.
RUN BETTER_AUTH_SECRET=build-only-placeholder-xxxxxxxxxxxxxxxxxxxxxxxx BETTER_AUTH_URL=http://localhost:8320 npm run build
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/mail-outbox /app/.next/standalone/.next && chown node:node /app/mail-outbox && cp -r /app/public /app/.next/standalone/public && cp -r /app/.next/static /app/.next/standalone/.next/static
USER node
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
