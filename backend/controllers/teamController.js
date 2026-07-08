const db = require("../config/db");
const crypto = require("crypto");
const { logAuditEvent } = require("../utils/auditLogger");

// Helper to hash tokens
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

// GET /api/team/members — List organization members
const getMembers = (req, res) => {
    const orgId = req.user.organization_id;
    const { search, role, status } = req.query;

    let sql = `
        SELECT m.id as membership_id, u.id as user_id, u.name, u.email, m.role, m.status, m.joined_at
        FROM memberships m
        INNER JOIN users u ON m.user_id = u.id
        WHERE m.organization_id = ?
    `;
    const params = [orgId];

    if (search && search.trim()) {
        sql += " AND (u.name LIKE ? OR u.email LIKE ?)";
        const term = `%${search.trim()}%`;
        params.push(term, term);
    }

    if (role && role !== "All") {
        sql += " AND m.role = ?";
        params.push(role);
    }

    if (status && status !== "All") {
        sql += " AND m.status = ?";
        params.push(status);
    }

    sql += " ORDER BY m.id DESC";

    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error("Error fetching team members:", err);
            return res.status(500).json({ message: "Database Error" });
        }
        res.status(200).json(rows || []);
    });
};

// PUT /api/team/members/:id/role — Update team member role
const updateMemberRole = (req, res) => {
    const orgId = req.user.organization_id;
    const membershipId = req.params.id;
    const { role } = req.body;

    const allowedRoles = ["Admin", "Recruiter", "Hiring Manager", "Interviewer"];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }

    // Protect the last admin
    db.query("SELECT user_id, role, organization_id FROM memberships WHERE id = ?", [membershipId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "Membership not found" });
        }

        const member = rows[0];
        if (member.organization_id !== orgId) {
            return res.status(403).json({ message: "Access Denied: Cross-organization modification blocked" });
        }

        if (member.role === "Admin" && role !== "Admin") {
            // Check if this is the last Admin in the organization
            const countSql = "SELECT COUNT(*) as count FROM memberships WHERE organization_id = ? AND role = 'Admin' AND status = 'ACTIVE'";
            db.query(countSql, [orgId], (countErr, countRows) => {
                if (!countErr && countRows[0].count <= 1) {
                    return res.status(400).json({ message: "Access Denied: Cannot change the role of the last active Admin" });
                }
                
                // Update
                db.query("UPDATE memberships SET role = ? WHERE id = ?", [role, membershipId], (upErr) => {
                    if (upErr) return res.status(500).json({ message: "Database Error" });
                    
                    logAuditEvent({
                        req,
                        eventCategory: "TEAM",
                        action: "MEMBER_ROLE_CHANGED",
                        resourceType: "USER",
                        resourceId: member.user_id,
                        metadata: { memberUserId: member.user_id, oldRole: member.role, newRole: role }
                    });

                    res.status(200).json({ message: "Role updated successfully" });
                });
            });
        } else {
            // Update
            db.query("UPDATE memberships SET role = ? WHERE id = ?", [role, membershipId], (upErr) => {
                if (upErr) return res.status(500).json({ message: "Database Error" });
                
                logAuditEvent({
                    req,
                    eventCategory: "TEAM",
                    action: "MEMBER_ROLE_CHANGED",
                    resourceType: "USER",
                    resourceId: member.user_id,
                    metadata: { memberUserId: member.user_id, oldRole: member.role, newRole: role }
                });

                res.status(200).json({ message: "Role updated successfully" });
            });
        }
    });
};

// PUT /api/team/members/:id/status — Deactivate/reactivate team member
const updateMemberStatus = (req, res) => {
    const orgId = req.user.organization_id;
    const membershipId = req.params.id;
    const { status } = req.body;

    if (status !== "ACTIVE" && status !== "INACTIVE") {
        return res.status(400).json({ message: "Invalid status value" });
    }

    db.query("SELECT user_id, role, status, organization_id FROM memberships WHERE id = ?", [membershipId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "Membership not found" });
        }

        const member = rows[0];
        if (member.organization_id !== orgId) {
            return res.status(403).json({ message: "Access Denied: Cross-organization modification blocked" });
        }

        if (status === "INACTIVE" && member.role === "Admin") {
            // Check if this is the last Admin
            const countSql = "SELECT COUNT(*) as count FROM memberships WHERE organization_id = ? AND role = 'Admin' AND status = 'ACTIVE'";
            db.query(countSql, [orgId], (countErr, countRows) => {
                if (!countErr && countRows[0].count <= 1) {
                    return res.status(400).json({ message: "Access Denied: Cannot deactivate the last active Admin" });
                }

                db.query("UPDATE memberships SET status = ? WHERE id = ?", [status, membershipId], (upErr) => {
                    if (upErr) return res.status(500).json({ message: "Database Error" });

                    // Log audit event
                    logAuditEvent({
                        req,
                        eventCategory: "TEAM",
                        action: status === "ACTIVE" ? "MEMBER_REACTIVATED" : "MEMBER_DEACTIVATED",
                        resourceType: "USER",
                        resourceId: member.user_id,
                        metadata: { targetUserId: member.user_id }
                    });

                    res.status(200).json({ message: `Member ${status === "ACTIVE" ? "activated" : "deactivated"} successfully` });
                });
            });
        } else {
            db.query("UPDATE memberships SET status = ? WHERE id = ?", [status, membershipId], (upErr) => {
                if (upErr) return res.status(500).json({ message: "Database Error" });

                // Log audit event
                logAuditEvent({
                    req,
                    eventCategory: "TEAM",
                    action: status === "ACTIVE" ? "MEMBER_REACTIVATED" : "MEMBER_DEACTIVATED",
                    resourceType: "USER",
                    resourceId: member.user_id,
                    metadata: { targetUserId: member.user_id }
                });

                res.status(200).json({ message: `Member ${status === "ACTIVE" ? "activated" : "deactivated"} successfully` });
            });
        }
    });
};

