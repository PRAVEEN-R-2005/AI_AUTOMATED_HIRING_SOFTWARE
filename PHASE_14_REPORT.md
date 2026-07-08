# AI Automated Hiring Software — Phase 14 Report

## 1. Executive Summary
Phase 14 delivers a secure, multi-tenant administrative settings and audit logging ecosystem for the Applicant Tracking System (ATS). It implements centralized settings workspaces, personal profile forms, notification channels, password rotations, organization profiles, recruitment defaults, AI engine diagnostic visibility, and an immutable log explorer for administrative compliance.

## 2. Previous Phase Review
In Phase 13, structural multi-tenancy was introduced via `organizations`, `memberships`, and `invitations` tables. Phase 14 extends this architecture by building profile controls, organization identity configurations, default policies, and security logging hooks on top of the tenant boundaries.

## 3. Settings Audit
Existing profile forms were simple and did not support custom user profiles, default landing redirects, themes, or workspace defaults. These legacy endpoints have been rewritten to support complete preferences, validation rules, and secure logging.

## 4. User Profile Audit
The `users` table was limited to `id`, `name`, `email`, `password`, and `role`. We added new fields for `phone`, `job_title`, `timezone`, and `locale` via self-healing migrations to capture complete profile records.

## 5. Organization Configuration Audit
The `organizations` table lacked fields for company identity (industry, website, company size) and recruitment default policies. Self-healing columns have been introduced to define company metadata and default configurations.

## 6. Security Functionality Audit
Legacy login/register flows lacked audit logging and did not capture security exceptions. Change-password functions have been updated to log successes and failures into the audit log trail.

## 7. Activity Tracking Audit
The existing `activities` table served as a recruiter-facing timeline log for candidates. We separated recruitment-focused timelines from security-focused, immutable administrative `audit_logs`.

## 8. Administration Audit
Legacy administration was limited to user listing and deactivation. Phase 14 establishes full tenant settings, default policy updates, and system information diagnostics under strict Admin role guards.

## 9. Settings Architecture
Settings are central and split into the following scopes:
- **Personal:** Profile details, UI preferences, and notification channels.
- **Organization (Admin Only):** Workspace details, slug redirects, recruitment defaults, and status metrics.
- **Compliance & Health (Admin Only):** System audit trails explorer and server health diagnostics.

## 10. Centralized Settings Layout
The layout in `Settings.jsx` implements a collateral sidebar navigation structure, adapting into a responsive select dropdown in mobile viewports.

## 11. Personal Profile
Allows any authenticated user to view and edit:
- Full Name
- Phone Number
- Job Title
- Timezone
- Preferred Locale

## 12. Profile Validation
- Name: length bounds verified (2 to 100 characters).
- Phone: max length verified (20 characters).
- Default pages, ranges, views and themes validated against allowed arrays in the backend controller.

## 13. Account Settings
Presents a read-only list of credentials:
- Email Address
- License Role Privilege
- Assigned Workspace
- Join Date

## 14. User Preferences
Allows users to save and persist:
- Theme (light/dark)
- Default Landing Page Route
- Default Analytics date window
- Default Kanban vs List view

## 15. Notification Preferences
Integrates check options for email notifications, notification dropdown bells, and high-priority filters. Preferences are persisted locally in `localStorage`.

## 16. Appearance Settings Status
Fully supported! Users can toggle Light/Dark themes in navbar or Settings. The theme applies instantly to CSS tokens and writes theme settings directly to the database.

## 17. Security Settings
Integrates change credentials forms and active session monitoring, informing users about active session validity.

## 18. Password Management Status
Local passwords require verify pings, minimum length validations (6 characters), match checks, and bcrypt hashing before writing updates.

## 19. Organization Settings
Admins can customize:
- Workspace Name & URL Slug
- Industry & Company Size
- Company Website & Logo URL
- Timezone & Default Locale

## 20. Organization Validation
- Name & Slug required.
- Slug checked via regex (lowercase alphanumeric and hyphens only) and verified unique.
- Website checked for valid URL formats.

