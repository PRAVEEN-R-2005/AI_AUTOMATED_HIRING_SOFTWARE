# Developer Contribution Guidelines

This document outlines the coding standards, branch conventions, and testing instructions for developers working on the Applicant Tracking System.

## 1. Local Development Setup

Follow the guidelines in the main [README.md](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/README.md) to set up your local database and environment.

### Code Structure
- **[backend/](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/backend)**: REST API built on Express. Business logic is placed in `controllers/`, SQL queries in `models/`, routing in `routes/`, and middlewares in `middleware/`.
- **[frontend/](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/frontend)**: Client application built on React. Pages are located in `src/pages/`, components in `src/components/`, and state utilities in `src/services/`.

---

## 2. Branch & Commits Conventions

### Branch Names
Ensure branch names follow standard Git formats:
- `feature/description-of-feature`
- `bugfix/description-of-fix`
- `docs/description-of-docs-update`

### Commit Messages
Commit messages should be descriptive and prefix the component they change:
- `feat(auth): add JWT expiration checks`
- `fix(comments): resolve missing badge import in UI`
- `docs(readme): add links to architecture guides`

---

## 3. Code Standards & Quality Checks

### JavaScript Styling
- Use ES6+ syntax (arrow functions, destructured arrays, async/await).
- Run the linter to verify formatting standards:
  ```bash
  cd frontend
  npm run lint
  ```

### Testing Requirements
Every core business service or router modification must be verified:
- Set up test assertions in `backend/utils/*.test.js` using Node's native `node:test` runner.
- Run tests sequentially to prevent schema write locks:
  ```bash
  cd backend
  node --test utils/permissions.test.js; node --test utils/auth.test.js; node --test utils/isolation.test.js
  ```
