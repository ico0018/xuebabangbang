#!/usr/bin/env bash
set -euo pipefail
# A failed configuration check stops here and preserves the running Nginx workers.
sudo -n /usr/sbin/nginx -t
exec sudo -n /usr/bin/systemctl reload nginx
