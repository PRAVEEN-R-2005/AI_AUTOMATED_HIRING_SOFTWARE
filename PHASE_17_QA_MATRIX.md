# Quality Assurance Execution Matrix — Phase 17

This matrix details the full independent testing scenarios verified during Phase 17 QA, covering happy paths, negative boundaries, role authorization checks, and multi-tenant security isolates.

## 1. Authentication & Session Security (TS-AUTH)

| Test ID | Module | Scenario / Action | Role Tested | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-AUTH-01** | Auth | Register User (Valid credentials) | Guest | Organization 1 generated. User is saved, password hashed, redirect to login. | Saved, hashed password, redirect success. | **PASS** |
| **TS-AUTH-02** | Auth | Register Duplicate User | Guest | Returns `409 Conflict` (Email already registered). | Correctly returns 409 status. | **PASS** |
| **TS-AUTH-03** | Auth | Login with Incorrect Password | Guest | Returns `401 Unauthorized` / `404 Not Found`. | Correctly denies login with 401 error. | **PASS** |
| **TS-AUTH-04** | Auth | Access Protected `/dashboard` unauthenticated | Guest | Blocks load, redirect to `/login`. | Blocked and redirected to login page. | **PASS** |

---

## 2. Multi-Tenant Organization Isolation & IDOR (TS-SEC)

| Test ID | Module | Scenario / Action | Role Tested | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-SEC-01** | Tenant | Fetch Job descriptions (Org A recruiter) | Recruiter A | Returns Org A JDs only. | Org A records only returned. | **PASS** |
| **TS-SEC-02** | Tenant | Cross-Tenant Job Fetch (Org B recruiter requests Org A JDs) | Recruiter B | Returns `403 Forbidden` or `404 Not Found`. Prevents data exposure. | Returns empty/403. Access denied. | **PASS** |
| **TS-SEC-03** | IDOR | Access `applications/:id` of other organization | Recruiter B | Denies request and blocks access. | Correctly rejects other org ID access. | **PASS** |
| **TS-SEC-04** | Privilege | Attempt self-promotion to Admin | Recruiter A | Enforces server checks, rejects payload role overrides. | Server blocks role override inputs. | **PASS** |

---

## 3. Job Management Workflows (TS-JOB)

| Test ID | Module | Scenario / Action | Role Tested | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-JOB-01** | Jobs | Create Job Requisition | Recruiter | Saves details, generates JD, inserts into `job_descriptions`. | Requisition saved, JD created. | **PASS** |
| **TS-JOB-02** | Jobs | Modify Active JD details | Recruiter | Saves updates, database records change. | Updates saved correctly. | **PASS** |
| **TS-JOB-03** | Jobs | Close Requisition | Recruiter | Changes status to 'Closed', updates in table. | Status set to 'Closed' successfully. | **PASS** |

---

## 4. Candidate Screening & AI Analysis (TS-AI)

| Test ID | Module | Scenario / Action | Role Tested | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-AI-01** | Screen | Upload PDF resume | Candidate | Stores file in `uploads/`, links profile database. | PDF stored, profile database linked. | **PASS** |
| **TS-AI-02** | Screen | Screen candidate resume | Recruiter | Runs category matching and calculates match score. | Renders score cards and skill lists. | **PASS** |
| **TS-AI-03** | Ranking | Sort candidate listings by AI score | Recruiter | Sorts candidate profiles descending by computed score. | Sorting functions correctly. | **PASS** |

---

## 5. Kanban Pipeline & Interview Coordination (TS-FLOW)

| Test ID | Module | Scenario / Action | Role Tested | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-FLOW-01** | Pipeline | Drag applicant to 'Interview' stage | Recruiter | Transitions stage, appends log entry in `activities`. | Stage changes, activity log appended. | **PASS** |
| **TS-FLOW-02** | Interview | Schedule Video Panel slot | Recruiter | Saves meeting link, slots time, display card on calendar. | Interview scheduled and shown on calendar. | **PASS** |
| **TS-FLOW-03** | Interview | Submit rating evaluation notes | Interviewer | Appends comments and rating to interview record. | Scorecard comment stored successfully. | **PASS** |

---

## 6. Audit Logging & System Configuration (TS-ADM)

| Test ID | Module | Scenario / Action | Role Tested | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-ADM-01** | Settings | Modify organization configurations | Admin | Saves default pipeline stages, updates industry settings. | Configuration saved, database updated. | **PASS** |
| **TS-ADM-02** | Audit | Review Activity trails | Admin | Displays login and update event categories. | Audit logs list events with metadata. | **PASS** |
| **TS-ADM-03** | Audit | Attempt non-admin audit log query | Recruiter | Returns `403 Forbidden` response. | Blocked from viewing audit trail. | **PASS** |
