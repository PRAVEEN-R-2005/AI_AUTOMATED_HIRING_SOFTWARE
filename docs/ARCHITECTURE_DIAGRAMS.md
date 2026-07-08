# System Architecture & Sequence Diagrams

This document contains Mermaid diagrams illustrating the structure, security boundaries, and core workflows of the Applicant Tracking System.

## 1. High-Level System Topology

```mermaid
graph TD
    Client["React SPA client (Vite)"] -- "HTTPS REST API" --> Proxy["Nginx (SSL Termination)"]
    Proxy -- "Internal Port 5000" --> AppServer["Express Application Server"]
    AppServer -- "mysql2 pool (Port 3306)" --> Database[("MySQL Database (Indexed)")]
    AppServer -- "File System" --> UploadDir["uploads/ (PDF Resumes)"]
```

---

## 2. Authentication Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Recruiter/Admin
    participant UI as React Client
    participant API as Express API
    participant DB as MySQL DB

    User->>UI: Enter email & password
    UI->>API: POST /api/auth/login
    Note over API: Hash password & verify against DB
    API->>DB: SELECT * FROM users WHERE email = ?
    DB-->>API: User details record
    Note over API: Compare password hashes
    API->>DB: SELECT * FROM memberships WHERE user_id = ?
    DB-->>API: Active memberships (role, organization_id)
    Note over API: Generate JWT token containing organization_id & role
    API-->>UI: Return JWT Token & user state
    Note over UI: Save Token in LocalStorage/Context
```

---

## 3. Multi-Tenant Isolation Flow (IDOR Prevention)

```mermaid
sequenceDiagram
    autonumber
    actor User as Recruiter (Org 1)
    participant UI as React Client
    participant Middleware as authMiddleware
    participant Controller as Controller (e.g. Job Description)
    participant DB as MySQL DB

    User->>UI: Click "View Job Description details"
    UI->>Middleware: GET /api/job-descriptions/:id (JWT Token in Headers)
    Note over Middleware: Validate JWT Token<br/>Extract req.user.organization_id = 1
    Middleware->>Controller: Route authorized
    Note over Controller: Query database scoping by organization_id
    Controller->>DB: SELECT * FROM job_descriptions WHERE jd_id = ? AND organization_id = 1
    DB-->>Controller: Return record (or empty if mismatched Org ID)
    alt Resource exists in Organization 1
        Controller-->>UI: 200 OK (Job Description JSON details)
    else Resource belongs to Organization 2
        Controller-->>UI: 403 Forbidden / 404 Not Found (Access Denied)
    end
```

---

## 4. AI Screening & Resume Evaluation Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Candidate
    actor Recruiter
    participant UI as React client
    participant API as Express API
    participant DB as MySQL DB

    Candidate->>UI: Upload resume PDF & apply
    UI->>API: POST /api/applications (Multipart form upload)
    Note over API: Store file in uploads/ folder
    API->>DB: INSERT INTO applications (status = 'Pending')
    DB-->>API: Confirm record creation
    Note over Recruiter: Review pipeline dashboard
    Recruiter->>UI: Click "Run AI Screening Matcher"
    UI->>API: POST /api/ai/screen/:applicationId
    Note over API: Extract resume text & parse categories
    Note over API: Run matching score algorithms (skills, experience, education)
    API->>DB: UPDATE applications SET match_score = ?, skills_score = ?, parsed_text = ?, is_ai_screened = 1
    DB-->>API: Confirm update
    API-->>UI: Return updated candidate matching metrics
    UI-->>Recruiter: Display scorecards, strengths, and missing skill badges
```
