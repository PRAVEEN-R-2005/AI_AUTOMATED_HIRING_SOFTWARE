const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { logAuditEvent } = require("../utils/auditLogger");

// GET /api/settings/profile — Get current user profile and preferences
const getProfile = (req, res) => {
    const email = req.user.email;
    const sql = `
        SELECT id, name, email, role, phone, job_title, timezone, locale, 
               default_landing_page, default_analytics_range, default_candidate_view, default_pipeline_view, theme, created_at 
        FROM users 
        WHERE email = ?
    `;
    db.query(sql, [email], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(rows[0]);
    });
};

// PUT /api/settings/profile — Update user name, profile and preferences
const updateProfile = (req, res) => {
    const email = req.user.email;
    const { 
        name, 
        phone, 
        job_title, 
        timezone, 
        locale, 
        default_landing_page, 
        default_analytics_range, 
        default_candidate_view, 
        default_pipeline_view, 
        theme 
    } = req.body;

    // Backend Validation
    if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
    }
    if (name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({ message: "Name must be between 2 and 100 characters" });
    }

    if (phone && phone.trim().length > 20) {
        return res.status(400).json({ message: "Phone number cannot exceed 20 characters" });
    }

    // Default view routes validation
    const allowedLandingPages = ["/dashboard", "/jobs", "/applications", "/candidates", "/interviews", "/analytics", "/team", "/settings", "/student-dashboard", "/available-jobs", "/my-applications"];
    if (default_landing_page && !allowedLandingPages.includes(default_landing_page)) {
        return res.status(400).json({ message: "Invalid default landing page route" });
    }

    const allowedRanges = ["7_days", "30_days", "90_days"];
    if (default_analytics_range && !allowedRanges.includes(default_analytics_range)) {
        return res.status(400).json({ message: "Invalid default analytics date range" });
    }

    if (theme && theme !== "light" && theme !== "dark") {
        return res.status(400).json({ message: "Theme must be either light or dark" });
    }

    const sql = `
        UPDATE users 
        SET name = ?, phone = ?, job_title = ?, timezone = ?, locale = ?, 
            default_landing_page = ?, default_analytics_range = ?, default_candidate_view = ?, default_pipeline_view = ?, theme = ? 
        WHERE email = ?
    `;

    const params = [
        name.trim(),
        phone ? phone.trim() : null,
        job_title ? job_title.trim() : null,
        timezone || 'UTC',
        locale || 'en-US',
        default_landing_page || '/dashboard',
        default_analytics_range || '30_days',
        default_candidate_view || 'list',
        default_pipeline_view || 'kanban',
        theme || 'light',
        email
    ];

    db.query(sql, params, (err) => {
        if (err) {
            console.error("Error updating user profile:", err);
            return res.status(500).json({ message: "Database Error" });
        }

        // Log audit event
        logAuditEvent({
            req,
            eventCategory: "SETTINGS",
            action: "USER_PROFILE_UPDATED",
            resourceType: "USER",
            resourceId: req.user.id,
            metadata: { name: name.trim(), email }
        });

        res.status(200).json({ message: "Profile settings updated successfully" });
    });
};

// PUT /api/settings/change-password
const changePassword = (req, res) => {
    const email = req.user.email;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    db.query("SELECT id, password FROM users WHERE email = ?", [email], async (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) {
            // Log security failure
            logAuditEvent({
                req,
                eventCategory: "SECURITY",
                action: "PASSWORD_CHANGE_FAILED",
                resourceType: "USER",
                resourceId: rows[0].id,
                result: "FAILURE",
                metadata: { reason: "Incorrect current password" }
            });
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email], (updateErr) => {
            if (updateErr) return res.status(500).json({ message: "Database Error" });

            // Log security success
            logAuditEvent({
                req,
                eventCategory: "SECURITY",
                action: "PASSWORD_CHANGED",
                resourceType: "USER",
                resourceId: rows[0].id,
                result: "SUCCESS"
            });

            res.status(200).json({ message: "Password changed successfully" });
        });
    });
};

// GET /api/settings/organization — Get organization settings (defaults, industry, size)
const getOrganization = (req, res) => {
    const orgId = req.user.organization_id;
    if (!orgId) {
        return res.status(400).json({ message: "User does not belong to an active organization workspace" });
    }

    const sql = `
        SELECT id, name, slug, status, logo_url, industry, company_size, website, timezone, locale, 
               default_pipeline, default_interview_duration, default_interview_type, default_application_stage, default_analytics_range, created_at 
        FROM organizations 
        WHERE id = ?
    `;

    db.query(sql, [orgId], (err, rows) => {
        if (err) {
            console.error("Error fetching organization settings:", err);
            return res.status(500).json({ message: "Database Error" });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Organization workspace not found" });
        }
        res.status(200).json(rows[0]);
    });
};

