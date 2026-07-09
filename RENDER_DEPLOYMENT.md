# Render and Vercel Production Deployment Guide

This guide provides step-by-step instructions to deploy the AI Automated Hiring Software backend on **Render (Free Tier)**, the database on a free-tier MySQL provider, and the frontend on **Vercel (Free Tier)**.

---

## Part 1 — Prerequisites
1. A **GitHub** account containing your repository: `AI_AUTOMATED_HIRING_SOFTWARE`.
2. A **Render** account.
3. A **Vercel** account.
4. A free-tier MySQL database provider account (e.g. **Aiven MySQL** or **TiDB Cloud Serverless**).

---

## Part 2 — Database Creation

### Recommended Provider: Aiven MySQL (Free Tier) or TiDB Cloud (Serverless Free Tier)
1. **Sign up**: Go to [aiven.io](https://aiven.io/) or [pingcap.com/tidb-cloud](https://pingcap.com/products/tidb-cloud/) and sign up for a free account.
2. **Create MySQL Instance**:
   - Choose MySQL as the database engine.
   - Choose the free plan.
   - Choose your preferred cloud provider and region close to your target users.
3. **Database Credentials**: Retrieve and save the connection details:
   - **Host**
   - **Port**
   - **Username**
   - **Password**
   - **Database Name** (Defaults to `defaultdb` or `hr_hiring_system`)
   - **Connection URL** (e.g., `mysql://user:pass@host:port/dbname`)
4. **SSL Requirements**: Since remote free-tier databases require secure connections, the database configuration automatically turns on SSL support when `DB_SSL=true` is set.
5. **Schema Initialization & Seeding**: No manual commands are needed! The backend automatically initializes tables and seeds demo recruiter accounts/jobs on startup inside `backend/config/db.js`.

---

## Part 3 — Render Backend Deployment

1. **Sign in** to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New** > **Web Service**.
3. Connect your **GitHub repository** (`AI_AUTOMATED_HIRING_SOFTWARE`).
4. Enter the following Web Service configurations:
   - **Name**: `ai-automated-hiring-backend`
   - **Region**: Select a region close to your database.
   - **Branch**: `main` (or your active production branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select the **Free** plan.
5. Click **Deploy Web Service**.
6. Wait for the build and deployment logs to show that the server is running.
7. Note down your Render backend URL: `https://ai-automated-hiring-backend.onrender.com`.

---

## Part 4 — Database Configuration

Configure the database environment variables under **Environment** on the Render dashboard:
* **Option A: Unified Connection URL (Recommended)**
  - `DATABASE_URL`: `mysql://user:pass@host:port/dbname`
  - `DB_SSL`: `true`

* **Option B: Separate Parameters**
  - `DB_HOST`: `your-database-hostname`
  - `DB_PORT`: `3306` (or provider port)
  - `DB_USER`: `your-username`
  - `DB_PASSWORD`: `your-secure-password`
  - `DB_NAME`: `your-database-name`
  - `DB_SSL`: `true`

---

## Part 5 — Vercel Frontend Deployment

1. **Sign in** to [Vercel](https://vercel.com/).
2. Click **Add New** > **Project** and import your `AI_AUTOMATED_HIRING_SOFTWARE` GitHub repository.
3. In Vercel Project Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite` (automatically detected)
   - **Build & Development Settings**: Keep defaults (`npm run build`, `dist` directory)
4. Add **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://ai-automated-hiring-backend.onrender.com` (Your Render backend URL)
5. Click **Deploy**.
6. Retrieve your frontend URL (e.g. `https://ai-automated-hiring-software.vercel.app`).

---

## Part 6 — Final CORS Update

After Vercel assigns your production URL, return to the **Render Dashboard** to secure the backend API CORS policy:
1. Go to your backend Web Service.
2. Under **Environment**, add:
   - `FRONTEND_URL`: `https://ai-automated-hiring-software.vercel.app` (without trailing slash)
   - `JWT_SECRET`: `your-secure-high-entropy-jwt-secret`
   - `NODE_ENV`: `production`
3. Click **Save Changes**.

---

## Part 7 — Redeployment

Render will automatically trigger a redeployment once you save new environment variables. You can also manually trigger a redeployment:
1. Go to the Web Service dashboard.
2. Click **Manual Deploy** > **Clear Cache and Deploy**.

---

## Part 8 — Production Testing Checklist

Ensure everything is working correctly by validating:
- [ ] **Health Check**: Open `https://ai-automated-hiring-backend.onrender.com/health` in your browser. It should return `{"status":"ok", ...}`.
- [ ] **Registration**: Sign up a new user via the Vercel frontend.
- [ ] **Login**: Authenticate successfully with the newly created account.
- [ ] **Recruiter Dashboard**: Verify dashboard statistics load.
- [ ] **Job Creation**: Publish a new job and upload a JD.
- [ ] **Resume Upload & AI screening**: Submit an application with a PDF resume and check the extracted match score.
- [ ] **Logout**: Clear local tokens and end the session.

---

## Part 9 — Troubleshooting

* **Build failed / Node Version issues**:
  - Render defaults to standard LTS Node.js. If you need a specific Node version, add the environment variable `NODE_VERSION` with the desired version value (e.g., `20.12.0`) in the Render dashboard.
* **Database connection errors**:
  - Check database credentials and ensure `DB_SSL=true` is set. Many free-tier providers block connections that do not use SSL.
* **CORS errors**:
  - Ensure the backend's `FRONTEND_URL` environment variable exactly matches your Vercel URL, and does not have a trailing `/`.
* **Render Free Service Sleep Behavior**:
  - Render free web services automatically sleep after 15 minutes of inactivity. The first request after a sleep period can take up to 50 seconds to boot up. The health check is highly useful for waking up the container.
* **401 Unauthorized / Token Issues**:
  - Check that the `JWT_SECRET` environment variable matches and is set securely.
