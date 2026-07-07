# AI Automated Hiring Software — Project Audit

## 1. Executive Summary
The **AI Automated Hiring Software** is a functional smart recruitment web application. It uses a Node.js/Express/MySQL backend and a Vite/React/Bootstrap frontend. In its current form, it supports resume screening via natural language processing (TF-IDF similarity), candidate tracking, job posting, and interview scheduling. 

However, the application possesses significant architectural discrepancies, redundant files, unused tables/schemas, design inconsistencies, and code quality issues. This audit details the project state at Phase 1 and outlines recommendations to prepare the codebase for conversion into a professional, responsive, and robust Applicant Tracking System (ATS).

---

## 2. Current Technology Stack
### Frontend
* **Framework**: React 19.2.6 (Vite 8.0.12 build runner)
* **Programming Language**: JavaScript (JSX)
* **Styling System**: Vanilla CSS and Bootstrap 5.3.8 (with React-Bootstrap 2.10.10)
* **Icon Library**: React Icons (specifically `react-icons/fa` for FontAwesome icons)
* **Chart Library**: Chart.js 4.5.1 and React-Chartjs-2 5.3.1 (Doughnut charts)
* **Animation Library**: AOS (Animate on Scroll) 2.3.4
* **State Management**: React State (`useState` / `useEffect`) - no global store (Redux/Zustand)
* **Data Fetching**: Axios 1.18.0 (configured with custom interceptors for Bearer auth)

### Backend
* **Framework**: Express 5.2.1
* **Server Structure**: Controller-Model-Route architecture
* **Database Client**: mysql2 3.22.5 (utilizing connection pool)
* **Authentication**: jsonwebtoken (JWT) 9.0.3 and bcryptjs 3.0.3
* **File Upload Handling**: Multer 2.1.1 (handling multi-part form uploads)
* **Natural Language Processing (NLP)**: natural 8.1.1 (TF-IDF vector matching) and pdf-parse 2.4.5 (Extracting PDF resume text)

### Database
* **Database Engine**: MySQL (local environment)
* **Access Method**: Raw SQL queries implemented inside JS model files (e.g. `userModel.js`, `jobModel.js`)

### AI / Machine Learning
* **Active Engine**: Node.js standard natural NLP library. A vector space model is constructed dynamically to compare parsed PDF resume text against Job Description titles, skills, and descriptions via cosine similarity.
* **Unused AI Code**: Python 3 files in `backend/ai-engine/` (including PyPDF2 resume parsing, TF-IDF rankers, and keyword extractors).

---

