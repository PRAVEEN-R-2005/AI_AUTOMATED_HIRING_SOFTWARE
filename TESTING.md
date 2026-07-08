# Testing & Verification Manual

This document details the local testing layout, verification workflows, and linter configurations.

## 1. Native Test Runner

The project utilizes Node.js's built-in, zero-dependency test runner (`node:test` and `node:assert`). This ensures fast execution and keeps the codebase clean of heavy external packages like Mocha, Jest, or Supertest.

### Test Files Layout
All test suites are located in `backend/utils/`:
- **[permissions.test.js](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/backend/utils/permissions.test.js)**: Unit tests mapping and validating RBAC matrix roles and permissions.
- **[auth.test.js](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/backend/utils/auth.test.js)**: Integration tests checking user registration, duplicate email conflicts, length validations, password matching, and demo bypass switches.
- **[isolation.test.js](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/backend/utils/isolation.test.js)**: Integration tests verifying multi-tenant safety and that users are blocked from reading or updating other organizations' records.

---

## 2. Test Execution & Sandbox Configuration

### Sandbox Database
All database tests dynamically target a test sandbox database schema:
```javascript
process.env.DB_NAME = "hr_hiring_system_test";
```
When test scripts load, the self-healing DB initializer in `db.js` automatically creates the `hr_hiring_system_test` schema and tables, running migrations and seeds without altering the production database.

### Running Test Command
To run all tests sequentially (preventing MySQL race locks), execute:
```powershell
node --test backend/utils/permissions.test.js; node --test backend/utils/auth.test.js; node --test backend/utils/isolation.test.js
```

---

## 3. Frontend Quality Verification

Verify React compiler compliance and styles formatting using Vite and ESLint:
- **Run ESLint**:
  ```bash
  cd frontend
  npm run lint
  ```
- **Build Client Bundle**:
  ```bash
  cd frontend
  npm run build
  ```
The build configuration treats warnings as non-fatal indicators, but enforces that zero syntax or undefined variable errors exist before completing compilation.
