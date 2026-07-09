# Render Database Configuration Fix Guide

This guide details how to configure the Render backend service to connect securely to your remote MySQL-compatible production database.

---

## Service Properties

Configure your Web Service on the Render Dashboard with the following settings:

* **Runtime**: `Node`
* **Root Directory**: `backend`
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Health Check Path**: `/health`

---

## Required Environment Variables

Add the following key-value pairs in the **Environment** tab of your Render Web Service:

| Variable Name | Required Value / Format | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security constraints, disables localhost fallbacks, and turns on fail-fast validations. |
| `DATABASE_URL` | `mysql://USERNAME:PASSWORD@REMOTE_HOST:PORT/DATABASE_NAME` | The secure remote MySQL database connection string. |
| `DB_SSL` | `true` or `false` | Set to `true` if your hosted MySQL provider requires SSL (e.g. Aiven, TiDB Cloud). |
| `DB_CONNECTION_LIMIT` | `5` | Maximum database connections in the connection pool. Default is `5` for small/free plans. |
| `JWT_SECRET` | `[your-secure-high-entropy-jwt-secret]` | String secret used to sign and verify JWT authentication tokens. |
| `FRONTEND_URL` | `https://[your-app].vercel.app` | The production domain of your Vercel frontend (enables secure CORS communication). |
| `SEED_DEMO_DATA` | `false` | (Optional) Prevents seeding demo candidates/jobs into the production database. Set to `true` only if you explicitly want to populate mock tables. |

---

## Step-by-Step Configuration Instructions

1. **Open Render Dashboard**: Log into [Render](https://dashboard.render.com/) and navigate to your backend Web Service page.
2. **Access Environment Settings**: Click on **Environment** in the left-hand navigation bar.
3. **Remove Obsolete Variables**: Delete any conflicting local database variables (like `DB_HOST=localhost` or local database passwords) to prevent environment pollution.
4. **Add Variables**: Add the variables listed in the table above (e.g., `NODE_ENV=production`, `DATABASE_URL`, `DB_SSL=true`, `JWT_SECRET`, etc.).
5. **Save Changes**: Click **Save Changes**. Render will automatically queue a new deployment of the latest commit to load the new settings.
6. **Verify Build & Startup Logs**:
   - Go to the **Events** or **Logs** tab of the service.
   - Ensure the server starts up cleanly and prints the expected database logs:
     ```
     Server running on port 8080 - server ready
     Production database configuration detected. Connecting directly to remote MySQL database...
     Database connected via DATABASE_URL/MYSQL_URL connection string
     Database and tables initialized successfully.
     ```
7. **Test Health Endpoints**:
   - Open `https://your-service.onrender.com/health` in a browser. It should return `{"status":"ok", ...}`.
   - Open `https://your-service.onrender.com/health/db` in a browser. It should return:
     ```json
     {
       "status": "ok",
       "database": "connected"
     }
     ```
8. **Test Front-to-Back Flow**:
   - Navigate to your production Vercel frontend.
   - Try to register a new recruiter/admin account or log in. It should succeed without yielding an HTTP 500 database error.