## 3. Current Folder Structure
```
AI_AUTOMATED_HIRING_SOFTWARE/
├── .git/
├── .gitignore                      # [NEW] Root level gitignore
├── DEVELOPMENT_ROADMAP.md          # [NEW] Complete development map
├── PROJECT_AUDIT.md                # [NEW] Audit report
├── backend/
│   ├── .env                        # Local configurations
│   ├── .env.example                # [NEW] Env configuration template
│   ├── .gitignore                  # [NEW] Backend gitignore
│   ├── server.js                   # Express application entrypoint
│   ├── package.json                # Node script/dependencies configuration
│   ├── package-lock.json
│   ├── ranked_candidates.json      # Unused local JSON state
│   ├── ai-engine/                  # Unused Python virtualenv and AI scripts
│   │   ├── candidate_profile.json
│   │   ├── candidate_profile.py
│   │   ├── candidate_ranker.py
│   │   ├── matcher.py
│   │   ├── multiple_resume_ranker.py
│   │   ├── ranked_candidates.json
│   │   ├── ranking.py
│   │   ├── resume_parser.py
│   │   ├── skill_extractor.py
│   │   ├── tfidf_matcher.py
│   │   └── venv/
│   ├── config/
│   │   └── db.js                   # MySQL database initialization and pool
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT & Role validation middleware
│   │   ├── multer.js               # Multi-part upload handler
│   │   ├── uploadJD.js             # JD upload helper
│   │   ├── uploadMiddleware.js     # Multipart file processing middleware
│   │   └── uploadResume.js         # Resume upload helper
│   ├── controllers/
│   │   ├── aiController.js         # TF-IDF cosine similarity computation
│   │   ├── applicationController.js# Submissions & status updates
│   │   ├── authController.js       # Register, login, bypass logic
│   │   ├── candidateController.js  # Candidate management controller (Unused)
│   │   ├── dashboardController.js  # Stat count fetching
│   │   ├── hrController.js         # HR candidates fetches
│   │   ├── interviewController.js  # Scheduling and status updates
│   │   ├── jobController.js        # Post, close, publish jobs
│   │   ├── jobDescriptionController.js # Admin Job descriptions controller
│   │   ├── resumeController.js     # Resume upload controller (Unused)
│   │   └── topCandidateController.js # List applications by match score
│   ├── models/
│   │   ├── aiCandidateModel.js     # Unused database model (ai_candidates)
│   │   ├── applicationModel.js     # SQL query mappings for applications
│   │   ├── candidateModel.js       # SQL mappings for candidates table (Unused)
│   │   ├── dashboardModel.js       # Counts mapping
│   │   ├── hrModel.js              # HR candidate database mappings
│   │   ├── interviewModel.js       # SQL mappings for interviews table
│   │   ├── jobDescriptionModel.js  # SQL mappings for job descriptions
│   │   ├── jobModel.js             # SQL mappings for jobs
│   │   ├── resumeModel.js          # SQL mapping referencing missing resumes table (Unused)
│   │   ├── topCandidateModel.js    # SQL mapping for application ranking
│   │   └── userModel.js            # SQL mapping for user authentication
│   │
│   ├── routes/
│   │   ├── aiCandidateRoutes.js    # Endpoint for running AI (Unused/vestigial)
│   │   ├── aiRoutes.js             # Endpoint for running AI (/api/ai/run/:id)
│   │   ├── applicationRoutes.js    # /api/applications router
│   │   ├── authRoutes.js           # /api/auth router
│   │   ├── candidateRoutes.js      # /api/candidates router (Unused)
│   │   ├── dashboardRoutes.js      # /api/dashboard router
│   │   ├── hrRoutes.js             # /api/hr router
│   │   ├── interviewRoutes.js      # /api/interviews router
│   │   ├── jobDescriptionRoutes.js # /api/job-descriptions router
│   │   ├── jobRoutes.js            # /api/jobs router
│   │   ├── resumeRoutes.js         # /api/resumes router (Unused/vestigial)
│   │   └── topCandidateRoutes.js   # /api/top-candidates router
│   └── uploads/
│       ├── JD/                     # Stores Job Description docs (.gitkeep added)
│       └── resumes/                # Stores Candidate Resume PDFs (.gitkeep added)
│
└── frontend/
    ├── .env                        # Endpoint config (VITE_API_URL)
    ├── .env.example                # [NEW] Env configuration template
    ├── .gitignore                  # Frontend gitignore config
    ├── eslint.config.js            # Linter rules
    ├── index.html                  # HTML template root
    ├── package.json                # Frontend packages list
    ├── package-lock.json
    ├── vite.config.js              # Vite config
    ├── public/
    └── src/
        ├── App.css                 # Dead stylesheet (Leftover React template code)
        ├── App.jsx                 # App routing definition
        ├── index.css               # Styling guidelines (Root colors and fonts)
        ├── main.jsx                # DOM rendering anchor
        ├── components/
        │   ├── Navbar.jsx          # Header navigation element
        │   ├── ProtectedRoute.jsx  # Auth validator
        │   ├── RoleProtectedRoute.jsx # Role checking validator
        │   └── Sidebar.jsx         # Left side navigation bar
        ├── pages/
        │   ├── AICandidates.jsx    # Review shortlisted candidates
        │   ├── Applications.jsx    # HR applications reviews
        │   ├── ApplyJob.jsx        # Submit resumes / details
        │   ├── AvailableJobs.jsx   # Candidate jobs board
        │   ├── Candidates.jsx      # Generic candidate list
        │   ├── Dashboard.jsx       # Analytics counts and donut chart
        │   ├── Home.jsx            # Landing page (Unused in routing)
        │   ├── InterviewStatus.jsx # Candidate interview details
        │   ├── Interviews.jsx      # HR interview scheduling
        │   ├── Jobs.jsx            # Job management panel
        │   ├── ManageJD.jsx        # Job description drafts (Admin)
        │   ├── MyApplications.jsx  # Candidate track application list
        │   ├── Register.jsx        # Register account
        │   ├── StudentDashboard.jsx# Candidate portal index
        │   ├── TopCandidates.jsx   # Top matching applicants
        │   └── login.jsx           # Sign-in portal
        ├── services/
        │   └── api.js              # Axios base setup and authorization token injection
        └── styles/
            └── global.css          # Global styling adjustments
```