// DELETE /api/team/members/:id — Remove member
const removeMember = (req, res) => {
    const orgId = req.user.organization_id;
    const membershipId = req.params.id;

    db.query("SELECT user_id, role, organization_id FROM memberships WHERE id = ?", [membershipId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "Membership not found" });
        }

        const member = rows[0];
        if (member.organization_id !== orgId) {
            return res.status(403).json({ message: "Access Denied" });
        }

        if (member.role === "Admin") {
            // Protect last admin
            const countSql = "SELECT COUNT(*) as count FROM memberships WHERE organization_id = ? AND role = 'Admin' AND status = 'ACTIVE'";
            db.query(countSql, [orgId], (countErr, countRows) => {
                if (!countErr && countRows[0].count <= 1) {
                    return res.status(400).json({ message: "Cannot remove the last Admin" });
                }

                db.query("DELETE FROM memberships WHERE id = ?", [membershipId], (delErr) => {
                    if (delErr) return res.status(500).json({ message: "Database Error" });
                    
                    // Log audit event
                    logAuditEvent({
                        req,
                        eventCategory: "TEAM",
                        action: "MEMBER_REMOVED",
                        resourceType: "USER",
                        resourceId: member.user_id,
                        metadata: { targetUserId: member.user_id }
                    });

                    res.status(200).json({ message: "Team member removed successfully" });
                });
            });
        } else {
            db.query("DELETE FROM memberships WHERE id = ?", [membershipId], (delErr) => {
                if (delErr) return res.status(500).json({ message: "Database Error" });
                
                // Log audit event
                logAuditEvent({
                    req,
                    eventCategory: "TEAM",
                    action: "MEMBER_REMOVED",
                    resourceType: "USER",
                    resourceId: member.user_id,
                    metadata: { targetUserId: member.user_id }
                });

                res.status(200).json({ message: "Team member removed successfully" });
            });
        }
    });
};

// GET /api/team/invitations — List pending invitations
const getInvitations = (req, res) => {
    const orgId = req.user.organization_id;

    const sql = `
        SELECT i.id, i.email, i.role, i.status, i.expires_at, i.created_at, u.name as invited_by_name
        FROM invitations i
        LEFT JOIN users u ON i.invited_by = u.id
        WHERE i.organization_id = ? AND i.status = 'PENDING' AND i.expires_at > CURRENT_TIMESTAMP
        ORDER BY i.id DESC
    `;

    db.query(sql, [orgId], (err, rows) => {
        if (err) {
            console.error("Error fetching invitations:", err);
            return res.status(500).json({ message: "Database Error" });
        }
        res.status(200).json(rows || []);
    });
};

// POST /api/team/invitations — Create invitation
const createInvitation = (req, res) => {
    const orgId = req.user.organization_id;
    const invitedBy = req.user.id;
    const { email, role } = req.body;

    if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
    }

    const allowedRoles = ["Admin", "Recruiter", "Hiring Manager", "Interviewer"];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already has membership in this organization
    const checkMemberSql = `
        SELECT m.id FROM memberships m
        INNER JOIN users u ON m.user_id = u.id
        WHERE m.organization_id = ? AND u.email = ?
    `;
    db.query(checkMemberSql, [orgId, normalizedEmail], (err, members) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        if (members && members.length > 0) {
            return res.status(409).json({ message: "This user is already a member of your team" });
        }

        // Check if a pending active invitation exists
        const checkInviteSql = `
            SELECT id FROM invitations 
            WHERE organization_id = ? AND email = ? AND status = 'PENDING' AND expires_at > CURRENT_TIMESTAMP
        `;
        db.query(checkInviteSql, [orgId, normalizedEmail], (invErr, invites) => {
            if (invErr) return res.status(500).json({ message: "Database Error" });
            if (invites && invites.length > 0) {
                return res.status(409).json({ message: "A pending active invitation already exists for this email" });
            }

            // Create cryptographically secure token
            const rawToken = crypto.randomBytes(32).toString("hex");
            const tokenHash = hashToken(rawToken);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

            const insertSql = `
                INSERT INTO invitations (organization_id, email, role, token_hash, invited_by, expires_at, status)
                VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
            `;

            db.query(insertSql, [orgId, normalizedEmail, role, tokenHash, invitedBy, expiresAt], (insErr, result) => {
                if (insErr) {
                    console.error("Error creating invitation:", insErr);
                    return res.status(500).json({ message: "Failed to create invitation" });
                }

                // Create activity event
                const activitySql = "INSERT INTO activities (action, details, organization_id) VALUES ('Member Invited', ?, ?)";
                const details = `Invited ${normalizedEmail} as ${role}`;
                db.query(activitySql, [details, orgId]);

                // Return URL link for development/testing workflow
                const inviteUrl = `/register?token=${rawToken}`;
                res.status(201).json({
                    message: "Invitation created successfully",
                    inviteUrl,
                    expiresAt
                });
            });
        });
    });
};

