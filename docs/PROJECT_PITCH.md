# Project Pitch Scripts (Elevator Pitches)

Use these scripts to prepare verbal explanations of the project for recruiter calls, networking events, or interview introductions.

---

## 1. 30-Second Elevator Pitch
> *"I developed **Smart ATS**, a multi-tenant AI-powered Applicant Tracking System built with React, Node.js, and MySQL. It consolidates recruitment operations—like creating jobs, managing candidates through a Kanban pipeline, scheduling interviews, and tracking analytics. What makes it technically interesting is its multi-tenant architecture, where every route filters data by the user’s organization ID to prevent cross-tenant data leaks, alongside database composite indexes to optimize search queries and speed up response times."*

---

## 2. 1-Minute Project Pitch
> *"I built **Smart ATS** to solve manual resume screening fatigue and fragmented recruitment workflows. The stack includes a responsive React client built on Vite and a RESTful Express API connected to a MySQL database pool. The core engine automatically analyzes resume categories to display match scores, missing skill tags, and summaries for recruiters.
> 
> On the engineering side, I focused heavily on security and performance. I implemented role-based checks and organization-scoped queries to prevent IDOR leaks. I also set up a zero-dependency backend test suite using Node's native test runner to assert boundaries, and configured a self-healing schema migration script that updates database layouts dynamically on server start."*

---

## 3. 3-Minute Technical Pitch
> *"**Smart ATS** is a secure, multi-tenant Applicant Tracking System built with React, Node.js, Express, and MySQL. It organizes the hiring funnel—from job requisition posting, public applications, AI resume screening, pipeline kanban, scheduling, and analytics, to team mentions.
> 
> ### Architecture & Tenant Isolation
> The system follows a shared-database, shared-schema SaaS topology. The critical requirement here is tenant isolation. A user logged into Organization A should never see details belonging to Organization B. I implemented this by embedding the user's `organization_id` inside their signed JWT token. The Express router extracts this context via auth middleware and enforces filters on all MySQL operations.
> 
> ### Data Orchestration & Performance
> For performance, I integrated composite indices on table columns that are frequently joined and filtered, such as candidate profiles and interview records. This guarantees low query latencies. I also built self-healing database queries that run on server startup to verify schema layouts and execute alterations automatically.
> 
> ### Engineering Challenges
> One key challenge I solved was test flakiness. Because the database migrations run asynchronously, parallel test execution in process pools led to duplicate index failures and write locks. I resolved this by exposing an initialization promise from our connection module, which the tests await before launching assertions.
> 
> Ultimately, this project allowed me to gain deep experience with relational database constraints, clean API routing structures, SaaS security models, and zero-dependency integration testing."*