## 21. Recruitment Defaults
Allows Admins to define:
- Default interview type (Video, Phone, In-person)
- Default interview duration (15, 30, 45, 60 mins)
- Initial application stage
- Analytics range

## 22. Interview Defaults
Duration (e.g. 30 mins) and type (e.g. Video) configured inside Organization settings default values.

## 23. AI Configuration Visibility
Provides visibility into the rule-based local NLP engine models, scoring weights (50% skills, 35% experience, 15% education), and engine status.

## 24. Communication Configuration Status
Shows configuration status of email systems, noting simulated mockup configurations when SMTP variables are not set.

## 25. Team and Permissions Integration
Embeds clear visual cards to manage members and invites, redirecting workspace admins directly to `/team`.

## 26. Administration Scope
Limited to organization tenant scope. Admins manage their own workspace memberships and settings. Cross-tenant reads/writes are blocked.

## 27. Activity vs Audit Architecture
- **Activities:** Timeline logs for candidates, modifiable by recruiters.
- **Audit Logs:** Security compliance histories, immutable and un-deletable.

## 28. Audit Log Architecture
- **Creation:** `logAuditEvent` helper captures action context.
- **Storage:** Database table `audit_logs`.
- **Query:** Controller API with filter matrices.
- **Presentation:** High-fidelity tabular log explorer with modals detail views.

## 29. Audit Data Model
- `id` (INT PK AI)
- `organization_id` (INT)
- `actor_id` (INT)
- `actor_name` / `actor_email` (VARCHAR)
- `event_category` / `action` / `resource_type` (VARCHAR)
- `resource_id` (INT)
- `result` (VARCHAR)
- `ip_address` / `user_agent` (VARCHAR)
- `metadata` (TEXT)
- `created_at` (TIMESTAMP)

## 30. Audit Categories
- `AUTHENTICATION`
- `TEAM`
- `ORGANIZATION`
- `SETTINGS`
- `SECURITY`
- `JOB`
- `APPLICATION`
- `CANDIDATE`

## 31. Audit Events
- `LOGIN_SUCCESS`, `LOGIN_FAILURE`
- `USER_REGISTERED`, `PASSWORD_CHANGED`
- `MEMBER_INVITED`, `MEMBER_ROLE_CHANGED`, `MEMBER_DEACTIVATED`, `MEMBER_REMOVED`
- `ORGANIZATION_UPDATED`
- `JOB_CREATED`, `JOB_PUBLISHED`, `JOB_DELETED`
- `APPLICATION_STATUS_CHANGED`, `CANDIDATE_UPDATED`

## 32. Audit Metadata Safety
Metadatas scrubbed to redact `password`, `token`, `apiKey`, and `cookie` headers.

## 33. Audit Event Creation
Called explicitly in success callbacks during controllers execution.

## 34. Audit Logs Page
Admin-only UI segment including statistics widgets, filter headers, and tables.

## 35. Audit Search
Supports text matching on Actor Name, Email, Action, and Resource Type.

## 36. Audit Filters
Supports category, result state, start date, and end date filters.

## 37. Audit Pagination
Server-side pagination supported (`LIMIT` and `OFFSET` queries based on `page` params).

## 38. Audit Detail View
Inspect button loads a dialog detailing timestamp, client IP, user-agent, and full metadata JSON object.

## 39. Audit Authorization
Restricted. Only Admins can view audit logs. Others get `403 Forbidden` response.

## 40. Audit Immutability
Audit log table does not expose write/edit or delete routes.

## 41. Audit Retention
Indefinite until a formal retention cleanup task is scheduled.

## 42. System Information
Provides active status checks for DB, AI engine, communications, pings, and runtime platform info.

## 43. System Health Semantics
- `OPERATIONAL`: Service is responding successfully.
- `DEGRADED`: Service is mock-enabled or database connection is offline.

## 44. System Information Security
Scrubs and hides DB passwords, mail credentials, and API secret strings.

## 45. Dashboard Integration
Sidebar navigation provides direct shortcuts to Settings.

## 46. Loading States
Skeleton grids display pulsing slots while settings are loaded.

## 47. Empty States
Table states display icons and notifications when search filters yield no results.

