# AI Automated Hiring Software — Phase 15 Hardening Plan

This document maps out the specific production hardening, auditing, and optimization items to be executed for Phase 15.

## 1. Baseline Health Summary
- **Type Checking / Linting**: Frontend has 154 errors/warnings in `npm run lint`. Main issues: undefined imports (`Badge`, `Modal`, `FaUsers`), Temporal Dead Zone declarations (`fetchNotifications`), and impure React compiler warnings (`Date.now()`).
- **Tests**: No existing test suite.
- **Production Build**: Vite builds successfully.
- **Backend**: Starts up and connects to local MySQL database successfully.

## 2. Issue Inventory & Severity Matrix
- **P0 — Critical**:
  - JWT secret hardcoded fallback (`praveen_secret_key`) when environment is missing `JWT_SECRET`.
  - Hardcoded credentials bypass (`admin@gmail.com`/`admin123`) enabled in production environments.
- **P1 — High**:
  - Candidate interviews leak in `getInterviewsByEmail` (non-candidate users can query candidate history across all organizations without scoping).
  - Dead endpoints (`/api/jobs`, `/api/resumes`, `/api/candidates`) exist without tenant isolation check hooks.
- **P2 — Medium**:
  - Missing database indexing on frequently queried columns.
  - Undefined variable exceptions in UI pages (`Badge`, `Modal`, `FaUsers`, `getScoreBadge`).
  - Temporal Dead Zone lint warning in notifications fetch sequence.
  - Generic metadata ("frontend" title) and no robots configuration.
- **P3 — Low**:
  - Vestigial controllers, models, and Python scripts remaining in the workspace.
  - Missing setup, architecture, and deployment instructions.

## 3. Action Plan
### Security Audit & Hardening
1. Throw explicit startup exception in `authMiddleware` if `JWT_SECRET` is missing in production mode.
2. Disable the hardcoded credentials bypass in `authController` and login page when `NODE_ENV === 'production'`.
3. Scope `getInterviewsByEmail` to the user's `organization_id` for recruiters/admins.

### Performance Optimization
1. Add indices on `memberships`, `applications`, `interviews`, and `job_descriptions` tables dynamically at initialization in `db.js`.

### Test Suite Integration
1. Set up a zero-dependency backend test suite using Node's native test runner (`node:test`).
2. Write unit tests for permissions logic.
3. Write integration tests for auth routes and cross-tenant checks.

### Linter & Bug Fixes
1. Fix undefined imports in `TeamComments.jsx`, `Analytics.jsx`, `Interviews.jsx`.
2. Add missing `getScoreBadge` helper to `AICandidates.jsx`.
3. Re-order declarations in `Notifications.jsx` to resolve temporal dead zone error.
4. Clean up unused route registry middleware, controllers, models, and Python scripts.

### SEO & Branding
1. Set proper page metadata and social preview fields in `index.html`.
2. Add `robots.txt` and `sitemap.xml` mapping public resources.

### Technical Documentation
1. Create `ARCHITECTURE.md`, `SECURITY.md`, `TESTING.md`, and `DEPLOYMENT.md` files.
2. Polish README.md and add variables to `.env.example`.
