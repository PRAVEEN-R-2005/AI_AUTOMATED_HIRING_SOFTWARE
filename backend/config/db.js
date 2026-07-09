require("dotenv").config();
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const isProduction = process.env.NODE_ENV === "production";

// Validate production configuration
if (isProduction) {
    const hasConnectionUrl = !!(process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQLURL);
    const hasIndividualParams = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
    if (!hasConnectionUrl && !hasIndividualParams) {
        console.error("FATAL ERROR: Production database configuration is missing. Set DATABASE_URL or the required DB_* environment variables.");
        process.exit(1);
    }
}

const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQLURL;

const useSSL = process.env.DB_SSL === "true" || 
                (connectionUrl && (
                    connectionUrl.includes("ssl=") || 
                    connectionUrl.includes("sslmode=") || 
                    connectionUrl.includes("tidbcloud") || 
                    connectionUrl.includes("aiven")
                ));
const sslOptions = useSSL ? { ssl: { rejectUnauthorized: true } } : {};

const shouldSeedDemo = process.env.SEED_DEMO_DATA === "true" || (!isProduction && process.env.SEED_DEMO_DATA !== "false");

let dbConfig;
let databaseName = process.env.DB_NAME || "hr_hiring_system";
let initConfig;

if (connectionUrl) {
    dbConfig = connectionUrl;
    try {
        const parsedUrl = new URL(connectionUrl);
        const pathname = parsedUrl.pathname.replace(/^\/+/, "");
        if (pathname) {
            databaseName = pathname.split("?")[0];
        }
        // Build initialization config with database name in production to connect directly
        initConfig = {
            host: parsedUrl.hostname,
            user: decodeURIComponent(parsedUrl.username),
            password: decodeURIComponent(parsedUrl.password),
            port: parsedUrl.port ? parseInt(parsedUrl.port) : 3306,
            database: databaseName,
            ...sslOptions
        };
        // For local development, remove database from initConfig so it can check/create first
        if (!isProduction) {
            delete initConfig.database;
        }
    } catch (e) {
        console.warn("Warning: Could not parse database connection URL for initialization, using connectionUrl directly:", e.message);
        initConfig = connectionUrl;
    }
} else {
    dbConfig = {
        host: process.env.DB_HOST || (isProduction ? undefined : "localhost"),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 3306,
        database: databaseName,
        ...sslOptions
    };
    initConfig = process.env.DB_SOCKET_PATH
        ? {
            socketPath: process.env.DB_SOCKET_PATH,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
          }
        : dbConfig;
        
    // Local TCP configuration: if not using sockets, remove database for initial verification
    if (!isProduction && !process.env.DB_SOCKET_PATH) {
        initConfig = {
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port,
            ...sslOptions
        };
    }
}

// Initialize database initialization promise
let resolveInit;
let rejectInit;
const initPromise = new Promise((resolve, reject) => {
    resolveInit = resolve;
    rejectInit = reject;
});

// Connect to MySQL server first to verify/create database and tables
const initConnection = mysql.createConnection(initConfig);

