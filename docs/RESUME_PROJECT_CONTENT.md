# Resume Project Content

Use the following bullet points, project descriptions, and achievements to update your developer resume or LinkedIn profile.

---

## 1. Project Title & Descriptions

### Project Title
**Smart ATS — Multi-Tenant AI Recruitment Platform**

### One-Line Description
*A secure, multi-tenant AI-powered Applicant Tracking System (ATS) managing end-to-end recruitment pipelines, semantic resume screening, and scheduling analytics.*

---

## 2. Bullet Point Options (Choose based on resume space)

### 2-Bullet Version (For tight spacing)
- Designed and built a multi-tenant applicant tracking system in Node.js, Express, and React, enforcing strict tenant isolation and IP audit trail logging to prevent cross-organization IDOR leaks.
- Integrated a structured AI resume screening module that parses qualifications and calculates experience/skills match scorecards, reducing screening backlogs.

### 3-Bullet Version (Recommended)
- Engineered a full-stack, multi-tenant Applicant Tracking System (ATS) using React (Vite), Express, and MySQL, implementing self-healing migrations and composite indexing to optimize query joins.
- Prevented unauthorized data access (IDOR) by creating context-scoped middleware validating user active memberships and roles from JWT session payloads.
- Implemented a zero-dependency automated integration test suite using Node's native test runner to verify authentication limits and tenant security boundaries.

### 4-Bullet Version (For detailed spacing)
- Developed a responsive, single-page applicant tracking dashboard featuring drag-and-drop Kanban pipeline boards, analytics charts, collaborative team comments, and notification panels.
- Designed a secure user registration and login system featuring hashed password storage via `bcrypt` and structured HMAC SHA256 JWT sessions.
- Integrated composite indexes on candidate applications and interview schedule tables, maintaining low API response times.
- Documented system architecture, tenant isolation mechanisms, local verification suites, and deployment guidelines for portfolio presentation.

---

## 3. Technology Stack & Keywords

- **Frontend**: React (Vite SPA), React Router DOM, Bootstrap, FontAwesome, React Calendar.
- **Backend**: Node.js, Express, `mysql2` client pool, JWT (HMAC SHA256), `bcrypt`.
- **Database**: MySQL (relational constraints, self-healing table setup, composite indexing).
- **Tooling & CI/CD**: ESLint Flat Config, Node.js Native Test Runner (`node:test`).
