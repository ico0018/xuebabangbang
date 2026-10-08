# Public IP HTTPS preview — independent QA

Local candidate gate: PASS. Public exterior browser gate: BLOCKED — Windows public443 navigation timed out without HTTP/TLS response.

Exact source heads and independent checks are in public-ip-local-results.json. Portal business build is fa06078; final ops-only Host421 guard is 0a67d2c. Task public path source is97ea361; Hanzi docs HEAD456fb60 retains business5af7888; Guwen remainsd9fcc04. All are feature candidates; no merge was performed.

Independent local checks: public-ip-unit.cjs4 plus parent-central-controls-unit.cjs13 PASS. They cover clean HTTPS IP auth, refusing remote HTTP/IP domain cookies, prefix-preserving widget URLs, trusted proxy IP header boundaries, Host421 template isolation, and existing strict message/gate/confirmation controls. Portal business19 tests/lint/typecheck PASS and final Host guard separately verified; Task45/lint/typecheck/cloud11 and each static parentUI8/cloud11 PASS. Artifact inspection proves25 absolute references across exported root/parent HTML retain /taskhelper, the prefixed icon exists, and compiled configuration includes the three intended public URLs. Builds were Developers' execution, not additional independent QA builds.

Prepared exterior Windows Chrome tests deliberately retain normal certificate validation. They will inspect TLS certificate metadata, Secure/HttpOnly host-only session cookies, portal application links, actual UI registration/login and unverified normal use, all public path assets, central own-path iframe controls, real import/cancel/download/conflict/recovery, two-child isolation, public task creation and login restoration, locks, other-user404/admin403, HTTP redirect only, real source/test files404 and unknown Host421. Only synthetic accounts are used; generated passwords/emails/cookies/tokens are never written to results or auth screenshots.

public-ip-auth-rate.cjs is a focused post-functional check: varied fake forwarding/client-IP headers with synthetic nonexistent logins must still reach429 in the shared throttle. If the IP bucket is already exhausted at the start, the test reports BLOCKED rather than claiming PASS.

QA does not SSH, deploy, merge or edit business sources. Trusted public TLS/exterior connectivity and these actual public browser results are not claimed until execution. SMTP/COS, future certificate renewal, main/dev merge and user manual acceptance remain separate gates.

## Exterior read-only connectivity probe

Independent Windows Chrome, normal certificate validation (ignoreHTTPSErrors=false), navigated once to https://134.175.136.31/api/health. The navigation timed out at20000ms without HTTP response or TLS certificate metadata. Public browser gate is BLOCKED on reachability; this does not establish a certificate error or a working publicly trusted certificate. No fixture/account/auth writes were performed. Evidence public-ip-readonly-probe-results.json. Manager's internal TLS health success is distinct from this exterior result. Functional and rate tests wait for a reachable PUBLIC DEPLOY READY.
