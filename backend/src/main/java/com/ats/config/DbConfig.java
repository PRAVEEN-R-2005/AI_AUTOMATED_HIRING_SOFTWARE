package com.ats.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;

@Configuration
public class DbConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.demo-mode:true}")
    private boolean demoMode;

    @PostConstruct
    public void initDatabase() {
        try {
            System.out.println("Initializing Database Schemas, Tables and Indices...");
            
            // 1. Create tables
            createTables();
            
            // 2. Self-healing column migrations
            runMigrations();
            
            // 3. Create indices
            createIndices();
            
            // 4. Seeding Demo Org and Users
            seedData();
            
            System.out.println("Database initialization completed successfully.");
        } catch (Exception e) {
            System.err.println("CRITICAL: Database schema setup failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createTables() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS users (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "name VARCHAR(255) NOT NULL," +
                "email VARCHAR(255) NOT NULL UNIQUE," +
                "password VARCHAR(255) NOT NULL," +
                "role VARCHAR(50) NOT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS jobs (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "title VARCHAR(255) NOT NULL," +
                "description TEXT," +
                "skills TEXT," +
                "experience VARCHAR(100)," +
                "salary VARCHAR(100)," +
                "location VARCHAR(255)," +
                "employment_type VARCHAR(100)," +
                "jd_file VARCHAR(255)," +
                "status VARCHAR(50) DEFAULT 'Pending'," +
                "published_by VARCHAR(50) DEFAULT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS job_descriptions (" +
                "jd_id INT AUTO_INCREMENT PRIMARY KEY," +
                "title VARCHAR(255) NOT NULL," +
                "skills TEXT," +
                "experience VARCHAR(100)," +
                "salary VARCHAR(100)," +
                "location VARCHAR(255)," +
                "description TEXT," +
                "created_by VARCHAR(255)," +
                "status VARCHAR(50) DEFAULT 'Pending'," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS applications (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "candidate_name VARCHAR(255) NOT NULL," +
                "email VARCHAR(255) NOT NULL," +
                "phone VARCHAR(50)," +
                "job_id INT," +
                "resume_file VARCHAR(255)," +
                "status VARCHAR(50) DEFAULT 'Pending'," +
                "match_score INT DEFAULT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS ai_candidates (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "name VARCHAR(255) NOT NULL," +
                "email VARCHAR(255) NOT NULL," +
                "phone VARCHAR(50)," +
                "skills TEXT," +
                "match_score INT," +
                "resume_file VARCHAR(255)," +
                "status VARCHAR(50) DEFAULT 'Pending'," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS interviews (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "candidate_id INT," +
                "application_id INT DEFAULT NULL," +
                "job_id INT DEFAULT NULL," +
                "candidate_name VARCHAR(255)," +
                "email VARCHAR(255)," +
                "phone VARCHAR(50)," +
                "ai_score INT," +
                "interview_date DATE," +
                "interview_time VARCHAR(50)," +
                "mode VARCHAR(100)," +
                "interviewer VARCHAR(255)," +
                "interviewer_id INT DEFAULT NULL," +
                "interviewer_name VARCHAR(255) DEFAULT NULL," +
                "round VARCHAR(100) DEFAULT 'Technical Interview'," +
                "duration INT DEFAULT 30," +
                "meeting_link VARCHAR(500) DEFAULT NULL," +
                "status VARCHAR(50) DEFAULT 'Scheduled'," +
                "organization_id INT DEFAULT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS candidates (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "name VARCHAR(255) NOT NULL," +
                "email VARCHAR(255) NOT NULL," +
                "resume VARCHAR(255)," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS activities (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "application_id INT DEFAULT NULL," +
                "candidate_name VARCHAR(255) DEFAULT NULL," +
                "action VARCHAR(255) DEFAULT NULL," +
                "details TEXT DEFAULT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS notifications (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "user_email VARCHAR(255) NOT NULL," +
                "type VARCHAR(100) NOT NULL," +
                "priority VARCHAR(50) DEFAULT 'NORMAL'," +
                "title VARCHAR(255) NOT NULL," +
                "message TEXT," +
                "is_read BOOLEAN DEFAULT FALSE," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS communications (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "candidate_id INT," +
                "candidate_name VARCHAR(255)," +
                "type VARCHAR(100) NOT NULL," +
                "subject VARCHAR(255)," +
                "message TEXT," +
                "delivery_status VARCHAR(50) DEFAULT 'SENT'," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS organizations (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "name VARCHAR(255) NOT NULL," +
                "slug VARCHAR(255) NOT NULL UNIQUE," +
                "status VARCHAR(50) DEFAULT 'ACTIVE'," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS memberships (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "user_id INT NOT NULL," +
                "organization_id INT NOT NULL," +
                "role VARCHAR(50) NOT NULL," +
                "status VARCHAR(50) DEFAULT 'ACTIVE'," +
                "joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE," +
                "FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE," +
                "UNIQUE KEY unique_user_org (user_id, organization_id)" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS invitations (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "organization_id INT NOT NULL," +
                "email VARCHAR(255) NOT NULL," +
                "role VARCHAR(50) NOT NULL," +
                "token_hash VARCHAR(255) NOT NULL UNIQUE," +
                "invited_by INT NOT NULL," +
                "status VARCHAR(50) DEFAULT 'PENDING'," +
                "expires_at TIMESTAMP NOT NULL," +
                "accepted_at TIMESTAMP NULL DEFAULT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                "FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE," +
                "FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS job_assignments (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "job_id INT NOT NULL," +
                "user_id INT NOT NULL," +
                "assigned_role VARCHAR(50) NOT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE," +
                "UNIQUE KEY unique_job_user (job_id, user_id)" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS comments (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "organization_id INT NOT NULL," +
                "resource_type VARCHAR(100) NOT NULL," +
                "resource_id INT NOT NULL," +
                "author_id INT NOT NULL," +
                "content TEXT NOT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                "FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE," +
                "FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS mentions (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "comment_id INT NOT NULL," +
                "user_id INT NOT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE," +
                "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                ")");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS audit_logs (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "organization_id INT DEFAULT NULL," +
                "actor_id INT DEFAULT NULL," +
                "actor_name VARCHAR(255) NOT NULL," +
                "actor_email VARCHAR(255) NOT NULL," +
                "event_category VARCHAR(100) NOT NULL," +
                "action VARCHAR(255) NOT NULL," +
                "resource_type VARCHAR(100) NOT NULL," +
                "resource_id INT DEFAULT NULL," +
                "result VARCHAR(50) NOT NULL," +
                "ip_address VARCHAR(45) DEFAULT NULL," +
                "user_agent VARCHAR(255) DEFAULT NULL," +
                "metadata TEXT DEFAULT NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL," +
                "FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL" +
                ")");
    }

    private void runMigrations() {
        // applications migrations
        addColumnIfNotExist("applications", "recruiter_notes", "TEXT DEFAULT NULL");
        addColumnIfNotExist("applications", "rejection_reason", "TEXT DEFAULT NULL");
        addColumnIfNotExist("applications", "skills_score", "INT DEFAULT NULL");
        addColumnIfNotExist("applications", "experience_score", "INT DEFAULT NULL");
        addColumnIfNotExist("applications", "education_score", "INT DEFAULT NULL");
        addColumnIfNotExist("applications", "matched_skills", "TEXT DEFAULT NULL");
        addColumnIfNotExist("applications", "missing_skills", "TEXT DEFAULT NULL");
        addColumnIfNotExist("applications", "additional_skills", "TEXT DEFAULT NULL");
        addColumnIfNotExist("applications", "candidate_strengths", "TEXT DEFAULT NULL");
        addColumnIfNotExist("applications", "review_considerations", "TEXT DEFAULT NULL");
        addColumnIfNotExist("applications", "ai_summary", "TEXT DEFAULT NULL");
        addColumnIfNotExist("applications", "recommendation", "VARCHAR(255) DEFAULT NULL");
        addColumnIfNotExist("applications", "screening_status", "VARCHAR(50) DEFAULT 'PENDING'");
        addColumnIfNotExist("applications", "organization_id", "INT DEFAULT NULL");

        // interviews migrations
        addColumnIfNotExist("interviews", "application_id", "INT DEFAULT NULL");
        addColumnIfNotExist("interviews", "job_id", "INT DEFAULT NULL");
        addColumnIfNotExist("interviews", "interviewer_id", "INT DEFAULT NULL");
        addColumnIfNotExist("interviews", "interviewer_name", "VARCHAR(255) DEFAULT NULL");
        addColumnIfNotExist("interviews", "round", "VARCHAR(100) DEFAULT 'Technical Interview'");
        addColumnIfNotExist("interviews", "duration", "INT DEFAULT 30");
        addColumnIfNotExist("interviews", "meeting_link", "TEXT DEFAULT NULL");
        addColumnIfNotExist("interviews", "organization_id", "INT DEFAULT NULL");
        addColumnIfNotExist("interviews", "feedback", "TEXT DEFAULT NULL");
        addColumnIfNotExist("interviews", "rating", "INT DEFAULT NULL");
        addColumnIfNotExist("interviews", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        modifyColumnType("interviews", "phone", "VARCHAR(50) DEFAULT NULL");
        modifyColumnType("interviews", "interviewer", "VARCHAR(255) DEFAULT NULL");
        modifyColumnType("interviews", "mode", "VARCHAR(100) DEFAULT NULL");

        // jobs migrations
        addColumnIfNotExist("jobs", "organization_id", "INT DEFAULT NULL");
        addColumnIfNotExist("jobs", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

        // users migrations
        addColumnIfNotExist("users", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

        // job_descriptions migrations
        addColumnIfNotExist("job_descriptions", "organization_id", "INT DEFAULT NULL");

        // activities migrations
        addColumnIfNotExist("activities", "organization_id", "INT DEFAULT NULL");

        // communications migrations
        addColumnIfNotExist("communications", "organization_id", "INT DEFAULT NULL");

        // organizations settings migrations
        addColumnIfNotExist("organizations", "logo_url", "TEXT DEFAULT NULL");
        addColumnIfNotExist("organizations", "industry", "VARCHAR(255) DEFAULT NULL");
        addColumnIfNotExist("organizations", "company_size", "VARCHAR(100) DEFAULT NULL");
        addColumnIfNotExist("organizations", "website", "VARCHAR(255) DEFAULT NULL");
        addColumnIfNotExist("organizations", "timezone", "VARCHAR(100) DEFAULT 'UTC'");
        addColumnIfNotExist("organizations", "locale", "VARCHAR(50) DEFAULT 'en-US'");
        addColumnIfNotExist("organizations", "default_pipeline", "VARCHAR(100) DEFAULT 'Standard'");
        addColumnIfNotExist("organizations", "default_interview_duration", "INT DEFAULT 30");
        addColumnIfNotExist("organizations", "default_interview_type", "VARCHAR(100) DEFAULT 'Video'");
        addColumnIfNotExist("organizations", "default_application_stage", "VARCHAR(100) DEFAULT 'Applied'");
        addColumnIfNotExist("organizations", "default_analytics_range", "VARCHAR(50) DEFAULT '30_days'");

        // users settings migrations
        addColumnIfNotExist("users", "phone", "VARCHAR(50) DEFAULT NULL");
        addColumnIfNotExist("users", "job_title", "VARCHAR(100) DEFAULT NULL");
        addColumnIfNotExist("users", "timezone", "VARCHAR(100) DEFAULT 'UTC'");
        addColumnIfNotExist("users", "locale", "VARCHAR(50) DEFAULT 'en-US'");
        addColumnIfNotExist("users", "default_landing_page", "VARCHAR(100) DEFAULT '/dashboard'");
        addColumnIfNotExist("users", "default_analytics_range", "VARCHAR(50) DEFAULT '30_days'");
        addColumnIfNotExist("users", "default_candidate_view", "VARCHAR(50) DEFAULT 'list'");
        addColumnIfNotExist("users", "default_pipeline_view", "VARCHAR(50) DEFAULT 'kanban'");
        addColumnIfNotExist("users", "theme", "VARCHAR(20) DEFAULT 'light'");
    }

    private void createIndices() {
        addIndexIfNotExist("applications", "idx_applications_org_email_status", "organization_id, email, status");
        addIndexIfNotExist("interviews", "idx_interviews_org_cand_email_status", "organization_id, candidate_id, email, status");
        addIndexIfNotExist("job_descriptions", "idx_job_desc_org", "organization_id");
        addIndexIfNotExist("jobs", "idx_jobs_org", "organization_id");
        addIndexIfNotExist("comments", "idx_comments_org_res", "organization_id, resource_type, resource_id");
        addIndexIfNotExist("activities", "idx_activities_org", "organization_id");
        addIndexIfNotExist("notifications", "idx_notifications_email", "user_email");
        addIndexIfNotExist("communications", "idx_communications_org", "organization_id");
    }

    private void seedData() {
        // Seed default demo organization
        jdbcTemplate.execute("INSERT IGNORE INTO organizations (id, name, slug, status) VALUES (1, 'Demo Org', 'demo-org', 'ACTIVE')");

        if (demoMode) {
            Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            if (userCount != null && userCount == 0) {
                System.out.println("Seeding default demo users...");
                
                Object[][] users = {
                    {"Admin User", "admin@gmail.com", passwordEncoder.encode("admin123"), "Admin", "Admin"},
                    {"HR Manager", "hr@gmail.com", passwordEncoder.encode("123456"), "HR", "Recruiter"},
                    {"Candidate User", "candidate@gmail.com", passwordEncoder.encode("123456"), "Candidate", null}
                };

                for (Object[] user : users) {
                    jdbcTemplate.update("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                            user[0], user[1], user[2], user[3]);
                    
                    if (user[4] != null) {
                        Integer userId = jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ?", Integer.class, user[1]);
                        jdbcTemplate.update("INSERT IGNORE INTO memberships (user_id, organization_id, role, status) VALUES (?, 1, ?, 'ACTIVE')",
                                userId, user[4]);
                    }
                }
            } else {
                // Backfill memberships
                List<Map<String, Object>> users = jdbcTemplate.queryForList("SELECT id, email, role FROM users");
                for (Map<String, Object> u : users) {
                    Integer id = (Integer) u.get("id");
                    String email = (String) u.get("email");
                    String role = (String) u.get("role");
                    String orgRole = null;
                    if ("admin@gmail.com".equals(email)) orgRole = "Admin";
                    else if ("hr@gmail.com".equals(email)) orgRole = "Recruiter";
                    else if ("Admin".equals(role)) orgRole = "Admin";
                    else if ("HR".equals(role)) orgRole = "Recruiter";

                    if (orgRole != null) {
                        jdbcTemplate.update("INSERT IGNORE INTO memberships (user_id, organization_id, role, status) VALUES (?, 1, ?, 'ACTIVE')",
                                id, orgRole);
                    }
                }
            }

            Integer jdCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM job_descriptions", Integer.class);
            if (jdCount != null && jdCount == 0) {
                System.out.println("Seeding default demo jobs, applications, interviews and metadata...");

                jdbcTemplate.update("INSERT INTO job_descriptions (jd_id, title, skills, experience, salary, location, description, created_by, status, organization_id) VALUES " +
                        "(1, 'Senior Full-Stack Engineer', 'React, Node.js, SQL', '5+ years', '$120,000 - $150,000', 'Remote / Hybrid', 'Join our core platform engineering team to build scalable full-stack web applications. You will collaborate on architectural design, implement modular APIs, and maintain high code quality standards.', 'hr@gmail.com', 'Active', 1)");
                
                jdbcTemplate.update("INSERT INTO job_descriptions (jd_id, title, skills, experience, salary, location, description, created_by, status, organization_id) VALUES " +
                        "(2, 'Machine Learning Scientist', 'Python, PyTorch, Transformers', '3+ years', '$140,000 - $180,000', 'San Francisco, CA (Onsite)', 'Design and train deep learning models for NLP and information retrieval systems. Work directly with product groups to deploy advanced transformer models to production.', 'hr@gmail.com', 'Active', 1)");

                jdbcTemplate.update("INSERT INTO candidates (id, name, email, resume) VALUES (1, 'John Smith', 'john.smith@example.com', 'john_smith_resume.pdf')");
                jdbcTemplate.update("INSERT INTO candidates (id, name, email, resume) VALUES (2, 'Sarah Connor', 'sarah.connor@example.com', 'sarah_connor_resume.pdf')");
                jdbcTemplate.update("INSERT INTO candidates (id, name, email, resume) VALUES (3, 'David Miller', 'david.miller@example.com', 'david_miller_resume.pdf')");

                jdbcTemplate.update("INSERT INTO applications (id, candidate_name, email, phone, job_id, resume_file, status, match_score, skills_score, experience_score, education_score, matched_skills, missing_skills, additional_skills, candidate_strengths, review_considerations, ai_summary, recommendation, organization_id) VALUES " +
                        "(1, 'John Smith', 'john.smith@example.com', '555-0100', 1, 'john_smith_resume.pdf', 'Shortlisted', 85, 90, 80, 85, 'React, Node.js, SQL', 'AWS', 'Docker, CSS', 'Excellent full stack engineer candidate.', 'Ask about database pool connection pool scaling.', 'Strong technical candidate with SQL tuning experience.', 'Strong Fit', 1)");
                
                jdbcTemplate.update("INSERT INTO applications (id, candidate_name, email, phone, job_id, resume_file, status, match_score, skills_score, experience_score, education_score, matched_skills, missing_skills, additional_skills, candidate_strengths, review_considerations, ai_summary, recommendation, organization_id) VALUES " +
                        "(2, 'Sarah Connor', 'sarah.connor@example.com', '555-0199', 2, 'sarah_connor_resume.pdf', 'Interview', 92, 95, 90, 90, 'Python, PyTorch, Transformers', 'Docker', 'Git, LaTeX', 'Excellent deep learning experience and publications.', 'Inquire about transformers fine-tuning.', 'Top-tier candidate for the research division.', 'Top Tier', 1)");
                
                jdbcTemplate.update("INSERT INTO applications (id, candidate_name, email, phone, job_id, resume_file, status, match_score, skills_score, experience_score, education_score, matched_skills, missing_skills, additional_skills, candidate_strengths, review_considerations, ai_summary, recommendation, organization_id) VALUES " +
                        "(3, 'David Miller', 'david.miller@example.com', '555-0122', 1, 'david_miller_resume.pdf', 'Pending', 45, 50, 40, 45, 'React', 'Node.js, SQL', 'HTML, CSS, JavaScript', 'Clean interface design principles.', 'Lacks backend microservices database architecture.', 'Weak full-stack experience.', 'Weak Fit', 1)");

                jdbcTemplate.update("INSERT INTO interviews (candidate_id, candidate_name, email, phone, ai_score, interview_date, interview_time, mode, interviewer, status, round, duration, meeting_link, organization_id) VALUES " +
                        "(2, 'Sarah Connor', 'sarah.connor@example.com', '555-0199', 92, '2026-07-15', '10:00 AM', 'Video', 'HR Manager', 'Scheduled', 'Technical Interview', 45, 'https://meet.google.com/abc-defg-hij', 1)");

                jdbcTemplate.update("INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (1, 'John Smith', 'STAGE_CHANGE', 'Candidate moved from Applied to Shortlisted.', 1)");
                jdbcTemplate.update("INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (2, 'Sarah Connor', 'STAGE_CHANGE', 'Candidate moved from Applied to Interview.', 1)");
                jdbcTemplate.update("INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (3, 'David Miller', 'APPLICATION_SUBMITTED', 'Applied to Senior Full-Stack Engineer.', 1)");

                jdbcTemplate.update("INSERT INTO notifications (user_email, type, priority, title, message) VALUES ('hr@gmail.com', 'INTERVIEW_SCHEDULED', 'HIGH', 'Interview Scheduled', 'Technical Interview for Sarah Connor with HR Manager on 2026-07-15 10:00 AM')");
                jdbcTemplate.update("INSERT INTO notifications (user_email, type, priority, title, message) VALUES ('hr@gmail.com', 'CANDIDATE_APPLIED', 'NORMAL', 'New Candidate Application', 'David Miller applied for Senior Full-Stack Engineer Requisition.')");

                jdbcTemplate.update("INSERT INTO comments (organization_id, resource_type, resource_id, author_id, content) VALUES (1, 'application', 1, 2, 'John Smith has excellent client-side skills and a robust full-stack portfolio. Recommended for final panel.')");
            }
        }

        // Backfill organization_id
        String[] tables = {"jobs", "job_descriptions", "applications", "interviews", "activities", "communications"};
        for (String table : tables) {
            jdbcTemplate.update("UPDATE " + table + " SET organization_id = 1 WHERE organization_id IS NULL");
        }
    }

    private void addColumnIfNotExist(String tableName, String columnName, String columnDef) {
        String sql = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, tableName, columnName);
        if (count != null && count == 0) {
            try {
                jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDef);
                System.out.println("Migrated: Added column " + columnName + " to table " + tableName);
            } catch (Exception e) {
                System.err.println("Warning adding column " + columnName + " to " + tableName + ": " + e.getMessage());
            }
        }
    }

    private void modifyColumnType(String tableName, String columnName, String columnDef) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY COLUMN " + columnName + " " + columnDef);
        } catch (Exception e) {
            System.err.println("Warning modifying column " + columnName + " in " + tableName + ": " + e.getMessage());
        }
    }

    private void addIndexIfNotExist(String tableName, String indexName, String columns) {
        String sql = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, tableName, indexName);
        if (count != null && count == 0) {
            try {
                jdbcTemplate.execute("CREATE INDEX " + indexName + " ON " + tableName + " (" + columns + ")");
                System.out.println("Migrated: Created index " + indexName + " on table " + tableName);
            } catch (Exception e) {
                System.err.println("Warning creating index " + indexName + " on " + tableName + ": " + e.getMessage());
            }
        }
    }
}
