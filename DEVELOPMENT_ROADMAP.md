# AI Automated Hiring Software — Development Roadmap

This document outlines the engineering phases required to transition the current smart hiring system into a professional, scalable, highly responsive, portfolio-ready **AI-Powered Recruitment and Applicant Tracking System (ATS)**.

---

## PHASE 2: Design System and Reusable Component Architecture

* **Objective**: Establish a modern, unified UI/UX styling system utilizing CSS variables and build foundational layout components.
* **Features**:
  * Set up HSL-based color tokens, typography defaults (Outfit/Inter font integration), spacing scales, and sleek glassmorphism properties.
  * Build a collapsible, responsive Sidebar and layout wrappers.
  * Develop reusable base components: buttons with micro-interactions, modal sheets, input controls, custom cards, tables with mobile list fallbacks, and async spinner elements.
* **Files likely to be modified**:
  * `frontend/src/index.css`
  * `frontend/src/styles/global.css`
  * `frontend/src/components/Sidebar.jsx`
  * `frontend/src/components/Navbar.jsx`
  * `frontend/src/App.css` (Clean up / Delete)
* **New components required**:
  * `frontend/src/components/common/Button.jsx`
  * `frontend/src/components/common/Card.jsx`
  * `frontend/src/components/common/Modal.jsx`
  * `frontend/src/components/common/Input.jsx`
  * `frontend/src/components/common/Spinner.jsx`
  * `frontend/src/components/common/ResponsiveTable.jsx`
* **Backend requirements**: None.
* **Database requirements**: None.
* **Testing requirements**: Component isolation checks, cross-browser styling consistency validation, responsiveness checks on simulated viewports (mobile, tablet, laptop).
* **Expected result**: A cohesive visual design with a collection of premium, reusable design tokens and layout modules.

---

## PHASE 3: Landing Page and Authentication Redesign

* **Objective**: Replace the basic Login and Register portals with a high-fidelity visual entrance, mount the Landing Page in routing, and secure authentication flows.
* **Features**:
  * Redesign the `/` Landing page (`Home.jsx`) with dynamic graphics, feature highlights, and clear role call-to-actions.
  * Add Login (`/login`) and Signup (`/register`) cards utilizing floating labels, live input validation, password toggle visibilities, and toast messaging alerts.
  * Establish proper redirect gates. If authenticated, route users to their dashboard.
* **Files likely to be modified**:
  * `frontend/src/App.jsx`
  * `frontend/src/pages/Home.jsx`
  * `frontend/src/pages/login.jsx`
  * `frontend/src/pages/Register.jsx`
* **New components required**:
  * `frontend/src/components/auth/AuthCard.jsx`
  * `frontend/src/components/landing/FeatureSection.jsx`
* **Backend requirements**: Secure `/api/auth/login` password checks, payload safety checks, sanitization.
* **Database requirements**: None.
* **Testing requirements**: Validation error state tests, incorrect credentials handling, automatic redirection tests for logged-in sessions.
* **Expected result**: Secure, visually stunning public entrance with correct session redirection logic.

---

## PHASE 4: Recruiter Dashboard

* **Objective**: Rebuild the main dashboard `/dashboard` to serve as a comprehensive recruitment overview hub for Recruiters and Admins.
* **Features**:
  * Glassmorphic metric cards showing Total Jobs, Applicants, Interviews, and Top Match ratios.
  * Donut chart tracking recruitment distribution and application pipelines.
  * "Recent Applications" mini-table showing recent submissions with scores and quick action toggles.
  * "Upcoming Interviews" schedule list.
* **Files likely to be modified**:
  * `frontend/src/pages/Dashboard.jsx`
* **New components required**:
  * `frontend/src/components/dashboard/StatCard.jsx`
  * `frontend/src/components/dashboard/RecentActivityList.jsx`
* **Backend requirements**: Aggregated stat calculations in `/api/dashboard/stats` (joining tables to pull real-time candidate metrics).
* **Database requirements**: Add index on `applications(created_at, match_score)` to optimize retrieval.
* **Testing requirements**: Dashboard component rendering, responsive chart re-scaling, fallback loading skeleton evaluations.
* **Expected result**: Premium recruiter overview dashboard with dynamic data visualizations.

---

## PHASE 5: Job Management System

* **Objective**: Optimize the drafting, publishing, tracking, and closing workflows for job posts.
* **Features**:
  * Consolidate drafted JDs and active jobs into a singular workflow.
  * Recruiter interface to post new job specifications (fields: title, department, description, experience requirement, location, skills keywords list, salary band).
  * Tabbed job listings panel: Active (published), Drafts, and Closed.
* **Files likely to be modified**:
  * `frontend/src/pages/Jobs.jsx`
  * `frontend/src/pages/ManageJD.jsx`
  * `backend/controllers/jobController.js`
  * `backend/models/jobModel.js`
* **New components required**:
  * `frontend/src/components/jobs/JobFormModal.jsx`
  * `frontend/src/components/jobs/JobCard.jsx`
