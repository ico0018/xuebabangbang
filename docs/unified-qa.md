# Independent QA — Unified user system

Date: 2026-10-08 (Asia/Shanghai)
Reviewer: independent QA agent; business files were not edited; no merge, deployment, or release approval performed.

## Result

**LOCAL IMPLEMENTATION QA: PASS.** Real PostgreSQL/API, tool regression tests, and offline sync/permissions tests passed on the commits below.

**TENCENT/COS DEPLOYMENT: BLOCKED / NOT VERIFIED.** This report does not certify cloud deployment, real SMTP delivery, Tencent COS, actual subdomain HTTPS cookies, or owner browser acceptance. Manager is handling deployment/UI and credentials.

## Exact commits

| Repository         | Feature commit tested                    |
| ------------------ | ---------------------------------------- |
| portal account/API | e5417c2f330f54c21ec7c366167cceb1a9b2365f |
| taskhelper         | 3a3a5f7a9d609fcae4a9bff41e1bc063c13951a9 |
| hanzi              | 94fe0ff29bb1fbc658a4ad94a9d231bd6e16bd7d |
| guwen              | bb193d1e4824e6abfe211700c812f28f45837deb |

All tested repositories use feature/unified-user-system. Tool trees were clean at final verification. Portal infrastructure files were owned by Manager and pending commit separately; account/API business code was at e5417c2.

## Real API evidence

`api-results.json`: 18/18 PASS against production-build `http://localhost:8320` and actual isolated PostgreSQL 17.10 `xueba_test`.

Covered registration; actual private development verification mail; sign-in and wrong-password denial; HttpOnly session cookies; forbidden client admin injection; guest/ordinary-user admin denial; Origin and missing-Origin CSRF denial; actual parent password validation; cross-user profile read/write/edit/switch denial; two children isolated; user export scoped to owned family; stale revision 409 preserves winning data; concurrent write one 200/one 409; tool schema/version/size rejection; atomic multi-tool import rollback on 409 and confirmed import; actual entitlement denial; parent-locked child timing/reminder/day rollover writes; forbidden sensitive plan write; nickname-confirmed child deletion plus cascade; admin disable/revoke/restore and audit rows; actual reset email link and session revocation; database-backed sign-in rate limit; logout-all invalidates both devices and current session.

`auth-extra-results.json`: 4/4 PASS for actual change-password, explicit sign-out, identical unknown-email/wrong-password public rejection, and expired server-side session denial.

`adapter-api-results.json`: 5/5 PASS with actual cloud adapter hitting the actual authenticated API/database: confirmed guest migration retains history; offline durable outbox survives engine restart and reconnects; fresh-device restore and multi-device 409 preserves both versions before explicit resolution; switch creates separate child cache; revoked session cannot upload but local dirty data survives.

`mail-adapter.ts`: 3/3 PASS for disabled provider refusing delivery, explicit development opt-in writing an actual usable link, and incomplete SMTP being not ready. Real SMTP delivery was not attempted.

## Tool/core evidence

- taskhelper: Vitest 6 files / 40 tests PASS; cloud runner 10/10 PASS; lint PASS; typecheck PASS.
- hanzi: original ordered daily word bank regression PASS; cloud runner 10/10 PASS; app/cloud-ui syntax PASS.
- guwen: original Node core tests 20/20 PASS; original Python tests 27/27 PASS; cloud runner 10/10 PASS; app/cloud-ui syntax PASS.
- Independent `sync-independent.test.cjs` + `parent-pin.test.cjs`: 33/33 PASS (three adapters, ten sync scenarios each, plus three parent PIN tests).
- Independent `parent-regression.ts`: 2/2 PASS for child starting a reminded task and advancing the next day without parent unlock.
- Portal policy/payload suite 10/10 PASS; lint PASS; typecheck PASS. Full production build performed by Developer and exercised independently through production-start API tests.
- Final Taskhelper preview build/UI is Manager's verification; QA did not rebuild a running preview.

Sync tests include persisted outbox and conflicts across restart, account/profile cache separation, user-confirmed migration with original guest history retained, in-flight local edits retaining dirty status, fresh-device restoration, explicit conflict resolution/recovery copies, real failure status after storage quota error, and no stale success status on save failure.

PIN tests verify length/confirmation, salted PBKDF2 rather than plaintext, unlock state expires/reset on new page, wrong PIN rejection and five-attempt delay, and actual account password endpoint invocation before unlock.

## Persistence/restore evidence

Manager actually restarted isolated PostgreSQL; independent `persistence.cjs` confirmed exact two users/two child profiles/one state including revision+payload, SHA256 unchanged:
`0c20505dcde65d15459eb945a98bce029caf9159beeb5aabd7b24903a53ff560`.

Manager performed real PostgreSQL custom-format pg_dump / pg_restore --exit-on-error to a new isolated restore database. QA reviewed `backup-restore-results.json`: all 11 tables match row counts and sorted full-row hashes. Dump SHA256:
`23affb28799962355231799d28f9e39bac940242436208549ba7ecc5f195487b`.

These are actual local persistence/restore results, not COS backup or Tencent server evidence.

## Defects independently caught and retested

1. Parent gate blocked child start after reminder and next-day automatic penalty settlement: fixed; independent two regressions PASS, real API learning writes PASS.
2. Malformed static payload was accepted and persisted: fixed; actual schema/version/size API rejection PASS.
3. PostgreSQL JSONB reorders object keys, causing false parent-only classification of unchanged task definitions: fixed using deep equality; actual unprivileged learning PUT PASS.
4. Client JSONB key-order comparisons and no-child/guest focus reload loops: Developer fixed and added regressions; final cloud suites PASS.
5. Storage quota could leave stale cloud-success text: fixed; independent three-adapter quota scenario verifies retained old data and failure status PASS.

Earlier failed/interrupted development iterations are not marked PASS. Final evidence is from the final commits and stable production build. The one-minute rate-limit wait was intentional; limits were not disabled for testing.

## Remaining gates

- Tencent isolated server access/deployment, running server evidence and public/SSH-tunnel review URL.
- Real Tencent COS upload/read/delete and backup-to-COS verification.
- Production SMTP provider/delivery.
- Actual deployed HTTPS cross-subdomain cookie/CORS behavior.
- Owner manual acceptance and explicit permission before merging main or changing production/DNS.

DNS and production were not changed by QA.
