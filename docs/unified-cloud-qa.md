# Tencent preview — independent closeout evidence review

Date: 2026-10-08 (Asia/Shanghai)
Reviewer: independent QA. Scope was read-only review of saved evidence and implementation; QA made no SSH connection, deployment, merge, database mutation, or production/DNS change.

## Decision

**PASS — isolated Tencent preview evidence/security review.** No remaining blocker was found for owner review through the local SSH tunnel. This is not production release approval.

**NOT VERIFIED / WAITING:** real COS upload/read/delete and offsite backup, SMTP delivery, deployed production-domain HTTPS/cross-subdomain cookie behavior, ICP/Tencent filing, and owner's manual acceptance. COS missing configuration is explicitly recorded as failure/not configured. Backups currently use the explicitly selected local target only.

## Reviewed cloud functional evidence

- `cloud-security-results.json` and matching executable test: actual verification mail, wrong password rejection, HttpOnly/Lax cookie, forbidden client role injection, non-admin rejection, cross-user read/write refusal, Origin refusal, retained remote data after 409, invalid payload refusal, actual password reset/session revocation, old password refusal and sign-out invalidation.
- `cloud-browser-sync-results.json` and matching test: browser-driven child switching/caches, retained guest history, browser offline dirty outbox/reconnect, independent browser context cloud restore, same account/profile across tools, actual taskhelper parent password gate/task creation/cloud save/child task display; no browser errors.
- `cloud-admin-results.json` and matching test: authenticated mobile administrator UI, admin write rejection before password unlock, successful disable/restore/revoke with audit records.
- `cloud-ui-smoke.json`: six anonymous routes render without overflow at 320/390/768/1440px; mismatched registration passwords are rejected. This anonymous smoke alone does not certify logged-in account/admin layouts.
- The logged-in UI gap is covered separately by `cloud-account-ui-results.json` (owner's real child list, 390px, no overflow/errors) and the authenticated mobile admin test.

QA audited actual assertions in the matching `.cjs` test sources rather than interpreting the PASS labels alone. Those tests were run by Manager; this closeout did not rerun them or connect to the server.

## SSH tunnel and private development mailbox

Reviewed `runtime/cloud-tunnel.py`: fixed server address and username; previously authorized user-provided credential read from the specified prior user-message history; credential is not printed or stored in the helper; fixed known_hosts containing the expected server and RejectPolicy; SSH agent/key discovery disabled. Unrecognized host keys fail rather than being silently accepted. No claim is made that QA independently reauthenticated the original host-key fingerprint.

All five local listeners bind `127.0.0.1`. Mailbox exists only locally on port 8324 and reads the private cloud outbox over SSH. It accepts only the exact localhost/127.0.0.1 Host, rejects cross-site Fetch Metadata, rejects paths other than `/`, escapes email/subject/link output, restricts links to the preview localhost origin, suppresses HTTP access logging, sends no-store and forbids framing with CSP/X-Frame-Options. Its page explicitly says no real email is sent. It is intended for the owner using this trusted computer and tunnel, not a public mailbox or SMTP substitute.

Nginx config binds preview 8320–8323 to server loopback and proxies the app on loopback 3200. Compose publishes no database host port and uses a persistent DB volume. Static sites deny dotfiles, and the private runtime/mailbox/backup directories are outside their roots.

## Private backup and timer evidence

Reviewed `ops/backup.sh`: `set -euo pipefail`, umask077, private dump/checksum/list files, actual pg_dump custom archive and pg_restore listing, explicit `local` versus `cos` selection. Local mode says `Local-only backup; COS upload has not been performed`. COS mode passes private backup bytes through stdin into a temporary unprivileged container and fails when COS is not configured; it does not fall back to a fake successful offsite backup.

Reviewed service: User ubuntu, rootless Docker socket `/run/user/1000/docker.sock`, dedicated preview working directory, NoNewPrivileges. The repository service defaults to COS, so enabling it without credentials would fail. Manager closed that configuration gap with an explicit server-only local drop-in. Recorded effective timer/service evidence: enabled, User ubuntu, target local, manual Result success / ExecMainStatus0, journal explicitly local-only; next scheduled run is **2026-10-09 03:34:10 Asia/Shanghai** including up to 300 seconds random delay. The first future scheduled invocation has not happened yet; only its schedule and a successful manual invocation are verified.

Manager's server stat evidence records .env.preview0600 owned ubuntu, backups0700, dump0600, private mailbox directory0700. Mail writing uses0600; Dockerfile permanently sets the initial mailbox directory0700, and Manager applied the same mode to the existing volume. QA reviewed these records and source; QA did not issue stat over SSH itself.

## Independent artifact/hash checks

QA independently compared `cloud-before-restart.hashes`, `cloud-after-restart.hashes`, and `cloud-restored.hashes`: byte-identical table names, row counts and 32-character sorted full-row digests for all **11** public tables. `cloud-restore-result.txt` identifies a newly created isolated restore database `restore_drill_20261008030210_12297`; it does not overwrite the preview or production database.

QA independently hashed the downloaded private backup `preview-20261008T030210Z-26306.dump`. Its SHA256 matches server evidence:
`9f985af23444e771a353671e397ac170072ff5a03758fd9f9842e034fbdac7a6`.

The initial four source archives independently match every hash in `runtime/artifacts/manifest.json`. That initial portal package was7520cf7 with subsequent ops fixes96bccf0/81863a8. Manager is generating a new final manifest/build after the final permission/documentation change; final deployment commit identity must come from that updated manifest. This review does not label the older manifest as the final rebuilt package.

## State boundaries

`cloud-backup-server-results.json` records app/db healthy, rootless Docker limits768/512MiB, no published database port, loopback preview listeners, original services active, existing production homepage content hash unchanged, DNS unchanged and main not merged. The matching final-check script compares production hashes and checks original services; QA reviewed that evidence without connecting to production.

`cloud-cos-result.txt` explicitly contains `COS_BUCKET is not configured`, and recorded exit code is1. Therefore COS is not PASS. SMTP remains a private development file adapter only. No production-domain switch/HTTPS or filing verification was claimed.

No release or main-merge authorization is granted by this report. Owner review may proceed through the SSH tunnel while these external configuration/release gates remain explicit.