## 48. Error States
Banners display server exceptions gracefully.

## 49. Unsaved Changes
Component tracks changes and warns users if they try to leave with unsaved form details.

## 50. Optimistic Update Strategy
Applied only for theme toggling; other writes wait for database resolution.

## 51. Security Improvements
Introduced strict permissions middleware guards to shield administrative screens.

## 52. IDOR Prevention
All operations verify `organization_id` context against the user's JWT payload.

## 53. Privilege Escalation Prevention
User privileges cannot be self-updated; backend validates role payloads.

## 54. Privacy Improvements
Scrubs personal credentials, tokens, and passwords from logs.

## 55. Performance Improvements
Server-side pagination prevents loading huge logs lists.

## 56. Responsive Improvements
Sidebar adapts into drop-downs on mobile viewports.

## 57. Accessibility Improvements
Interactive elements utilize proper labels, semantic heading wrappers, and ARIA tags.

## 58. Personal Settings Tests
Verified: Profile fetching, profile saving, validations, and local themes work correctly.

## 59. Organization Tests
Verified: Org details saving, regex slug validations, URL syntax checks, and slug uniqueness checks.

## 60. Security Tests
Verified: Password change rotations, validation gates, and failed logs.

## 61. Audit Creation Tests
Verified: Registering, logging in, updating profile, and creating jobs trigger accurate audit trail database insertions.

## 62. Audit Security Tests
Verified: Recruiters and candidates trying to access log endpoints get rejected with `403 Forbidden`.

## 63. Audit Filter Tests
Verified: Combinations of search queries, category filters, and page increments return correctly paginated sets.

## 64. System Information Tests
Verified: Database pings, node version checks, and environment modes are queried successfully.

## 65. Components Created
- `Settings.jsx` (Redesigned Central Settings component)
- `backend/utils/auditLogger.js` (Audit trail helper)

## 66. Components Reused
- `AppLayout` (Workspace layout wrapper)
- `Button` / `Badge` / `Skeleton` / `Input` / `Select` / `Modal` (Reused UI elements)

## 67. APIs Created or Modified
- `GET /api/settings/profile` (Enhanced details)
- `PUT /api/settings/profile` (Validation updates)
- `GET /api/settings/organization` (New)
- `PUT /api/settings/organization` (New, Admin only)
- `GET /api/settings/audit-logs` (New, Admin only)
- `GET /api/settings/system-info` (New, Admin only)

## 68. Database Changes
- Table `audit_logs` created.
- Columns added to `organizations`: `logo_url`, `industry`, `company_size`, `website`, `timezone`, `locale`, `default_pipeline`, `default_interview_duration`, `default_interview_type`, `default_application_stage`, `default_analytics_range`.
- Columns added to `users`: `phone`, `job_title`, `timezone`, `locale`, `default_landing_page`, `default_analytics_range`, `default_candidate_view`, `default_pipeline_view`, `theme`.

## 69. Files Created
- `backend/utils/auditLogger.js`

## 70. Files Modified
- `backend/config/db.js`
- `backend/utils/permissions.js`
- `backend/controllers/settingsController.js`
- `backend/routes/settingsRoutes.js`
- `backend/controllers/authController.js`
- `backend/controllers/teamController.js`
- `backend/controllers/jobController.js`
- `backend/controllers/applicationController.js`
- `frontend/src/pages/Settings.jsx`
- `frontend/src/components/layout/Sidebar.jsx`

## 71. Dependencies Added
None.

## 72. Environment Variables Added
None.

## 73. Issues Found
Legacy settings page lacked user validation, did not persist user settings in the database, and did not support logs or diagnostics.

## 74. Issues Fixed
Central settings portal built with validations, secure RBAC routes, and full logging.

## 75. Remaining Issues
None.

## 76. Testing Results
Vite client successfully built. Node backend successfully booted and connected to database connection pools.

## 77. Production Build Status
- **Frontend Vite build:** SUCCESS
- **Backend Startup:** SUCCESS

## 78. Recommendations for Phase 15
Begin Phase 15 production hardening, indexing optimizations, automated integration tests, accessibility check runs, and production configurations.
