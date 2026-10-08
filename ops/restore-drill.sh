#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
file=${1:?Pass an explicit preview dump path}
test -s "$file"
umask 077
restore_db="restore_drill_$(date -u +%Y%m%d%H%M%S)_${RANDOM}"
compose=(docker compose --env-file .env.preview -f compose.preview.yml)
"${compose[@]}" exec -T db createdb -U xueba "$restore_db"
"${compose[@]}" exec -T db pg_restore -U xueba --exit-on-error --no-owner -d "$restore_db" < "$file"
counts() {
  "${compose[@]}" exec -T db psql -U xueba -d "$1" -At -v ON_ERROR_STOP=1 -c "SELECT format('SELECT %L, count(*) FROM %I;', tablename, tablename) FROM pg_tables WHERE schemaname='public' ORDER BY tablename" |
    "${compose[@]}" exec -T db psql -U xueba -d "$1" -At -v ON_ERROR_STOP=1
}
counts xueba_preview > "$file.current-counts"
counts "$restore_db" > "$file.restored-counts"
# Run immediately after a preview-only maintenance backup so no new writes occur.
# Any mismatch exits as failure; it is never reported as a successful drill.
cmp "$file.current-counts" "$file.restored-counts"
cat "$file.restored-counts"
printf 'Restore counts match. Isolated database retained for inspection: %s\n' "$restore_db"