// DELETE /api/team/invitations/:id — Cancel invitation
const cancelInvitation = (req, res) => {
    const orgId = req.user.organization_id;
    const inviteId = req.params.id;

    db.query("SELECT organization_id, email FROM invitations WHERE id = ?", [inviteId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "Invitation not found" });
        }

        if (rows[0].organization_id !== orgId) {
            return res.status(403).json({ message: "Access Denied" });
        }

        db.query("UPDATE invitations SET status = 'CANCELLED' WHERE id = ?", [inviteId], (upErr) => {
            if (upErr) return res.status(500).json({ message: "Database Error" });
            
            // Create activity
            const details = `Cancelled invitation for ${rows[0].email}`;
            db.query("INSERT INTO activities (action, details, organization_id) VALUES ('Invitation Cancelled', ?, ?)", [details, orgId]);

            res.status(200).json({ message: "Invitation cancelled successfully" });
        });
    });
};

// POST /api/team/invitations/:id/resend — Resend invitation
const resendInvitation = (req, res) => {
    const orgId = req.user.organization_id;
    const inviteId = req.params.id;

    db.query("SELECT organization_id, email, role FROM invitations WHERE id = ?", [inviteId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "Invitation not found" });
        }

        if (rows[0].organization_id !== orgId) {
            return res.status(403).json({ message: "Access Denied" });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiration

        const updateSql = `
            UPDATE invitations
            SET token_hash = ?, expires_at = ?, status = 'PENDING', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.query(updateSql, [tokenHash, expiresAt, inviteId], (upErr) => {
            if (upErr) return res.status(500).json({ message: "Database Error" });
            
            const inviteUrl = `/register?token=${rawToken}`;
            res.status(200).json({
                message: "Invitation resent successfully",
                inviteUrl,
                expiresAt
            });
        });
    });
};

// GET /api/team/invitations/validate/:token — Public: Validate invitation token
const validateInvitationToken = (req, res) => {
    const rawToken = req.params.token;
    const tokenHash = hashToken(rawToken);

    const sql = `
        SELECT i.id, i.email, i.role, i.status, i.expires_at, o.name as organization_name
        FROM invitations i
        INNER JOIN organizations o ON i.organization_id = o.id
        WHERE i.token_hash = ? AND i.status = 'PENDING'
    `;

    db.query(sql, [tokenHash], (err, rows) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Invalid or expired invitation token" });
        }

        const invite = rows[0];
        const isExpired = new Date() > new Date(invite.expires_at);

        if (isExpired) {
            // Update status to expired
            db.query("UPDATE invitations SET status = 'EXPIRED' WHERE id = ?", [invite.id]);
            return res.status(400).json({ message: "This invitation has expired. Please contact your administrator." });
        }

        res.status(200).json({
            success: true,
            email: invite.email,
            role: invite.role,
            organization_name: invite.organization_name
        });
    });
};

// GET /api/team/interviewers — List team members available to schedule interviews
const getInterviewers = (req, res) => {
    const orgId = req.user.organization_id;
    const sql = `
        SELECT u.id, u.name, u.email, m.role
        FROM memberships m
        INNER JOIN users u ON m.user_id = u.id
        WHERE m.organization_id = ? AND m.status = 'ACTIVE' 
          AND m.role IN ('Admin', 'Recruiter', 'Hiring Manager', 'Interviewer', 'HR')
        ORDER BY u.name ASC
    `;
    db.query(sql, [orgId], (err, rows) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        res.status(200).json(rows || []);
    });
};

module.exports = {
    getMembers,
    updateMemberRole,
    updateMemberStatus,
    removeMember,
    getInvitations,
    createInvitation,
    cancelInvitation,
    resendInvitation,
    validateInvitationToken,
    getInterviewers
};
