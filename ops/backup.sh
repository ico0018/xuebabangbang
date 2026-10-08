#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
file="backups/preview-${stamp}-${RANDOM}.dump"
docker compose --env-file .env.preview -f compose.preview.yml exec -T db pg_dump -U xueba -d xueba_preview -Fc > "$file"
test -s "$file"
sha256sum "$file" > "$file.sha256"
docker compose --env-file .env.preview -f compose.preview.yml exec -T db pg_restore --list < "$file" > "$file.list"
# This uploads only the new backup. It does not delete any COS object.
docker compose --env-file .env.preview -f compose.preview.yml run --rm --no-deps -v "$PWD/backups:/backups:ro" app node ops/cos.cjs upload-backup "/backups/$(basename "$file")"
printf 'Backup created: %s\n' "$file"
