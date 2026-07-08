# Quality Assurance Bug Registry — Phase 17

This registry tracks all bugs discovered, analyzed, prioritized, fixed, and verified during the Phase 17 Independent QA Audit.

---

## 1. Discovered Bugs Registry

### Bug ID: BUG-17-001
* **Severity**: **P0 — RELEASE BLOCKER**
* **Module**: Security Audit Logger (`backend/utils/auditLogger.js`)
* **Description**: Writing audit trail log entries for anonymous/unauthenticated events (such as register invites acceptances, login errors, or initial demo bypass steps) triggers a database constraint error:
  `Cannot add or update a child row: a foreign key constraint fails (audit_logs, CONSTRAINT audit_logs_ibfk_2 FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL)`
* **Reproduction Steps**:
  1. Wipe database or run backend tests (`npm run test`).
  2. Perform login bypass or accept invites before the respective user ID is created in the database.
  3. Inspect console stdout logs.
* **Expected Behavior**: Audit entries should populate `actor_id = NULL` for unauthenticated actors, which is supported by the schema structure.
* **Actual Behavior**: The database outputted a critical query exception, failing to insert the log row.
* **Root Cause**: `finalActorId` was defaulted to `1` in `auditLogger.js` when `actorId` and `req.user` context were missing. Since user ID 1 does not exist in a brand new database or a clean test environment, the database foreign key constraint failed.
* **Fix Applied**: Modified line 69 of `backend/utils/auditLogger.js` to change the fallback from `1` to `null` if user context is missing:
  ```javascript
  finalActorId = finalActorId || null; // Nullable if no user context
  ```
* **Retest Result**: **VERIFIED / PASS**. Re-ran test suites. All 17/17 database validations pass with zero SQL constraint exceptions in stdout.

---

## 2. Bug Priorities Summary

- **Total P0 Release Blockers**: 1 (Fixed)
- **Total P1 Critical Bugs**: 0
- **Total P2 Medium Issues**: 0
- **Total P3 Low Warnings**: 0
- **Release Status**: **STABLE / STAGED FOR RELEASE**
