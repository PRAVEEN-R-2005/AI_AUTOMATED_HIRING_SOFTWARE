# Security Specification & Compliance Manual

This document details the security model, tenant isolation rules, authentication configuration, and logging standards of the ATS platform.

## 1. Authentication Security

### JSON Web Tokens (JWT)
- **Token Signing**: JWT tokens are signed using the HMAC SHA256 algorithm.
- **Production Controls**: The application requires a secure, high-entropy secret via the `JWT_SECRET` environment variable in production mode (`process.env.NODE_ENV === "production"`). Startup is terminated if this environment setting is missing or defaulted to prevent insecure fallbacks.
- **Expiration**: Session tokens expire in 24 hours (`1d`).

### Demo Login Bypass Controls
- **Bypass Rule**: A development convenience bypass allows logging in as test roles (`admin@gmail.com`, `hr@gmail.com`, etc.) without database queries.
- **Enforcement**: This bypass is disabled unconditionally in production environments (`NODE_ENV === "production"`) unless `ALLOW_DEMO_BYPASS` is explicitly set to `"true"` in environment settings. In standard production operations, real database verification and password hashing are strictly enforced.

---

## 2. Multi-Tenant Authorization Model

### Role-Based Access Control (RBAC)
Roles are mapped to granular permissions in [permissions.js](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/backend/utils/permissions.js):
- `Admin`: Full organizational control, audit trail viewing, and team management.
- `Recruiter`/`HR`: Full requisition control, candidate screening, pipelines, scheduling, and comments.
- `Interviewer`: Access to assigned schedules, feedback forms, and scorecard tracking.
- `Candidate`: Public job listing view and individual application status checks.

### Cross-Tenant Protection (IDOR)
To prevent Insecure Direct Object References (IDOR), controllers query database records by matching BOTH resource ID and organization context:
- Recruiter A (Org 1) querying a Job Description ID belonging to Org 2 is rejected with a `403 Access Denied` response.
- Candidate email queries for interviews are constrained strictly to the recruiter's active membership ID, blocking cross-tenant candidate scheduling exposure.

---

## 3. Audit Logging & Non-Repudiation

An append-only audit trail logs administrative and login actions to the `audit_logs` table:

```sql
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT,
    actor_id INT,
    actor_name VARCHAR(255),
    actor_email VARCHAR(255),
    event_category VARCHAR(100), -- AUTHENTICATION, JOB_MANAGEMENT, PIPELINE, INTERVIEW, SETTINGS
    action VARCHAR(255),          -- LOGIN_SUCCESS, CREATE_JD, UPDATE_PIPELINE
    resource_type VARCHAR(100),   -- USER, JOB, CANDIDATE
    resource_id INT,
    result VARCHAR(50),           -- SUCCESS, FAILURE
    ip_address VARCHAR(100),
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Protection Rules:
1. **Masking Sensitive Data**: The audit logger scrubs passwords, credentials, and tokens from metadata objects before writing to database logs.
2. **Resilience**: The audit logger is wrapped in error boundaries. If logging fails (e.g. database disconnect), a warning is printed to stdout, but the request process continues, maintaining platform uptime.