---

## 4. Architecture Analysis
The project follows a decoupled **Single Page Application (SPA)** client-server architecture.
* **Separation of Concerns**: Good division into controller, model, and route files.
* **Database Setup**: The script `backend/config/db.js` automatically creates schemas, indices, and seeds default profiles when the database connects, keeping deployment simple.
* **Redundant Modules (Technical Debt)**:
  * The `ai-engine` folder contains Python virtual environment and scripts which are **completely unused**. The active AI processes are executed in Javascript via `natural` and `pdf-parse`.
  * The tables `candidates` and `ai_candidates`, as well as their respective backend routes, are **vestigial**. All candidate data and parsed details are extracted from, and stored in, the `applications` table.
  * The model `resumeModel.js` attempts to query a table `resumes` which is **not created** in the database schema.
  * `Home.jsx` is a complete landing page that is **excluded** from the application routes.

---

## 5. Existing Pages
* **Landing Page (`Home.jsx`)**: Not routed. Shows roles and navigates to `/login`.
* **Login (`login.jsx`)**: Contains form inputs and bypass buttons for Demo logins. Uses localStorage to record role/token details.
* **Registration (`Register.jsx`)**: Basic signup for Admin, HR, and Candidate roles.
* **Dashboard (`Dashboard.jsx`)**: Renders stats (total jobs, candidates, interviews, top candidates) and a recruitment distribution Doughnut chart.
* **Manage JD (`ManageJD.jsx`)**: Admin interface to create draft job descriptions.
* **Jobs (`Jobs.jsx`)**: HR panel to publish, close, or delete drafted job descriptions.
* **Applications (`Applications.jsx`)**: HR panel showing all applications, allowing manual download of resumes, status adjustments, and triggering the AI similarity matcher.
* **Candidates (`Candidates.jsx`)**: HR view of all candidate email addresses and matching percentages.
* **AI Candidates (`AICandidates.jsx`)**: List of applicants with status `Shortlisted`. HR can review AI scores, reject them, or schedule an interview.
* **Interviews (`Interviews.jsx`)**: HR dashboard list of scheduled interviews. Includes modal to schedule times, date, and mode.
* **Top Candidates (`TopCandidates.jsx`)**: Renders candidates sorted by highest similarity score.
* **Student Dashboard (`StudentDashboard.jsx`)**: Candidate landing portal. Shows profile welcome card and shortcuts.
* **Available Jobs (`AvailableJobs.jsx`)**: Candidate view of all published jobs available for application.
* **Apply Job (`ApplyJob.jsx`)**: Candidate form to submit details and upload resume files. Triggers the AI model automatically upon submission.
* **My Applications (`MyApplications.jsx`)**: Candidate application history tracker.
* **Interview Status (`InterviewStatus.jsx`)**: Candidate list of scheduled interviews, with mode and date.

---

