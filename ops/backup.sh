#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
target=${1:-cos}
case "$target" in cos|local) ;; *) echo 'Use cos or local backup target'; exit 1;; esac
umask 077
mkdir -p backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
file="backups/preview-${stamp}-${RANDOM}.dump"
docker compose --env-file .env.preview -f compose.preview.yml exec -T db pg_dump -U xueba -d xueba_preview -Fc > "$file"
test -s "$file"
sha256sum "$file" > "$file.sha256"
docker compose --env-file .env.preview -f compose.preview.yml exec -T db pg_restore --list < "$file" > "$file.list"
# The default requires COS. Explicit local mode never claims an offsite backup.
# Pass bytes through stdin so the unprivileged container user can read private host backups.
if [ "$target" = cos ]; then
  docker compose --env-file .env.preview -f compose.preview.yml run --rm --no-deps -T app sh -c 'umask 077; cat > /tmp/preview-backup.dump; node ops/cos.cjs upload-backup /tmp/preview-backup.dump' < "$file"
else
  printf 'Local-only backup; COS upload has not been performed.\n'
fi
printf 'Backup created: %s\n' "$file"
