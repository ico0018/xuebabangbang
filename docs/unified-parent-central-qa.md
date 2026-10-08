# Central parent controls — independent QA

Status: FINAL PASS (local candidate checks and actual Tencent preview browser).

Exact business commits: Taskhelper `9e9c98bbb8f9059a471451116cbbed86985dc08b`; Hanzi `5af788877c523fa2b0e563ae171845aee3fce3f9`; Guwen `d9fcc04e721ff89e1333cea3915e89e270c965fb`. Portal/API business was unchanged for this follow-up. Manager applied the preview Nginx framing policy separately.

## Independent local checks

`parent-central-controls-unit.cjs` passed 13 checks directly against the final source. They cover student DOM removal while cloud storage still starts, exact origin/direct-parent source/type-only guest activation, rejection of record/action/URL fields, signed-lock immunity including initialization races, embedded operation buttons without duplicate child selectors or exits, and explicit inline confirmation/cancellation without window.confirm.

Applicable final regression checks passed: Task43 tests, lint, typecheck, cloud11; each static parentUI8/cloud11/syntax; Hanzi original word-bank checks. See `parent-central-controls-local-results.json`. Developer built the final static output; independent QA did not claim another build execution.

## Actual deployed browser checks

`parent-central-controls-browser-results.json` records eight PASS groups in actual Chrome through the existing localhost8320–8323 Tencent preview tunnel, with zero browser errors:

- Widths375/768/1440: Hanzi welcome and actual index.html?book=3-upper learning page, plus Guwen student page, contain no parent entry or record-management controls. Background cloud storage starts normally.
- Central Task parent page contains actual own-origin Hanzi/Guwen widgets, one child selector and one exit, and reuses the current signed grant without another arithmetic question/password.
- Both widgets import their respective original localStorage records only after visible inline confirmation. Cancelling retains the server payload and revision. Server readback after import exactly matches each payload and the client revision; real downloads succeed and original guest keys remain.
- Hanzi conflict backup contains both candidates; cancelling recovery preserves the conflict/server state, and confirming recovery restores the cloud version while retaining the original guest keys.
- One central child selector reloads both widgets; other-child learning baselines remain separate and switching back restores imported records.
- Explicit exit clears the server grant and widgets. Direct embedded parameters, a new login, and forged activation messages cannot grant signed readiness or server export.
- Actual guest arithmetic opens both export widgets with one question and one central exit.
- Actual parent response CSP is exactly `frame-ancestors http://localhost:8323` on both tool origins.

`parent-central-controls-isolation-results.json` adds two focused PASS groups: six complete server-state comparisons across two children and two tools retain payload/revision/schema through actual central switching, including a legitimate null/empty state; both widgets paint readable controls after scrolling into the viewport. It stores button text, computed visibility and nonzero geometry.

Visually inspected evidence: `screenshots/parent-central-hanzi-frame.png`, `screenshots/parent-central-guwen-frame.png`, and updated `screenshots/parent-central-mobile.png`. The updated mobile overview shows both complete panels. Each tool also has an individual viewport screenshot.

## QA diagnostics and boundaries

The first run incorrectly assumed an empty cloud payload after visiting the real Hanzi learning page, which normally initializes a practice entry. The test now compares exact before/after snapshots and uses the other untouched child for migration; it does not ignore arbitrary fields. The second run used an insufficient reload wait: during iframe startup, the temporary guest getter matched the seed while dirty defaulted false. Final waits require the selected child identity, cache key, nonzero revision, clean state and no busy upload, then verify the real server response. Those diagnostic failures remain in `parent-central-controls-first-fixture-failure.json` and `parent-central-controls-second-startup-failure.json`; they were QA assumptions rather than confirmed product failures.

The early full-page screenshot had an offscreen Guwen iframe not painted. Explicit viewport scrolling, visible-control assertions, individual iframe images and the final full-page image confirmed both actual panels. This was a screenshot timing issue, not a blank deployed widget.

All final evidence avoids generated email/password/token storage. Only new QA accounts/children were used. No business edits, SSH, deployment, merge or production release were performed by QA. Existing portal/admin/SMTP/COS recovery checks were not rerun for this static UI follow-up. User manual acceptance and main merge remain separate pending gates.