## 6. Route Map
### Frontend Routes
* `/` -> `Login` (Public)
* `/register` -> `Register` (Public)
* `/dashboard` -> `Dashboard` (Protected: Logged in users)
* `/jobs` -> `Jobs` (Role Protected: HR)
* `/applications` -> `Applications` (Role Protected: HR)
* `/candidates` -> `Candidates` (Role Protected: Admin, HR)
* `/manage-jd` -> `ManageJD` (Role Protected: Admin)
* `/ai-candidates` -> `AICandidates` (Role Protected: Admin, HR)
* `/interviews` -> `Interviews` (Role Protected: Admin, HR)
* `/top-candidates` -> `TopCandidates` (Role Protected: Admin, HR)
* `/student-dashboard` -> `StudentDashboard` (Role Protected: Candidate)
* `/available-jobs` -> `AvailableJobs` (Role Protected: Candidate)
* `/apply-job` -> `ApplyJob` (Role Protected: Candidate)
* `/my-applications` -> `MyApplications` (Role Protected: Candidate)
* `/interview-status` -> `InterviewStatus` (Role Protected: Candidate)

### Backend API Routes
* **Auth**:
  * `POST /api/auth/register` -> Create account.
  * `POST /api/auth/login` -> Authenticate credentials, return JWT.
* **Jobs**:
  * `POST /api/jobs` -> Post a job description.
  * `GET /api/jobs/all` -> Get all job descriptions.
  * `GET /api/jobs/open` -> Get published jobs.
  * `PUT /api/jobs/publish/:id` -> Change status to Active.
  * `PUT /api/jobs/close/:id` -> Change status to Closed.
  * `DELETE /api/jobs/:id` -> Delete a job.
* **Applications**:
  * `POST /api/applications` -> Upload candidate data and resume.
  * `GET /api/applications/all` -> Return all applications.
  * `GET /api/applications/email/:email` -> Return applications for a specific candidate (Protected).
  * `PUT /api/applications/status/:id` -> Update status.
  * `PUT /api/applications/shortlist/:id` -> Mark application status as Shortlisted.
  * `PUT /api/applications/reject/:id` -> Mark application status as Rejected.
  * `PUT /api/applications/score/:id` -> Update match score.
* **AI Scoring**:
  * `PUT /api/ai/run/:id` -> Parse PDF resume text, evaluate TF-IDF similarity, direct match skills, and update database score.
* **Interviews**:
  * `POST /api/interviews` -> Create interview record.
  * `GET /api/interviews/all` -> Get all scheduled interviews.
  * `GET /api/interviews/email/:email` -> Get interviews for candidate (Protected).
  * `PUT /api/interviews/status/:id` -> Change status (e.g. Scheduled, Completed).
* **Dashboard**:
  * `GET /api/dashboard/stats` -> Fetch row counts for jobs, candidates, interviews, and top matching candidates.
* **HR Actions**:
  * `GET /api/hr/all-candidates` -> Fetch application names and scores.
  * `GET /api/hr/candidate/:id` -> Fetch application details.
* **Unused / Duplicated APIs**:
  * `/api/ai-candidates/run` -> Triggers AI parser but fails because it lacks the application ID parameter.
  * `/api/candidates/...` -> Unused CRUD APIs for candidate profiles.
  * `/api/resumes/...` -> Unused upload API pointing to missing resumes table.

---

## 7. Component Inventory
* **Navbar (`Navbar.jsx`)**: Shared header navbar showing title, logged-in user email, and a Logout button. Clear styles, simple state.
* **Sidebar (`Sidebar.jsx`)**: Left sidebar showing navigation lists based on user role (Admin, HR, Candidate).
* **ProtectedRoute (`ProtectedRoute.jsx`)**: Validates if user has an auth token, else redirects to `/`.
* **RoleProtectedRoute (`RoleProtectedRoute.jsx`)**: Validates if user's role is in the allowed array. If unauthorized, redirects to `/dashboard`.

---

