# Google Cloud & Vercel Production Deployment Guide

This guide provides step-by-step instructions to deploy the AI Automated Hiring Software project in a production environment using Google Cloud Run (Backend), Google Cloud SQL for MySQL (Database), and Vercel (Frontend).

---

## Architecture Overview

```
GitHub Repository
   │
   ├── / (Root) ─── Frontend ───────> Vercel
   │
   └── /backend ─── Container ──────> Google Cloud Run
                                             │
                                             └───> Google Cloud SQL for MySQL
```

---

## Prerequisites

Before starting, make sure you have:
1. A **Google Cloud Platform (GCP)** account.
2. A **Vercel** account.
3. The **Google Cloud SDK (gcloud CLI)** installed locally.
4. **Git** installed locally.

---

## Phase 1: Google Cloud Initialization

### 1. Google Cloud Project Setup
Create a new project in the Google Cloud Console or via CLI:
```bash
gcloud projects create ai-automated-hiring-software --name="AI Automated Hiring Software"
```

### 2. Enable Billing
Google Cloud Run and Cloud SQL require billing to be enabled. 
- Go to the GCP Console: **Billing** > **Link a billing account** to your project.

### 3. Enable Required Google Cloud APIs
Enable the necessary services for container builds, serverless deployment, and database access:
```bash
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com
```

### 4. Authenticate Google Cloud CLI
Login and authenticate the gcloud command-line interface:
```bash
gcloud auth login
```

### 5. Set Default Project
Configure the default project for the CLI:
```bash
gcloud config set project ai-automated-hiring-software
```

---

## Phase 2: Configure Google Cloud SQL for MySQL

### 1. Create a Cloud SQL MySQL Instance
Deploy a production-ready MySQL instance (we will use a lightweight `db-f1-micro` machine for demo purposes, but suggest scaling for heavy loads):
```bash
gcloud sql instances create hiring-mysql-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=us-central1
```

### 2. Create the Database
Create the production database schema:
```bash
gcloud sql databases create hr_hiring_system --instance=hiring-mysql-db
```

### 3. Create a Database User & Secure Password
Generate a secure, high-entropy password and create a database user:
```bash
gcloud sql users create hr_user \
    --instance=hiring-mysql-db \
    --password="YOUR_SECURE_PRODUCTION_DB_PASSWORD"
```

### 4. Retrieve the Cloud SQL Instance Connection Name
Retrieve the unique instance connection string. You will need this to configure the Cloud Run Unix socket connection:
```bash
gcloud sql instances describe hiring-mysql-db --format="value(connectionName)"
```
*Expected format:* `project-id:region:instance-name` (e.g. `ai-automated-hiring-software:us-central1:hiring-mysql-db`).

---

## Phase 3: Deploy the Backend to Google Cloud Run

### 1. Build and Publish the Docker Container
Google Cloud Run can build your container using Cloud Build directly from source without having Docker installed locally. 
Navigate to the `/backend` directory and run:
```bash
cd backend
gcloud builds submit --tag gcr.io/ai-automated-hiring-software/hiring-backend
```

### 2. Deploy to Google Cloud Run
Deploy the built image to Google Cloud Run. We specify the SQL connection, bind to port 8080, allow public access, and configure database environment variables:

```bash
gcloud run deploy hiring-backend \
    --image gcr.io/ai-automated-hiring-software/hiring-backend \
    --platform managed \
    --region us-central1 \
    --add-cloudsql-instances=ai-automated-hiring-software:us-central1:hiring-mysql-db \
    --set-env-vars="NODE_ENV=production,DB_USER=hr_user,DB_NAME=hr_hiring_system,DB_SOCKET_PATH=/cloudsql/ai-automated-hiring-software:us-central1:hiring-mysql-db" \
    --set-secrets="DB_PASSWORD=DB_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest" \
    --allow-unauthenticated
```

> [!NOTE]
> For production safety, we use Google Cloud Secret Manager for sensitive variables like `DB_PASSWORD` and `JWT_SECRET`. 
>
> To set these secrets beforehand:
> ```bash
> echo -n "YOUR_SECURE_PRODUCTION_DB_PASSWORD" | gcloud secrets create DB_PASSWORD --data-file=-
> echo -n "YOUR_SECURE_JWT_SECRET_KEY" | gcloud secrets create JWT_SECRET --data-file=-
> ```
> Grant the Cloud Run service account access to read these secrets:
> ```bash
> gcloud secrets add-iam-policy-binding DB_PASSWORD --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
> gcloud secrets add-iam-policy-binding JWT_SECRET --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
> ```

### 3. Record the Cloud Run Service URL
Once successfully deployed, the CLI will output the service URL.
*Example:* `https://hiring-backend-xxxxxx-uc.a.run.app`

---

## Phase 4: Deploy the Frontend to Vercel

### 1. Configure Frontend API URL Environment Variable
Install Vercel CLI locally or deploy via the Vercel Dashboard.
Create a production environment variable matching the Cloud Run URL:
- Variable Name: `VITE_API_URL`
- Value: `https://hiring-backend-xxxxxx-uc.a.run.app` (your Cloud Run backend URL)

### 2. Deploy via Vercel CLI
Navigate back to the workspace root directory and deploy:
```bash
cd ..
vercel --prod
```
Retrieve the production URL from Vercel.
*Example:* `https://ai-automated-hiring-software.vercel.app`

---

## Phase 5: Complete CORS Security Setup

After obtaining your production Vercel frontend URL, update the `FRONTEND_URL` environment variable on the Cloud Run backend to enforce secure CORS headers:

```bash
gcloud run services update hiring-backend \
    --region us-central1 \
    --update-env-vars="FRONTEND_URL=https://ai-automated-hiring-software.vercel.app"
```

---

## Troubleshooting Guide

### 1. How to View Cloud Run Backend Logs
To inspect live production stdout/stderr logs from the backend:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=hiring-backend" --limit 50
```

### 2. Container Startup Errors
- **Error:** Container fails to start or listen on the specified port.
  - **Reason:** Ensure you didn't override the `PORT` env var with a custom port like `5000` in production. Cloud Run forces the port to `8080` (or whatever it sets in `PORT`).
  - **Resolution:** Verify `PORT` environment variable is not hardcoded, and the server binds to `0.0.0.0`.

### 3. Database Connection Errors
- **Error:** `connect ENOENT /cloudsql/project:region:instance`
  - **Reason:** Cloud Run does not have the `--add-cloudsql-instances` flag configured, or the Unix socket path mismatch.
  - **Resolution:** Verify that the SQL connection integration is enabled in your Cloud Run service configuration and matches `DB_SOCKET_PATH`.

### 4. CORS Errors
- **Error:** `Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy.`
  - **Reason:** The `FRONTEND_URL` env variable on the backend does not match the actual origin of the frontend (e.g. check for missing `https://` or trailing slash `/`).
  - **Resolution:** Update `FRONTEND_URL` on Cloud Run to match the Vercel URL exactly (without a trailing slash).

### 5. JWT & Authentication Errors
- **Error:** `Access Denied: Secure token configuration missing.` or token validation issues.
  - **Reason:** `JWT_SECRET` is not set or not loaded correctly on Cloud Run.
  - **Resolution:** Ensure the secret is successfully mapped from GCP Secret Manager and bound to the Cloud Run service instance.