// PUT /api/settings/organization — Admin: Update organization setting and defaults
const updateOrganization = (req, res) => {
    const orgId = req.user.organization_id;
    if (!orgId) {
        return res.status(400).json({ message: "User does not belong to an active organization workspace" });
    }

    const {
        name,
        slug,
        logo_url,
        industry,
        company_size,
        website,
        timezone,
        locale,
        default_pipeline,
        default_interview_duration,
        default_interview_type,
        default_application_stage,
        default_analytics_range
    } = req.body;

    // Backend validation
    if (!name || !name.trim()) {
        return res.status(400).json({ message: "Organization name is required" });
    }
    if (!slug || !slug.trim()) {
        return res.status(400).json({ message: "Organization slug is required" });
    }

    const slugRegex = /^[a-z0-9-]+$/;
    const cleanSlug = slug.trim().toLowerCase();
    if (!slugRegex.test(cleanSlug)) {
        return res.status(400).json({ message: "Slug must contain only lowercase alphanumeric characters and hyphens" });
    }

    // Website regex check
    if (website && website.trim()) {
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
        if (!urlRegex.test(website.trim())) {
            return res.status(400).json({ message: "Invalid company website URL format" });
        }
    }

    // Validate slug uniqueness
    db.query("SELECT id FROM organizations WHERE slug = ? AND id != ?", [cleanSlug, orgId], (err, existing) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        if (existing && existing.length > 0) {
            return res.status(409).json({ message: "This workspace slug is already taken" });
        }

        const sql = `
            UPDATE organizations 
            SET name = ?, slug = ?, logo_url = ?, industry = ?, company_size = ?, website = ?, timezone = ?, locale = ?, 
                default_pipeline = ?, default_interview_duration = ?, default_interview_type = ?, default_application_stage = ?, default_analytics_range = ?
            WHERE id = ?
        `;

        const params = [
            name.trim(),
            cleanSlug,
            logo_url ? logo_url.trim() : null,
            industry ? industry.trim() : null,
            company_size ? company_size.trim() : null,
            website ? website.trim() : null,
            timezone || 'UTC',
            locale || 'en-US',
            default_pipeline || 'Standard',
            parseInt(default_interview_duration) || 30,
            default_interview_type || 'Video',
            default_application_stage || 'Applied',
            default_analytics_range || '30_days',
            orgId
        ];

        db.query(sql, params, (upErr) => {
            if (upErr) {
                console.error("Error updating organization:", upErr);
                return res.status(500).json({ message: "Database Error" });
            }

            // Log audit trails
            logAuditEvent({
                req,
                eventCategory: "ORGANIZATION",
                action: "ORGANIZATION_UPDATED",
                resourceType: "ORGANIZATION",
                resourceId: orgId,
                metadata: { name: name.trim(), slug: cleanSlug }
            });

            res.status(200).json({ message: "Organization settings updated successfully" });
        });
    });
};

