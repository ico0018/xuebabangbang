#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# This script exclusively manages the named preview Compose project, never the existing portal service.
case "$PWD" in /srv/xuebabangbang-unified-preview/portal) ;; *) echo 'Run only in isolated /srv/xuebabangbang-unified-preview/portal'; exit 1;; esac
test -f .env.preview || { echo 'Configure private .env.preview first'; exit 1; }
command -v docker >/dev/null || { echo 'Docker must be installed first'; exit 1; }
docker compose version
compose=(docker compose --env-file .env.preview -f compose.preview.yml)
"${compose[@]}" config --quiet
"${compose[@]}" build app
"${compose[@]}" up -d db
for attempt in $(seq 1 30); do
  if "${compose[@]}" exec -T db pg_isready -U xueba -d xueba_preview >/dev/null; then break; fi
  sleep 2
done
"${compose[@]}" run --rm app npm run db:migrate
"${compose[@]}" up -d app
for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:3200/api/health >/dev/null; then
    "${compose[@]}" ps
    echo 'Preview application healthy. Configure only nginx.preview.conf after nginx -t.'
    exit 0
  fi
  sleep 2
done
echo 'Preview health check failed; existing production remains unchanged.'
exit 1