## 8. UI/UX Analysis
* **Consistent Design System**: The app uses Bootstrap v5 for structural alignment, tables, input elements, buttons, and alert modules. Themeing is defined in `frontend/src/index.css` via custom CSS properties for text, borders, dark modes, and accent colors.
* **Strengths**: High contrast in buttons, standard Bootstrap grids, smooth scroll actions (AOS), interactive hover translation micro-effects on cards and buttons.
* **Weaknesses**:
  * Blue-gray theme is flat and standard.
  * Redundant CSS definitions exist in `App.css` (leftover template code).
  * No loading spinner animations for async network requests (e.g. while PDF parsing).
  * Form inputs are plain and lack floating labels or validation feedback states.

---

## 9. Authentication Analysis
* **Authentication Implementation**: Implemented via JSON Web Tokens (JWT) signed with a server secret.
* **Bypasses**: Frontend pages and backend auth controller contain manual overrides. If email and password match `admin@gmail.com`/`admin123`, `hr@gmail.com`/`123456` or `candidate@gmail.com`/`123456`, they bypass database checks.
* **Vulnerabilities**: 
  * The default JWT secret is hardcoded to `praveen_secret_key` if `JWT_SECRET` is absent in environment configuration.
  * Token storage uses standard `localStorage` which is susceptible to XSS (Cross-Site Scripting).

---

## 10. Database Analysis
The backend database has 7 tables configured in `db.js`:
* `users`: Stores logins, passwords (hashed), roles.
* `jobs` and `job_descriptions`: Redundant setup. `job_descriptions` stores Admin draft posts, whereas `jobs` stores active postings.
* `applications`: The central recruitment record tracking candidate names, emails, phones, job connections, PDF files, status, and AI scores.
* `interviews`: Tracks interview schedule dates, times, modes, and interviewer designations.
* `ai_candidates` (Unused): Stale structure.
* `candidates` (Unused): Stale structure.

---

## 11. API Inventory
*(See API Route Map in Section 6. All backend endpoints require verification tokens except public `/api/auth` login/register routes).*

---

## 12. AI Functionality Analysis
* **Resume Parsing & NLP Scoring**: Real AI.
  * Parsing: The backend reads the resume PDF via `fs.readFileSync` and extracts plaintext using `pdf-parse`.
  * Cosine Matcher: Plaintext is lowercased and fed into the Node.js `natural` library's `TfIdf` model along with job details. Terms are tokenized, term frequency-inverse document frequency vectors are calculated, and the cosine similarity percentage (0-100) is evaluated.
  * Skill Overlap: Checks if skill keywords inside the JD string exist in the resume text. 
  * Weighting: Match score = (Cosine Similarity * 60%) + (Skill Ratio * 40%).
* **Limitations**: No actual neural network, embeddings, or LLM integrations are used. If spelling mismatches or synonyms exist, similarity scores drop significantly.

---

## 13. Application Data Flow
### Job Creation and Application
1. **Drafting (Admin)**: Admin writes JD -> `/api/job-descriptions` -> `job_descriptions` Table.
2. **Publishing (HR)**: HR retrieves drafts -> click "Publish" -> `/api/jobs` -> `jobs` Table.
3. **Applying (Candidate)**: Candidate uploads details & PDF resume -> `/api/applications` -> uploads PDF to `uploads/resumes` -> Inserts record into `applications` table.
4. **AI Scoring (Automated)**: Upon submission, frontend calls `/api/ai/run/:id` -> Reads PDF file -> TF-IDF Cosine Scoring -> Direct skill validation -> Updates `applications` score and status -> Returns score.

---

## 14. Mock Data and Hardcoded Values
All list-fetching pages in the frontend include catch blocks that fallback to hardcoded mock arrays:
* **Dashboard Stats fallback**: Renders `jobs: 12, candidates: 45, interviews: 8, topCandidates: 5`.
* **AICandidates fallback**: Renders profiles for "Alice Johnson" and "Diana Prince".
* **Candidates fallback**: Renders candidates (Alice, Bob, Charlie, Diana).
* **Login local fallback**: Validates local mock tokens for bypass accounts if API requests fail.