initConnection.connect((err) => {
    if (err) {
        console.error("FATAL ERROR: MySQL Server Connection Failed (Initialization):", err.message);
        if (isProduction) {
            process.exit(1);
        }
        resolveInit();
        return;
    }

    const runSchemaSetup = async () => {
        try {
            // Create all required tables
            const tables = [
                `CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS jobs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    skills TEXT,
                    experience VARCHAR(100),
                    salary VARCHAR(100),
                    location VARCHAR(255),
                    employment_type VARCHAR(100),
                    jd_file VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Pending',
                    published_by VARCHAR(50) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS job_descriptions (
                    jd_id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    skills TEXT,
                    experience VARCHAR(100),
                    salary VARCHAR(100),
                    location VARCHAR(255),
                    description TEXT,
                    created_by VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS applications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    job_id INT,
                    resume_file VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Pending',
                    match_score INT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS ai_candidates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    skills TEXT,
                    match_score INT,
                    resume_file VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS interviews (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_id INT,
                    application_id INT DEFAULT NULL,
                    job_id INT DEFAULT NULL,
                    candidate_name VARCHAR(255),
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    ai_score INT,
                    interview_date DATE,
                    interview_time VARCHAR(50),
                    mode VARCHAR(100),
                    interviewer VARCHAR(255),
                    interviewer_id INT DEFAULT NULL,
                    interviewer_name VARCHAR(255) DEFAULT NULL,
                    round VARCHAR(100) DEFAULT 'Technical Interview',
                    duration INT DEFAULT 30,
                    meeting_link VARCHAR(500) DEFAULT NULL,
                    status VARCHAR(50) DEFAULT 'Scheduled',
                    organization_id INT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS candidates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    resume VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS activities (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    application_id INT DEFAULT NULL,
                    candidate_name VARCHAR(255) DEFAULT NULL,
                    action VARCHAR(255) DEFAULT NULL,
                    details TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_email VARCHAR(255) NOT NULL,
                    type VARCHAR(100) NOT NULL,
                    priority VARCHAR(50) DEFAULT 'NORMAL',
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS communications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_id INT,
                    candidate_name VARCHAR(255),
                    type VARCHAR(100) NOT NULL,
                    subject VARCHAR(255),
                    message TEXT,
                    delivery_status VARCHAR(50) DEFAULT 'SENT',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS organizations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    status VARCHAR(50) DEFAULT 'ACTIVE',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS memberships (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    organization_id INT NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'ACTIVE',
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_org (user_id, organization_id)
                )`,
                `CREATE TABLE IF NOT EXISTS invitations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    organization_id INT NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    token_hash VARCHAR(255) NOT NULL UNIQUE,
                    invited_by INT NOT NULL,
                    status VARCHAR(50) DEFAULT 'PENDING',
                    expires_at TIMESTAMP NOT NULL,
                    accepted_at TIMESTAMP NULL DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
                )`,
                `CREATE TABLE IF NOT EXISTS job_assignments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    job_id INT NOT NULL,
                    user_id INT NOT NULL,
                    assigned_role VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_job_user (job_id, user_id)
                )`,
                `CREATE TABLE IF NOT EXISTS comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    organization_id INT NOT NULL,
                    resource_type VARCHAR(100) NOT NULL,
                    resource_id INT NOT NULL,
                    author_id INT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
                )`,
                `CREATE TABLE IF NOT EXISTS mentions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    comment_id INT NOT NULL,
                    user_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )`,
                `CREATE TABLE IF NOT EXISTS audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    organization_id INT NOT NULL,
                    actor_id INT DEFAULT NULL,
                    actor_name VARCHAR(255) NOT NULL,
                    actor_email VARCHAR(255) NOT NULL,
                    event_category VARCHAR(100) NOT NULL,
                    action VARCHAR(255) NOT NULL,
                    resource_type VARCHAR(100) NOT NULL,
                    resource_id INT DEFAULT NULL,
                    result VARCHAR(50) NOT NULL,
                    ip_address VARCHAR(45) DEFAULT NULL,
                    user_agent VARCHAR(255) DEFAULT NULL,
                    metadata TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
                    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
                )`
            ];

            for (const tableSql of tables) {
                await new Promise((resolve) => {
                    initConnection.query(tableSql, (err) => {
                        if (err) console.error("Error creating table:", err.message);
                        resolve();
                    });
                });
            }

            // Self-healing migrations for recruiter notes and rejection reasons
            await new Promise((resolve) => {
                initConnection.query("ALTER TABLE applications ADD COLUMN recruiter_notes TEXT DEFAULT NULL", () => resolve());
            });
            await new Promise((resolve) => {
                initConnection.query("ALTER TABLE applications ADD COLUMN rejection_reason TEXT DEFAULT NULL", () => resolve());
            });
            await new Promise((resolve) => {
                initConnection.query("ALTER TABLE applications ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", () => resolve());
            });

            // Self-healing interview columns for scheduling workflow
            const interviewColumns = [
                "ALTER TABLE interviews ADD COLUMN application_id INT DEFAULT NULL",
                "ALTER TABLE interviews ADD COLUMN job_id INT DEFAULT NULL",
                "ALTER TABLE interviews ADD COLUMN interviewer_id INT DEFAULT NULL",
                "ALTER TABLE interviews ADD COLUMN interviewer_name VARCHAR(255) DEFAULT NULL",
                "ALTER TABLE interviews ADD COLUMN round VARCHAR(100) DEFAULT 'Technical Interview'",
                "ALTER TABLE interviews ADD COLUMN duration INT DEFAULT 30",
                "ALTER TABLE interviews ADD COLUMN meeting_link VARCHAR(500) DEFAULT NULL",
                "ALTER TABLE interviews ADD COLUMN organization_id INT DEFAULT NULL"
            ];
            for (const columnSql of interviewColumns) {
                await new Promise((resolve) => {
                    initConnection.query(columnSql, () => resolve());
                });
            }

            // Self-healing columns for AI screening insights
            const aiColumns = [
                "ALTER TABLE applications ADD COLUMN skills_score INT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN experience_score INT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN education_score INT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN matched_skills TEXT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN missing_skills TEXT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN additional_skills TEXT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN candidate_strengths TEXT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN review_considerations TEXT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN ai_summary TEXT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN recommendation VARCHAR(255) DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN screening_status VARCHAR(50) DEFAULT 'PENDING'"
            ];

            for (const colSql of aiColumns) {
                await new Promise((resolve) => {
                    initConnection.query(colSql, () => resolve());
                });
            }

            // Self-healing columns for Interview feedback & scorecards
            const interviewCols = [
                "ALTER TABLE interviews ADD COLUMN round VARCHAR(100) DEFAULT 'Technical Interview'",
                "ALTER TABLE interviews ADD COLUMN duration INT DEFAULT 30",
                "ALTER TABLE interviews ADD COLUMN feedback TEXT DEFAULT NULL",
                "ALTER TABLE interviews ADD COLUMN rating INT DEFAULT NULL",
                "ALTER TABLE interviews ADD COLUMN meeting_link TEXT DEFAULT NULL"
            ];

            for (const colSql of interviewCols) {
                await new Promise((resolve) => {
                    initConnection.query(colSql, () => resolve());
                });
            }

            // Self-healing columns for Organization isolation
            const orgColMigrations = [
                "ALTER TABLE jobs ADD COLUMN organization_id INT DEFAULT NULL",
                "ALTER TABLE job_descriptions ADD COLUMN organization_id INT DEFAULT NULL",
                "ALTER TABLE applications ADD COLUMN organization_id INT DEFAULT NULL",
                "ALTER TABLE interviews ADD COLUMN organization_id INT DEFAULT NULL",
                "ALTER TABLE activities ADD COLUMN organization_id INT DEFAULT NULL",
                "ALTER TABLE communications ADD COLUMN organization_id INT DEFAULT NULL"
            ];

            for (const colSql of orgColMigrations) {
                await new Promise((resolve) => {
                    initConnection.query(colSql, () => resolve());
                });
            }

            // Self-healing columns for Organization Settings & Defaults
            const orgSettingCols = [
                "ALTER TABLE organizations ADD COLUMN logo_url TEXT DEFAULT NULL",
                "ALTER TABLE organizations ADD COLUMN industry VARCHAR(255) DEFAULT NULL",
                "ALTER TABLE organizations ADD COLUMN company_size VARCHAR(100) DEFAULT NULL",
                "ALTER TABLE organizations ADD COLUMN website VARCHAR(255) DEFAULT NULL",
                "ALTER TABLE organizations ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC'",
                "ALTER TABLE organizations ADD COLUMN locale VARCHAR(50) DEFAULT 'en-US'",
                "ALTER TABLE organizations ADD COLUMN default_pipeline VARCHAR(100) DEFAULT 'Standard'",
                "ALTER TABLE organizations ADD COLUMN default_interview_duration INT DEFAULT 30",
                "ALTER TABLE organizations ADD COLUMN default_interview_type VARCHAR(100) DEFAULT 'Video'",
                "ALTER TABLE organizations ADD COLUMN default_application_stage VARCHAR(100) DEFAULT 'Applied'",
                "ALTER TABLE organizations ADD COLUMN default_analytics_range VARCHAR(50) DEFAULT '30_days'"
            ];

            for (const colSql of orgSettingCols) {
                await new Promise((resolve) => {
                    initConnection.query(colSql, () => resolve());
                });
            }

            // Self-healing columns for User Settings & Preferences
            const userPreferenceCols = [
                "ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL",
                "ALTER TABLE users ADD COLUMN job_title VARCHAR(100) DEFAULT NULL",
                "ALTER TABLE users ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC'",
                "ALTER TABLE users ADD COLUMN locale VARCHAR(50) DEFAULT 'en-US'",
                "ALTER TABLE users ADD COLUMN default_landing_page VARCHAR(100) DEFAULT '/dashboard'",
                "ALTER TABLE users ADD COLUMN default_analytics_range VARCHAR(50) DEFAULT '30_days'",
                "ALTER TABLE users ADD COLUMN default_candidate_view VARCHAR(50) DEFAULT 'list'",
                "ALTER TABLE users ADD COLUMN default_pipeline_view VARCHAR(50) DEFAULT 'kanban'",
                "ALTER TABLE users ADD COLUMN theme VARCHAR(20) DEFAULT 'light'"
            ];

            for (const colSql of userPreferenceCols) {
                await new Promise((resolve) => {
                    initConnection.query(colSql, () => resolve());
                });
            }

            // Self-healing database indexing
            const addIndexIfNotExists = (tableName, indexName, columnsSql) => {
                return new Promise((resolve) => {
                    const checkSql = `
                        SELECT COUNT(*) AS count 
                        FROM INFORMATION_SCHEMA.STATISTICS 
                        WHERE TABLE_SCHEMA = DATABASE() 
                          AND TABLE_NAME = ? 
                          AND INDEX_NAME = ?
                    `;
                    initConnection.query(checkSql, [tableName, indexName], (err, rows) => {
                        if (!err && rows && rows[0].count === 0) {
                            initConnection.query(`CREATE INDEX \`${indexName}\` ON \`${tableName}\` (${columnsSql})`, (createErr) => {
                                if (createErr) console.error(`Failed to create index ${indexName} on ${tableName}:`, createErr.message);
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    });
                });
            };

            await addIndexIfNotExists("applications", "idx_applications_org_email_status", "`organization_id`, `email`, `status`");
            await addIndexIfNotExists("interviews", "idx_interviews_org_cand_email_status", "`organization_id`, `candidate_id`, `email`, `status`");
            await addIndexIfNotExists("job_descriptions", "idx_job_desc_org", "`organization_id`");
            await addIndexIfNotExists("jobs", "idx_jobs_org", "`organization_id`");

            // Seed default demo organization
            await new Promise((resolve) => {
                initConnection.query(
                    "INSERT IGNORE INTO organizations (id, name, slug, status) VALUES (1, 'Demo Org', 'demo-org', 'ACTIVE')",
                    () => resolve()
                );
            });

            // Seed default demo users and their organization memberships if users table is empty
            if (shouldSeedDemo) {
                initConnection.query("SELECT COUNT(*) as count FROM users", async (err, results) => {
                    if (!err && results && results[0].count === 0) {
                        console.log("Seeding default demo users...");
                        const demoUsers = [
                            { name: "Admin User", email: "admin@gmail.com", password: "admin123", role: "Admin", orgRole: "Admin" },
                            { name: "HR Manager", email: "hr@gmail.com", password: "123456", role: "HR", orgRole: "Recruiter" },
                            { name: "Candidate User", email: "candidate@gmail.com", password: "123456", role: "Candidate", orgRole: null }
                        ];

                        for (const user of demoUsers) {
                            const hashedPassword = await bcrypt.hash(user.password, 10);
                            initConnection.query(
                                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                                [user.name, user.email, hashedPassword, user.role],
                                (insErr, insRes) => {
                                    if (!insErr && insRes && user.orgRole) {
                                        const userId = insRes.insertId;
                                        initConnection.query(
                                            "INSERT IGNORE INTO memberships (user_id, organization_id, role, status) VALUES (?, 1, ?, 'ACTIVE')",
                                            [userId, user.orgRole]
                                        );
                                    }
                                }
                            );
                        }
                    } else {
                        // Backfill memberships for existing database users if they do not have them
                        initConnection.query("SELECT id, email, role FROM users", (err, usersList) => {
                            if (!err && usersList) {
                                for (const u of usersList) {
                                    let orgRole = null;
                                    if (u.email === "admin@gmail.com") orgRole = "Admin";
                                    else if (u.email === "hr@gmail.com") orgRole = "Recruiter";
                                    else if (u.role === "Admin") orgRole = "Admin";
                                    else if (u.role === "HR") orgRole = "Recruiter";

                                    if (orgRole) {
                                        initConnection.query(
                                            "INSERT IGNORE INTO memberships (user_id, organization_id, role, status) VALUES (?, 1, ?, 'ACTIVE')",
                                            [u.id, orgRole]
                                        );
                                    }
                                }
                            }
                        });
                    }
                });
            } else {
                initConnection.query("SELECT id, email, role FROM users", (err, usersList) => {
                    if (!err && usersList) {
                        for (const u of usersList) {
                            let orgRole = null;
                            if (u.email === "admin@gmail.com") orgRole = "Admin";
                            else if (u.email === "hr@gmail.com") orgRole = "Recruiter";
                            else if (u.role === "Admin") orgRole = "Admin";
                            else if (u.role === "HR") orgRole = "Recruiter";

                            if (orgRole) {
                                initConnection.query(
                                    "INSERT IGNORE INTO memberships (user_id, organization_id, role, status) VALUES (?, 1, ?, 'ACTIVE')",
                                    [u.id, orgRole]
                                );
                            }
                        }
                    }
                });
            }

            // Seeding default demo job descriptions and candidate applications if empty
            if (shouldSeedDemo) {
                initConnection.query("SELECT COUNT(*) as count FROM job_descriptions", async (jdErr, jdCountRes) => {
                    if (!jdErr && jdCountRes && jdCountRes[0].count === 0) {
                        console.log("Seeding default demo job descriptions, candidates, applications, interviews, activities, notifications, and comments...");
                        const jds = [
                            [1, "Senior Full-Stack Engineer", "React, Node.js, SQL", "5+ years", "$120,000 - $150,000", "Remote / Hybrid", "Join our core platform engineering team to build scalable full-stack web applications. You will collaborate on architectural design, implement modular APIs, and maintain high code quality standards.", "hr@gmail.com", "Active", 1],
                            [2, "Machine Learning Scientist", "Python, PyTorch, Transformers", "3+ years", "$140,000 - $180,000", "San Francisco, CA (Onsite)", "Design and train deep learning models for NLP and information retrieval systems. Work directly with product groups to deploy advanced transformer models to production.", "hr@gmail.com", "Active", 1]
                        ];
                        for (const jd of jds) {
                            await new Promise((resolve) => {
                                initConnection.query(
                                    `INSERT INTO job_descriptions 
                                    (jd_id, title, skills, experience, salary, location, description, created_by, status, organization_id) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    jd,
                                    () => resolve()
                                );
                            });
                        }

                        // 2. Seed Candidates
                        const candidates = [
                            [1, "John Smith", "john.smith@example.com", "john_smith_resume.pdf"],
                            [2, "Sarah Connor", "sarah.connor@example.com", "sarah_connor_resume.pdf"],
                            [3, "David Miller", "david.miller@example.com", "david_miller_resume.pdf"]
                        ];
                        for (const c of candidates) {
                            await new Promise((resolve) => {
                                initConnection.query(
                                    "INSERT INTO candidates (id, name, email, resume) VALUES (?, ?, ?, ?)",
                                    c,
                                    () => resolve()
                                );
                            });
                        }

                        // 3. Seed Applications with structured AI Screen details
                        const apps = [
                            [1, "John Smith", "john.smith@example.com", "555-0100", 1, "john_smith_resume.pdf", "Shortlisted", 85, 90, 80, 85, "React, Node.js, SQL", "AWS", "Docker, CSS", "Excellent full stack engineer candidate.", "Ask about database pool connection pool scaling.", "Strong technical candidate with SQL tuning experience.", "Strong Fit", 1],
                            [2, "Sarah Connor", "sarah.connor@example.com", "555-0199", 2, "sarah_connor_resume.pdf", "Interview", 92, 95, 90, 90, "Python, PyTorch, Transformers", "Docker", "Git, LaTeX", "Excellent deep learning experience and publications.", "Inquire about transformers fine-tuning.", "Top-tier candidate for the research division.", "Top Tier", 1],
                            [3, "David Miller", "david.miller@example.com", "555-0122", 1, "david_miller_resume.pdf", "Pending", 45, 50, 40, 45, "React", "Node.js, SQL", "HTML, CSS, JavaScript", "Clean interface design principles.", "Lacks backend microservices database architecture.", "Weak full-stack experience.", "Weak Fit", 1]
                        ];
                        for (const app of apps) {
                            await new Promise((resolve) => {
                                initConnection.query(
                                    `INSERT INTO applications 
                                    (id, candidate_name, email, phone, job_id, resume_file, status, match_score, skills_score, experience_score, education_score, matched_skills, missing_skills, additional_skills, candidate_strengths, review_considerations, ai_summary, recommendation, organization_id) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    app,
                                    () => resolve()
                                );
                            });
                        }

                        // 4. Seed Interviews
                        const interviews = [
                            [2, "Sarah Connor", "sarah.connor@example.com", "555-0199", 92, "2026-07-15", "10:00 AM", "Video", "HR Manager", "Scheduled", "Technical Interview", 45, "https://meet.google.com/abc-defg-hij", 1]
                        ];
                        for (const iv of interviews) {
                            await new Promise((resolve) => {
                                initConnection.query(
                                    `INSERT INTO interviews 
                                    (candidate_id, candidate_name, email, phone, ai_score, interview_date, interview_time, mode, interviewer, status, round, duration, meeting_link, organization_id) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    iv,
                                    () => resolve()
                                );
                            });
                        }

                        // 5. Seed Activities
                        const activities = [
                            [1, "John Smith", "STAGE_CHANGE", "Candidate moved from Applied to Shortlisted.", 1],
                            [2, "Sarah Connor", "STAGE_CHANGE", "Candidate moved from Applied to Interview.", 1],
                            [3, "David Miller", "APPLICATION_SUBMITTED", "Applied to Senior Full-Stack Engineer.", 1]
                        ];
                        for (const act of activities) {
                            await new Promise((resolve) => {
                                initConnection.query(
                                    "INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (?, ?, ?, ?, ?)",
                                    act,
                                    () => resolve()
                                );
                            });
                        }

                        // 6. Seed Notifications
                        const notifications = [
                            ["hr@gmail.com", "INTERVIEW_SCHEDULED", "HIGH", "Interview Scheduled", "Technical Interview for Sarah Connor with HR Manager on 2026-07-15 10:00 AM"],
                            ["hr@gmail.com", "CANDIDATE_APPLIED", "NORMAL", "New Candidate Application", "David Miller applied for Senior Full-Stack Engineer Requisition."]
                        ];
                        for (const n of notifications) {
                            await new Promise((resolve) => {
                                initConnection.query(
                                    "INSERT INTO notifications (user_email, type, priority, title, message) VALUES (?, ?, ?, ?, ?)",
                                    n,
                                    () => resolve()
                                );
                            });
                        }

                        // 7. Seed Comments
                        const comments = [
                            [1, "application", 1, 2, "John Smith has excellent client-side skills and a robust full-stack project portfolio. Recommended for final panel rounds."]
                        ];
                        for (const comment of comments) {
                            await new Promise((resolve) => {
                                initConnection.query(
                                    "INSERT INTO comments (organization_id, resource_type, resource_id, author_id, content) VALUES (?, ?, ?, ?, ?)",
                                    comment,
                                    () => resolve()
                                );
                            });
                        }
                    }
                });
            }

            // Backfill organization_id for existing resource rows
            const tablesToBackfill = ["jobs", "job_descriptions", "applications", "interviews", "activities", "communications"];
            for (const table of tablesToBackfill) {
                await new Promise((resolve) => {
                    initConnection.query(`UPDATE ${table} SET organization_id = 1 WHERE organization_id IS NULL`, () => resolve());
                });
            }

            console.log("Database and tables initialized successfully.");
            initConnection.end();
            resolveInit();
        } catch (setupErr) {
            console.error("FATAL ERROR: Database schema setup failed:", setupErr.message);
            if (isProduction) {
                process.exit(1);
            }
            resolveInit();
        }
    };

    if (isProduction) {
        console.log("Production database configuration detected. Connecting directly to remote MySQL database...");
        runSchemaSetup();
    } else {
        const dbName = databaseName;
        initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
            if (err) {
                console.warn("Warning: Failed to create database (might already exist or lack privileges):", err.message);
            }

            initConnection.query(`USE \`${dbName}\``, (err) => {
                if (err) {
                    console.error("Failed to select database:", err.message);
                    initConnection.end();
                    resolveInit();
                    return;
                }
                runSchemaSetup();
            });
        });
    }
});

// Create and export the pool configured with the database
let pool;
const poolConnectionLimit = process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 5;
if (connectionUrl) {
    try {
        const parsedUrl = new URL(connectionUrl);
        pool = mysql.createPool({
            host: parsedUrl.hostname,
            user: decodeURIComponent(parsedUrl.username),
            password: decodeURIComponent(parsedUrl.password),
            port: parsedUrl.port ? parseInt(parsedUrl.port) : 3306,
            database: databaseName,
            ...sslOptions,
            waitForConnections: true,
            connectionLimit: poolConnectionLimit,
            queueLimit: 0
        });
    } catch (e) {
        pool = mysql.createPool(connectionUrl);
    }
} else {
    pool = mysql.createPool({
        ...dbConfig,
        ...(process.env.DB_SOCKET_PATH ? { socketPath: process.env.DB_SOCKET_PATH } : {}),
        ...sslOptions,
        database: databaseName,
        waitForConnections: true,
        connectionLimit: poolConnectionLimit,
        queueLimit: 0
    });
}

if (connectionUrl) {
    console.log("Database connected via DATABASE_URL/MYSQL_URL connection string");
} else {
    if (process.env.DB_SOCKET_PATH) {
        console.log("SOCKET PATH:", process.env.DB_SOCKET_PATH);
    } else {
        console.log("HOST:", dbConfig.host);
    }
    console.log("USER:", dbConfig.user);
    console.log("DATABASE:", databaseName);
}

pool.initPromise = initPromise;
module.exports = pool;