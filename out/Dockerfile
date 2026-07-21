# Serves the prebuilt Next.js standalone app already in this folder.
# Does NOT run `next build`. Linux native SQLite binaries are included as prebuilds.
FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/data
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /data \
  && chown nextjs:nodejs /data

COPY --chown=nextjs:nodejs . .

USER nextjs
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "server.js"]
