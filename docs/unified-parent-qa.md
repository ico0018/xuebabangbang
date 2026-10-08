# Parent simplification — independent QA

## Local gate: PASS

Validated 2026-10-08 against exact feature commits:

| Repository | Commit |
| --- | --- |
| portal | 81abd4a89b9f37295c7e8c5c3aa64940b8a5eb61 |
| taskhelper | aeded818f3efb716624257b354cb9624c148669e |
| hanzi | ffaa0b705497b2371889f5a3783c7bc5aa5dc77f |
| guwen | 16e652916600247c34d7187939e4cb93a1405f2a |

Independent local PostgreSQL database `parent_qa_1791446607876` and the actual production auth/API handlers on the QA HTTP server passed all six groups in `parent-simplification-api-results.json`. Wrong answers, signature tampering, a second login of the same account, and extra request fields were refused. Correct answers enabled actual child/task creation and export. A backdated marker 17 minutes old retained permission only while the actual login remained valid. Other users received 404 for this family's records. Administrator access still required both the role and email verification. A new login cleared the parent grant while preserving cloud records.

Independent challenge tests passed four groups, including randomized questions, three unique choices, one correct choice, expiry, session binding, 16-minute continuation and rolling-session semantics. Independent tool permission tests passed four groups, including guest refresh persistence and explicit exit, signed-in accounts without a selected child, stale guest grants and friendly wrong-answer messages. A cross-realm assertion in the QA VM harness was normalized before the final run; no product change was needed.

Applicable existing regression checks passed: portal 17 tests plus lint and typecheck; taskhelper 40 tests plus lint, typecheck and 11 cloud tests; hanzi original word-bank checks, 11 cloud tests and four parent UI tests; guwen 20 Node tests, 27 Python tests, 11 cloud tests and four parent UI tests. Final builds were performed by the developers and Manager; independent QA did not claim an additional build run.

## Deployment/browser gate: PASS

After Manager reported DEPLOY READY, independent headless Chrome used the actual Tencent isolated preview through the existing localhost 8320–8323 tunnel. Eight browser groups passed with no page errors. Actual registration and two-child creation, all three screen widths (375/768/1440), student pages without record-management controls, same-origin parent pages without repeated verification, task creation and cloud roundtrip, a browser clock advance of 17 minutes, guest import and conflict download with both versions, explicit cloud recovery, child switching, cross-account denial and logout/login restoration all passed. See `parent-simplification-browser-results.json`. The 17-minute browser check is a simulated clock advance; the complementary local real-API check backdates the server marker while retaining a valid login, rather than claiming an elapsed wall-clock wait. Mobile screenshots were visually inspected: `screenshots/parent-simplification-hanzi-mobile.png` and `screenshots/parent-simplification-task-mobile.png` show readable controls without horizontal overflow.

The initial cloud navigation was blocked by a stopped local tunnel before any test account was created; Manager restored it and the full subsequent run exited successfully. No SSH connection, deployment, merge or release action was performed by QA. Real SMTP/COS acceptance, production release and human acceptance remain outside this PASS.