* **Backend requirements**: Consolidated job CRUD endpoints under `/api/jobs`.
* **Database requirements**: Consolidate `jobs` and `job_descriptions` tables. Add `department` field to database.
* **Testing requirements**: Create job form validations, status update toggles, delete action cascades.
* **Expected result**: Unified job post publisher dashboard panel.

---

## PHASE 6: Candidate and Application Management

* **Objective**: Create the core application viewer for recruiters to review applicant submittals, download files, and track profiles.
* **Features**:
  * Detailed application listing with filters (by job title, match score range, status).
  * Interactive slide-over pane or modal to view candidate details: contact information, experience details, and parsed skill tags.
  * Standardized single application card format.
* **Files likely to be modified**:
  * `frontend/src/pages/Applications.jsx`
  * `frontend/src/pages/Candidates.jsx`
  * `backend/controllers/applicationController.js`
  * `backend/models/applicationModel.js`
* **New components required**:
  * `frontend/src/components/applications/ApplicationDetailsModal.jsx`
  * `frontend/src/components/applications/FilterToolbar.jsx`
* **Backend requirements**: Paginated and filterable candidate list retrieval.
* **Database requirements**: Delete redundant `candidates` table and redirect queries to the centralized `applications` table.
* **Testing requirements**: Empty search states, filter logic validation, pagination controls, attachment downloading.
* **Expected result**: Rich application management portal with extensive search and filter capabilities.

---

## PHASE 7: AI Resume Screening

* **Objective**: Refine the PDF resume parsing and matching algorithms.
* **Features**:
  * Integrate real-time processing indicator feedback on frontend while resume is parsed.
  * Extract texts from PDF, clean punctuation, tokenize, strip stopwords, and build precise comparison profiles.
  * Match extracted keywords directly against specified Job skill sets.
  * Allow recruiters to customize AI weighting rules (e.g., TF-IDF cosine weight vs skill list weight).
* **Files likely to be modified**:
  * `backend/controllers/aiController.js`
  * `frontend/src/pages/ApplyJob.jsx`
* **New components required**:
  * `frontend/src/components/ai/AIProgressModal.jsx`
  * `frontend/src/components/ai/WeightConfigForm.jsx`
* **Backend requirements**: Optimized parser logic using refined RegExp tokenization.
* **Database requirements**: Add `weight_config` column to jobs table.
* **Testing requirements**: Parsing validation with multi-column PDFs, edge-case files (empty, password protected, scanned pages), verify accuracy of skill extraction.
* **Expected result**: Robust, transparent, and accurate resume-to-job screening service.

---

## PHASE 8: Candidate Ranking and Comparison

* **Objective**: Build candidate comparison matrixes and automated lists.
* **Features**:
  * Page listing candidates sorted by match score.
  * Multi-candidate checklist selector: select up to 3 candidates to render in a side-by-side comparison matrix (visual comparison of skills overlap, contact, AI score, application date).
* **Files likely to be modified**:
  * `frontend/src/pages/TopCandidates.jsx`
* **New components required**:
  * `frontend/src/components/candidates/ComparisonMatrix.jsx`
  * `frontend/src/components/candidates/RankedRowItem.jsx`
* **Backend requirements**: Batch retrieval metrics for multiple application IDs.
* **Database requirements**: None.
* **Testing requirements**: Limit checker (maximum 3 profiles selected), compare visual alignment on smaller monitors.
* **Expected result**: Recruiter screen mapping side-by-side matching profiles.

---

## PHASE 9: Applicant Tracking System and Recruitment Pipeline

* **Objective**: Introduce a visual Kanban board to manage candidates through stages.
* **Features**:
  * Kanban view: Columns representing applicant stages (Applied, Screened, Interviewing, Offered, Rejected).
  * Drag-and-drop actions to easily transition candidate statuses.
  * Status updates trigger automated log details.
* **Files likely to be modified**:
  * `frontend/src/pages/Applications.jsx`
  * `backend/controllers/applicationController.js`
* **New components required**:
  * `frontend/src/components/ats/KanbanBoard.jsx`
  * `frontend/src/components/ats/KanbanColumn.jsx`
  * `frontend/src/components/ats/KanbanCard.jsx`
* **Backend requirements**: Secure endpoint to update application column status.
* **Database requirements**: Convert `status` text to enum type (`'Applied'`, `'Screened'`, `'Interviewing'`, `'Offered'`, `'Rejected'`).
* **Testing requirements**: Drag-and-drop browser events, API response delays, database state synchronization checks.
* **Expected result**: Premium drag-and-drop Kanban interface for recruiter recruitment tracking.

---

## PHASE 10: Interview Management

* **Objective**: Expand interview scheduling, calendar views, and video links.
* **Features**:
  * Integrated Calendar interface (`react-calendar`) mapping HR interview time slots.
  * Modal scheduler with fields for Date, Time, Mode (Video, Phone, In-Person), Meeting Link (Google Meet/Zoom), and Interviewer Email.
  * Candidate page displaying scheduled sessions with a "Join Meeting" action button.
* **Files likely to be modified**:
  * `frontend/src/pages/Interviews.jsx`
  * `frontend/src/pages/InterviewStatus.jsx`
  * `backend/controllers/interviewController.js`