---

## 15. Security Audit
* **Exposed API Secrets**: No exposed API secrets in code repositories. Environment credentials are set up.
* **JWT Weaknesses**: Hardcoded secret fallbacks in middleware/auth controller.
* **Validation Gaps**: Insufficient backend verification of fields (e.g. phone formats, PDF type confirmation, payload size limits).

---

## 16. Code Quality Issues
* **Dead Code**: Unused controllers/models for candidates, ai_candidates, resumes, and unused Python files.
* **Hardcoded styling values**: Font properties, border ratios, colors, and layout widths inline in components.
* **Prop Drilling / State Management**: No global context or store used. Token validation is read from `localStorage` on each component load.
* **Typo/Inconsistent Casing**: `login.jsx` (lowercase L) vs `Register.jsx` (uppercase R).

---

## 17. Responsiveness Issues
* **Tables**: Multi-column tables (e.g. applications, interviews) cause horizontal scroll/overflow on mobile viewports.
* **Sidebar**: The sidebar takes up a fixed 250px and does not collapse on smaller displays.

---

## 18. Accessibility Issues
* **Image Alt-Text**: No alt text tags on dynamic graphics.
* **Form Labels**: Missing association tags (`htmlFor` with inputs) in login/register pages.
* **Focus States**: Buttons/inputs lack keyboard focus rings.

---

## 19. Dependency Analysis
* Frontend dependencies are modern (React 19, Vite 8). Bootstrap and axios are standard.
* Backend dependencies (Express 5, mysql2, natural, pdf-parse) are robust and require no upgrades in this phase.

---

## 20. Bugs Found
1. **Unused route `/run`**: `/api/ai-candidates/run` fails when called because it is missing the route ID parameter.
2. **Missing `resumes` Table**: The model `resumeModel.js` queries a non-existent `resumes` table.
3. **RoleProtectedRoute Fallback**: Redirects to `/dashboard` even if token is absent, triggering an infinite redirect chain.

---

## 21. Issues Fixed During Phase 1
* Added root `.gitignore` to prevent committing packages, secrets, and environment profiles.
* Added backend `.gitignore` ignoring node modules, `.env` config, and dynamic PDF upload folders.
* Created backend `.env.example` file.
* Created frontend `.env.example` file.
* Created `.gitkeep` placeholder files inside the `uploads/JD` and `uploads/resumes` folders to ensure folder structures remain committed in git.

---

## 22. Remaining Technical Debt
* Cleanup of unused controllers (`candidateController.js`, `resumeController.js`), models (`aiCandidateModel.js`, `candidateModel.js`, `resumeModel.js`), and routes (`aiCandidateRoutes.js`, `candidateRoutes.js`, `resumeRoutes.js`).
* Deletion of the unused Python virtualenv and `ai-engine` scripts.
* Addition of collapsing navbar features for mobile screens.

---

## 23. Recommended Architecture Improvements
1. **Database Schema Normalization**: Consolidate `jobs` and `job_descriptions` tables. Eliminate unused tables.
2. **AI scoring refinement**: Introduce an modern AI/LLM integration using OpenAI or Gemini APIs to parse and score candidate profiles instead of basic string matching.

---

## 24. Phase 2 Recommendations
* Design and implement a standard CSS configuration system using CSS variables.
* Build collapsible layouts and sidebars for responsive navigation.
* Standardize form designs and add loading animations.

---

## 25. Final Phase 1 Status
* **Development Server**: PASS
* **Production Build**: PASS
* **Existing Routes**: PASS
* **Authentication**: PASS
* **Database**: PASS
* **AI Features**: REAL (TF-IDF Similarity in JS)
* **Security**: PASS (Offline bypass present for demo)
* **Responsiveness**: NEEDS IMPROVEMENT (Sidebar and Tables require optimization)
* **Code Quality**: NEEDS IMPROVEMENT (Clean up vestigial files and duplicate tables)
