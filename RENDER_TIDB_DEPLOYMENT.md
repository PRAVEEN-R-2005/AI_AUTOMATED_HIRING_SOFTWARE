# Render Production Deployment Guide — AI Automated Hiring Software

## Service Configuration

| Setting | Value |
|---|---|
| **Name** | `ai-automated-hiring-backend` |
| **Runtime** | Docker |
| **Root Directory** | `backend` |
| **Dockerfile Path** | `./Dockerfile` |
| **Branch** | `main` |
| **Health Check Path** | `/health` |
| **Plan** | Free (or paid) |
| **Auto Deploy** | Yes (on push to main) |

> Build and start commands are handled by the Dockerfile — leave them blank in Render.

---

## Required Environment Variables

Set these in: **Render Dashboard → Web Service → Environment**

| Variable | Value | Notes |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?sslMode=VERIFY_IDENTITY` | Your TiDB Cloud JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | *(your TiDB username)* | From TiDB Cloud console |
| `SPRING_DATASOURCE_PASSWORD` | *(your TiDB password)* | From TiDB Cloud console |
| `JWT_SECRET` | *(long random string)* | Min 32 chars, e.g. `openssl rand -hex 32` |
| `SPRING_PROFILES_ACTIVE` | `production` | Already set in render.yaml |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL |
| `JPA_DDL_AUTO` | `update` | Auto-creates tables on first deploy |
| `APP_DEMO_MODE` | `false` | No demo seed data |

---

## Deployment Steps

1. **Commit and push** all changes to `main`
2. **Log into** [Render Dashboard](https://dashboard.render.com/)
3. **Create Web Service** → Connect GitHub repo
4. Set **Root Directory** = `backend`, **Runtime** = Docker
5. **Add environment variables** from the table above
6. Click **Deploy**
7. Watch build logs — expect `BUILD SUCCESS` from Maven
8. Watch startup logs — expect:
   ```
   ATS Backend — Startup Environment Check
   All required environment variables are present.
   HikariPool-1 - Started.
   Initializing Database Schemas, Tables and Indices...
   Database initialization completed successfully.
   Started AtsApplication in X.XXX seconds
   ```
9. **Test** `https://your-backend.onrender.com/health`

---

## Health Check Endpoints

| Endpoint | Auth | Expected Response |
|---|---|---|
| `GET /health` | None | `{"status":"UP","timestamp":...}` |
| `GET /api/health/db` | None | `{"status":"UP","database":"CONNECTED"}` |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Could not resolve placeholder` | Missing env vars | Set all vars in Render Dashboard |
| `HikariPool - Connection is not available` | Wrong DB credentials or URL | Verify TiDB Cloud URL, username, password |
| `SSL handshake failure` | Missing `sslMode=VERIFY_IDENTITY` in URL | Add `?sslMode=VERIFY_IDENTITY` to JDBC URL |
| `Access denied for user` | Wrong TiDB username/password | Check TiDB Cloud console for correct credentials |
| `Table doesn't exist` | `JPA_DDL_AUTO` not set to `update` | Set `JPA_DDL_AUTO=update` in Render env |