// GET /api/settings/audit-logs — Admin: Query, filter, and paginate audit trail
const getAuditLogs = (req, res) => {
    const orgId = req.user.organization_id;
    if (!orgId) {
        return res.status(400).json({ message: "User does not belong to an active organization workspace" });
    }

    let {
        page = 1,
        limit = 10,
        search = "",
        category = "All",
        result = "All",
        startDate = "",
        endDate = ""
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE organization_id = ?";
    const params = [orgId];

    if (category && category !== "All") {
        whereClause += " AND event_category = ?";
        params.push(category);
    }

    if (result && result !== "All") {
        whereClause += " AND result = ?";
        params.push(result);
    }

    if (startDate && startDate.trim()) {
        whereClause += " AND created_at >= ?";
        params.push(startDate.trim());
    }

    if (endDate && endDate.trim()) {
        whereClause += " AND created_at <= ?";
        params.push(endDate.trim());
    }

    if (search && search.trim()) {
        whereClause += " AND (actor_name LIKE ? OR actor_email LIKE ? OR action LIKE ? OR resource_type LIKE ?)";
        const term = `%${search.trim()}%`;
        params.push(term, term, term, term);
    }

    const countSql = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
    db.query(countSql, params, (countErr, countRows) => {
        if (countErr) {
            console.error("Error counting audit logs:", countErr);
            return res.status(500).json({ message: "Database Error" });
        }

        const total = countRows[0]?.total || 0;

        let querySql = `
            SELECT id, actor_id, actor_name, actor_email, event_category, action, resource_type, resource_id, result, ip_address, user_agent, metadata, created_at 
            FROM audit_logs
            ${whereClause}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `;

        const queryParams = [...params, limit, offset];

        db.query(querySql, queryParams, (queryErr, rows) => {
            if (queryErr) {
                console.error("Error querying audit logs:", queryErr);
                return res.status(500).json({ message: "Database Error" });
            }

            // Parse metadata string into objects safely
            const sanitizedLogs = (rows || []).map(row => {
                let metadataObj = {};
                try {
                    if (row.metadata) {
                        metadataObj = JSON.parse(row.metadata);
                    }
                } catch {
                    metadataObj = { raw: row.metadata };
                }
                return { ...row, metadata: metadataObj };
            });

            res.status(200).json({
                logs: sanitizedLogs,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            });
        });
    });
};

// GET /api/settings/system-info — Admin: Get connectivity and configuration status
const getSystemInfo = (req, res) => {
    db.query("SELECT 1", (dbErr) => {
        const dbStatus = dbErr ? "DEGRADED" : "OPERATIONAL";
        const emailConfigured = process.env.SMTP_HOST || process.env.SENDGRID_API_KEY ? "CONFIGURED" : "NOT CONFIGURED (Mock Mode)";
        const aiConfigured = "OPERATIONAL (Local Rule-based NLP Engine)";
        const schedulerStatus = "OPERATIONAL (Internal CRON Scheduler active)";

        const systemMetrics = {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: Math.round(process.uptime()),
            memoryUsage: {
                rss: Math.round(process.memoryUsage().rss / (1024 * 1024)) + " MB",
                heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)) + " MB",
                heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)) + " MB"
            }
        };

        res.status(200).json({
            status: "OPERATIONAL",
            services: {
                database: { status: dbStatus, details: dbErr ? dbErr.message : "Connection active and pool responding" },
                ai_engine: { status: "OPERATIONAL", details: aiConfigured },
                email: { status: emailConfigured.includes("CONFIGURED") ? "OPERATIONAL" : "DEGRADED", details: emailConfigured },
                scheduler: { status: "OPERATIONAL", details: schedulerStatus },
                realtime: { status: "OPERATIONAL", details: "SSE Channels active" }
            },
            environment: {
                nodeEnv: process.env.NODE_ENV || "development",
                ...systemMetrics
            }
        });
    });
};

// ============================================
// ADMIN USER MANAGEMENT ENDPOINTS (LEGACY RESCUED)
// ============================================

// GET /api/settings/users — Admin: List all users
const listUsers = (req, res) => {
    db.query("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC", (err, rows) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        res.status(200).json(rows || []);
    });
};

// POST /api/settings/users/invite — Admin: Invite new HR user
const inviteUser = (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
    }
    const userRole = role || "HR";
    db.query("SELECT id FROM users WHERE email = ?", [email], async (err, existing) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        if (existing && existing.length > 0) {
            return res.status(409).json({ message: "A user with this email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, userRole],
            (insertErr, result) => {
                if (insertErr) return res.status(500).json({ message: "Database Error" });
                
                // Log team invite in audit log
                logAuditEvent({
                    req,
                    eventCategory: "TEAM",
                    action: "MEMBER_INVITED",
                    resourceType: "USER",
                    resourceId: result.insertId,
                    metadata: { invitedName: name, invitedEmail: email, role: userRole }
                });

                res.status(201).json({ message: "User invited successfully", userId: result.insertId });
            }
        );
    });
};

// DELETE /api/settings/users/:id — Admin: Delete user
const deleteUser = (req, res) => {
    const id = req.params.id;
    const adminEmail = req.user.email;
    db.query("SELECT email, name FROM users WHERE id = ?", [id], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const deletedUser = rows[0];
        if (deletedUser.email === adminEmail) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }
        db.query("DELETE FROM users WHERE id = ?", [id], (delErr) => {
            if (delErr) return res.status(500).json({ message: "Database Error" });

            // Log member delete in audit log
            logAuditEvent({
                req,
                eventCategory: "TEAM",
                action: "MEMBER_REMOVED",
                resourceType: "USER",
                resourceId: id,
                metadata: { email: deletedUser.email, name: deletedUser.name }
            });

            res.status(200).json({ message: "User deleted successfully" });
        });
    });
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getOrganization,
    updateOrganization,
    getAuditLogs,
    getSystemInfo,
    listUsers,
    inviteUser,
    deleteUser
};
