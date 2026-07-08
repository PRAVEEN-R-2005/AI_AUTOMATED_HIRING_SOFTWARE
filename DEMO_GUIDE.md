# Recruiter Demo & Presentation Walkthrough Guide

This guide describes the standard demonstration flow for presenting **Smart ATS** features, roles, and AI matching workflows to hiring managers or evaluators.

---

## 1. Demo Credentials & Account Strategy

The local/testing database is pre-seeded with three active user roles. Use these credentials on the public login screen:

| Role Account | Email | Password | Primary Demo Scope |
| :--- | :--- | :--- | :--- |
| **HR Manager / Recruiter** | `hr@gmail.com` | `123456` | Core pipeline workflows, JD creation, scheduling, candidate matching, and collaborative comments. |
| **Organization Admin** | `admin@gmail.com` | `admin123` | Audit logs monitoring, timezone updates, global defaults, and team lists. |
| **Candidate User** | `candidate@gmail.com` | `123456` | Job applications portal and candidate status dashboard views. |

---

## 2. Primary Demo Story Workflow (10-Minute Script)

Follow this sequence to showcase a complete hiring workflow:

### Step 1: Login & Dashboard Review
1. Open the app home page. Click **Log In Now** or navigate to the sign-in screen.
2. Enter the Recruiter credentials: `hr@gmail.com` / `123456`.
3. View the **Recruiter Dashboard**:
   - Highlight the real-time indicators: **Active Positions (2)**, **Applications (3)**, **Interviews (1)**.
   - Note the **Recent Recruitment Activity** log at the bottom displaying latest applicant stages.

### Step 2: Create a Job Requisition
1. Click **Jobs** in the sidebar navigation, then click **Create Job Requisition**.
2. Fill out details:
   - *Title*: `Senior React Developer`
   - *Skills Required*: `React, Redux, CSS, REST APIs`
   - *Experience*: `3-5 Years`
   - *Salary Range*: `$100,000 - $120,000`
   - *Description*: `Lead frontend UI design and client-side integrations.`
3. Click **Create Requisition**. Note that the job displays instantly in the active listings table.

### Step 3: Run AI Resume Screening
1. Click **AI Screen** in the sidebar. Select the newly created job or the seeded `AI Research Specialist` job.
2. Review the pre-seeded candidate files: **Sarah Connor** (92% Match score) and **John Smith** (85% Match score).
3. Click on **Sarah Connor** to inspect the matching scorecard:
   - Highlight the matched skills badges (`Python`, `PyTorch`) and the missing skills (`Docker`).
   - Read the structured **AI Summary Recommendation** and candidate strengths.

### Step 4: Manage the Kanban Recruitment Funnel
1. Click **Applications** in the navigation bar.
2. Note the candidate cards organized across the columns: `Applied`, `Screening`, `Shortlisted`, `Interview`, `Hired`, and `Rejected`.
3. Drag **John Smith** from `Shortlisted` to `Interview` to simulate schedule coordinates.
4. Go to **Dashboard** and verify that the Recent Activity trail has appended: *"Stage transition: John Smith moved to Interview"*.

### Step 5: Schedule an Interview
1. Click **Interviews** in the sidebar.
2. Note the seeded interview for **Sarah Connor** on the calendar.
3. Click **Schedule New Interview**:
   - Select candidate **John Smith** (matching email `john.smith@example.com`).
   - Round: `Technical Panel`, Date: `2026-07-20`, Time: `11:00 AM`, Mode: `Video`.
   - Interviewer: `HR Manager`, Meeting Link: `https://meet.google.com/xyz-pdqr-abc`.
4. Click **Schedule**. The calendar updates to display the new entry.

### Step 6: Collaborate with Comments
1. Under candidate listings or pipeline views, write a collaborative note:
   - *"Excellent full-stack profile. React skills check out. Let's fast-track."*
2. Post comment. Note the timestamp and author attribution display.

---

## 3. Administrative Audit Logs (Security Showcase)

1. Log out, then log in as the **Admin**: `admin@gmail.com` / `admin123`.
2. Navigate to **Settings** in the sidebar, and select the **Audit Logs** tab.
3. Show the append-only logs listing:
   - Event categorization (`AUTHENTICATION`, `JOB_MANAGEMENT`, `PIPELINE`).
   - Action names (`LOGIN_SUCCESS`, `CREATE_JD`, `STAGE_CHANGE`).
   - Target User IP address and Browser User-Agent.
   - Click the **Metadata** eye icon to review the structured transaction parameters.
