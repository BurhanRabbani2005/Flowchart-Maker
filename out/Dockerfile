# Runtime image for the prebuilt standalone app in this folder.
# Rebuilds better-sqlite3 for the container CPU/OS.
FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/data
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /data \
  && chown nextjs:nodejs /data

COPY --chown=nextjs:nodejs . .

RUN npm rebuild better-sqlite3 \
  && apt-get purge -y python3 make g++ \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

USER nextjs
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "server.js"]
