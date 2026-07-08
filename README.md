# AI Automated Hiring Software — Applicant Tracking System (ATS)

A professional, full-stack, multi-tenant Applicant Tracking System (ATS) built with Node.js, Express, MySQL, React, and Vite. Designed to manage the complete hiring lifecycle from job posting to AI resume match analysis and scheduling.

---

## 📖 Technical & Career Documentation Portal

We maintain structured manuals for developers, recruiters, and evaluators:

### Technical Specifications
1. **[System Architecture Guide](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/ARCHITECTURE.md)**: Deep dive into multi-tenant database scoping and core backend services.
2. **[Visual Sequence Diagrams](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/docs/ARCHITECTURE_DIAGRAMS.md)**: Mermaid charts mapping tenant isolations, authentication sequences, and AI evaluation flows.
3. **[Security Specification Manual](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/SECURITY.md)**: In-depth details on JWT authentication, RBAC matrix, IDOR preventions, and logging.
4. **[Testing & Verification Manual](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/TESTING.md)**: Steps to launch the native, zero-dependency Node test suites.
5. **[Production Operations Guide](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/DEPLOYMENT.md)**: Prerequisites, reverse proxy settings, and database backups.

### Portfolio & Recruiter Portals
1. **[Developer Case Study](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/PROJECT_CASE_STUDY.md)**: Engineering motivations, requirements, scaling trade-offs, and challenge resolution.
2. **[Product Feature Matrix](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/FEATURE_MATRIX.md)**: Core ATS modules mapped to users, schemas, endpoints, and verification checks.
3. **[Recruiter Demo Walkthrough](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/DEMO_GUIDE.md)**: Complete 10-minute demonstration script showcasing jobs, pipelines, AI match dashboards, and schedulers.
4. **[Interview & Defense Prep](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/INTERVIEW_PREPARATION.md)**: Structured answer bank for technical, HR, behavioral, and defense questions.
5. **[Resume Writing Material](file:///c:/Users/acer/Desktop/AI_AUTOMATED_HIRING_SOFTWARE/docs/RESUME_PROJECT_CONTENT.md)**: Pre-formatted developer bullets and achievements lists.

---

## 🛠️ Tech Stack & Key Features

- **Frontend**: Single-Page App built on React, React Router, and Bootstrap. Includes a real-time Kanban pipeline view and responsive analytics charts.
- **Backend**: Express REST API featuring real-time self-healing table migrations on boot.
- **Database**: MySQL pool connection utilizing dynamic indexing migrations for optimal query performance.
- **Security**: JWT-based session security and RBAC checking middleware.
- **Audit Logs**: Secure administrative audit logging of critical actions.

---

## 🚀 Quick Start (Development Mode)

### Prerequisites:
- Node.js (v18.0.0+)
- MySQL (v5.7+)

### 1. Database Setup
Ensure you have a MySQL server running, then create the database:
```sql
CREATE DATABASE IF NOT EXISTS hr_hiring_system;
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the `backend` folder and configure database credentials:
```ini
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
DB_NAME=hr_hiring_system
JWT_SECRET=YOUR_JWT_SECRET_HERE
DEMO_MODE=false # Set to true to enable bypass login buttons for admin@gmail.com, hr@gmail.com, candidate@gmail.com
```

### 3. Install and Launch Backend
```bash
cd backend
npm install
npm run dev
```

### 4. Install and Launch Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
