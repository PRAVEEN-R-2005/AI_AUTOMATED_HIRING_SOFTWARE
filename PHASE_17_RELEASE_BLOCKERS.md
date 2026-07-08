# Phase 17 — Release Blocker Sheet

This document records any outstanding critical issues (P0 / P1) blocking the stable deployment of the Applicant Tracking System.

## Release Status: APPROVED

All verified release blockers have been successfully resolved, tested, and regression validated.

---

## 1. Resolved Release Blockers

### BUG-17-001: Audit Logger Database Foreign Key Exception
- *Severity*: P0
- *Impact*: Blocked unauthenticated audit log creation.
- *Fix*: Changed `actor_id` fallback inside `auditLogger.js` to `null` to comply with nullable DB schema definitions.
- *Validation*: Re-ran Node integrations test suite. Verified 17/17 tests pass successfully with zero query exceptions.

---

## 2. Active Release Blockers

**NO KNOWN RELEASE-BLOCKING ISSUES**
