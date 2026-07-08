# Production Deployment & Operations Manual

This document details server prerequisites, installation workflows, production configurations, and backup/recovery strategies.

## 1. System Requirements

### Hardware:
- **Min**: 1 vCPU, 2GB RAM
- **Recommended**: 2 vCPU, 4GB RAM

### Software Stack:
- **Node.js**: `v18.0.0` or higher (tested on `v26.2.0`)
- **Database**: MySQL `5.7` or `8.0`
- **Reverse Proxy**: Nginx (handling SSL termination)

---

## 2. Server Installation & Configuration

### Step 1: Clone and Configure Environment
Copy `.env.example` configurations to `.env` in both folders and populate them:

**Backend Settings (`backend/.env`)**:
```ini
PORT=5000
DB_HOST=localhost
DB_USER=ats_user
DB_PASSWORD=secure_db_password
DB_NAME=hr_hiring_system
JWT_SECRET=secure_high_entropy_signing_secret
```

**Frontend Settings (`frontend/.env`)**:
```ini
VITE_API_URL=https://api-hiring-ats.example.com
```

### Step 2: Install Dependencies and Build Frontend
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages and build bundle
cd ../frontend
npm install
npm run build
```

---

## 3. Production Hardening Checklist

1. **Change Default Port**: Protect standard admin ports.
2. **Disable Demo Logins**: Set `NODE_ENV=production` in backend configuration. Confirm that no demo account credentials can bypass authentication logic.
3. **Verify JWT Security**: Enforce that `JWT_SECRET` is not set to default fallbacks.
4. **Configure HTTPS**: Enforce SSL on Nginx configuration. Disable plain HTTP access.

---

## 4. Database Maintenance & Backups

### Automated Backups (Cron setup)
Set up daily backups using a standard `mysqldump` script:

```bash
mysqldump -u ats_user -p'secure_db_password' hr_hiring_system > /var/backups/db/ats_backup_$(date +%F).sql
```

### Restore Database
```bash
mysql -u ats_user -p'secure_db_password' hr_hiring_system < /var/backups/db/ats_backup_YYYY-MM-DD.sql
```