* **New components required**:
  * `frontend/src/components/interviews/InterviewCalendar.jsx`
  * `frontend/src/components/interviews/SchedulerModal.jsx`
* **Backend requirements**: Email invitations structure setup placeholder, meeting link validations.
* **Database requirements**: Add `meeting_link` and `interviewer_email` fields to `interviews` table.
* **Testing requirements**: Time slot collision checks, dynamic date formats, expired meeting actions.
* **Expected result**: Calendar-driven recruitment interview scheduling workspace.

---

## PHASE 11: Recruitment Analytics

* **Objective**: Create a comprehensive analytics dashboard displaying pipeline metrics.
* **Features**:
  * Line Chart tracking Job Application count volume over time.
  * Bar Chart showcasing candidate yield ratios (Applied vs Shortlisted vs Interviewed vs Hired).
  * Stat indicators showing Average Time-to-Hire and Offer Acceptance Rate.
* **Files likely to be modified**:
  * `frontend/src/pages/Dashboard.jsx` (New Analytics Tab)
* **New components required**:
  * `frontend/src/components/analytics/AnalyticsWorkspace.jsx`
  * `frontend/src/components/analytics/PipelineChart.jsx`
* **Backend requirements**: Create `/api/analytics/historical` metrics endpoint.
* **Database requirements**: Add `applied_date`, `hired_date` timestamps.
* **Testing requirements**: Large-dataset rendering benchmarks, verify chart container constraints on mobile browsers.
* **Expected result**: Analytical business intelligence panels mapping recruitment health.

---

## PHASE 12: Candidate Dashboard and Job Search

* **Objective**: Empower candidates to search, filter, and track applications.
* **Features**:
  * Searchable job board: filter listings by employment type, location, and matching skills.
  * Dynamic job search bar.
  * Track application status timeline: visual step tracker indicating current stage (Applied -> Screened -> Interviewing -> Offered/Rejected).
* **Files likely to be modified**:
  * `frontend/src/pages/StudentDashboard.jsx`
  * `frontend/src/pages/AvailableJobs.jsx`
  * `frontend/src/pages/MyApplications.jsx`
* **New components required**:
  * `frontend/src/components/student/JobSearchFilter.jsx`
  * `frontend/src/components/student/ApplicationTimeline.jsx`
* **Backend requirements**: Fetch jobs filtered by candidate-provided query params.
* **Database requirements**: None.
* **Testing requirements**: Multi-filter logic combinations, verify timeline status markers map application database values correctly.
* **Expected result**: Candidate tracking workspace and clean job search hub.

---

## PHASE 13: Notifications, Settings, and Admin Dashboard

* **Objective**: Build notification logs, profiles settings, and user management systems.
* **Features**:
  * System header alert dropdown showing candidate and recruiter actions.
  * Recruiter profile settings page (edit credentials, change password).
  * Admin-only panel `/admin` to invite new HR recruiters, view logins history, and purge candidate application logs.
* **Files likely to be modified**:
  * `frontend/src/components/Navbar.jsx`
  * `frontend/src/App.jsx`
* **New components required**:
  * `frontend/src/components/notifications/NotificationDropdown.jsx`
  * `frontend/src/pages/AdminSettings.jsx`
* **Backend requirements**: Create `/api/admin/users` user-creation routes.
* **Database requirements**: Add `notifications` table (id, user_id, message, read_status, created_at).
* **Testing requirements**: Notification read states, Role authorization barriers (Candidate attempting to access Admin endpoints).
* **Expected result**: System administration center and notification manager.

---

## 14. Performance, Security, Accessibility, and Responsiveness

* **Objective**: Audit visual layouts, secure codebases, and optimize responsiveness.
* **Features**:
  * Implement sliding off-canvas panels for sidebars and tables in mobile layouts.
  * Implement HTTPS secure token checks, migrate secret keys to `.env`.
  * Verify screen reader alt attributes, ARIA tags, and keyboard focus outlines.
  * Implement lazy-loading of charts and dashboards (`React.lazy`).
* **Files likely to be modified**:
  * `frontend/src/main.jsx`
  * `backend/server.js`
  * `frontend/src/index.css`
* **New components required**:
  * `frontend/src/components/common/ErrorBoundary.jsx`
* **Backend requirements**: Helmet middleware security, express-rate-limit.
* **Database requirements**: Indexes optimizations.
* **Testing requirements**: Lighthouse performance scores, mobile touch targets checks, security penetration audits.
* **Expected result**: Highly performant, optimized, accessible, secure application package.

---

## PHASE 15: Complete Testing, Documentation, and Production Deployment

* **Objective**: Verify and publish the completed ATS platform.
* **Features**:
  * End-to-end integration tests (login -> search job -> apply -> parse resume -> shortlist -> schedule interview).
  * Detailed API documentation.
  * Production builds configurations (Vercel frontend, VPS/Render backend).
* **Files likely to be modified**: All configurations.
* **New components required**: None.
* **Backend requirements**: Production database connection strings.
* **Database requirements**: Production migrations runner.
* **Testing requirements**: Comprehensive manual and automated verification scripts.
* **Expected result**: Fully certified, live, responsive, enterprise-ready smart ATS system.
