const db = require("../config/db");
const { createNotification } = require("../utils/notifier");

// Helper to check access to the commented resource (e.g. applications)
const verifyResourceAccess = (resourceType, resourceId, req, callback) => {
    const { role, organization_id, email, id: userId } = req.user;

    if (resourceType !== "application") {
        return callback(new Error("Unsupported resource type"));
    }

    db.query("SELECT organization_id, job_id, email FROM applications WHERE id = ?", [resourceId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return callback(new Error("Resource not found"));
        }

        const app = rows[0];

        // Organization isolation
        if (app.organization_id && app.organization_id !== organization_id) {
            return callback(new Error("Access Denied: Cross-organization access blocked"));
        }

        if (role === "Admin" || role === "HR" || role === "Recruiter") {
            return callback(null);
        }

        if (role === "Hiring Manager") {
            const checkAssign = "SELECT id FROM job_assignments WHERE job_id = ? AND user_id = ? AND assigned_role = 'Hiring Manager'";
            db.query(checkAssign, [app.job_id, userId], (checkErr, assigns) => {
                if (checkErr || !assigns || assigns.length === 0) {
                    return callback(new Error("Access Denied: You are not assigned to this job requisition"));
                }
                callback(null);
            });
        } else if (role === "Interviewer") {
            const checkInterview = "SELECT id FROM interviews WHERE (candidate_id = ? OR application_id = ?) AND interviewer = ? AND organization_id = ?";
            db.query(checkInterview, [resourceId, resourceId, email, organization_id], (ivErr, ivs) => {
                if (ivErr || !ivs || ivs.length === 0) {
                    return callback(new Error("Access Denied: You do not have scheduled interviews with this candidate"));
                }
                callback(null);
            });
        } else {
            callback(new Error("Access Denied: Invalid role permissions"));
        }
    });
};

// GET /api/comments/:resourceType/:resourceId — Fetch all comments
const getComments = (req, res) => {
    const { resourceType, resourceId } = req.params;
    const orgId = req.user.organization_id;

    verifyResourceAccess(resourceType, resourceId, req, (err) => {
        if (err) return res.status(403).json({ message: err.message });

        const sql = `
            SELECT c.id, c.content, c.created_at, c.updated_at, u.name as author_name, u.email as author_email, m.role as author_role, c.author_id
            FROM comments c
            INNER JOIN users u ON c.author_id = u.id
            INNER JOIN memberships m ON u.id = m.user_id AND m.organization_id = c.organization_id
            WHERE c.organization_id = ? AND c.resource_type = ? AND c.resource_id = ?
            ORDER BY c.id ASC
        `;

        db.query(sql, [orgId, resourceType, resourceId], (selectErr, rows) => {
            if (selectErr) {
                console.error("Fetch Comments Error:", selectErr);
                return res.status(500).json({ message: "Database Error" });
            }
            res.status(200).json(rows || []);
        });
    });
};

// POST /api/comments — Create comment and extract mentions
const createComment = (req, res) => {
    const orgId = req.user.organization_id;
    const authorId = req.user.id;
    const { resourceType, resourceId, content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ message: "Comment content cannot be empty" });
    }

    verifyResourceAccess(resourceType, resourceId, req, (err) => {
        if (err) return res.status(403).json({ message: err.message });

        const insertSql = `
            INSERT INTO comments (organization_id, resource_type, resource_id, author_id, content)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(insertSql, [orgId, resourceType, resourceId, authorId, content.trim()], (insertErr, result) => {
            if (insertErr) {
                console.error("Create Comment Error:", insertErr);
                return res.status(500).json({ message: "Database Error" });
            }

            const commentId = result.insertId;

            // Extract Mentions: search for @name or @email formats
            // E.g. "@Admin User" or "@admin@gmail.com"
            const mentionRegex = /@([a-zA-Z0-9_\.\-\+]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-]+|"[^"]+"|[a-zA-Z0-9_\-]+)/g;
            const matches = content.match(mentionRegex) || [];
            
            const processedEmails = new Set();

            const handleMention = (mentionStr) => {
                let identifier = mentionStr.substring(1).replace(/"/g, "").trim();

                // Search user in same organization by email or name
                const findUserSql = `
                    SELECT u.id, u.email, u.name 
                    FROM memberships m
                    INNER JOIN users u ON m.user_id = u.id
                    WHERE m.organization_id = ? AND m.status = 'ACTIVE' AND (LOWER(u.email) = LOWER(?) OR LOWER(u.name) = LOWER(?))
                `;
                
                db.query(findUserSql, [orgId, identifier, identifier], (findErr, users) => {
                    if (!findErr && users && users.length > 0) {
                        const mentioned = users[0];
                        if (processedEmails.has(mentioned.email)) return;
                        processedEmails.add(mentioned.email);

                        // Save mention
                        db.query("INSERT INTO mentions (comment_id, user_id) VALUES (?, ?)", [commentId, mentioned.id]);

                        // Send notification via Phase 12 notifier
                        const messageText = `${req.user.email.split('@')[0]} mentioned you in a candidate comment: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`;
                        createNotification(
                            mentioned.email,
                            "MENTION",
                            "HIGH",
                            "New Collaboration Mention",
                            messageText
                        );
                    }
                });
            };

            for (const match of matches) {
                handleMention(match);
            }

            res.status(201).json({
                message: "Comment posted successfully",
                commentId
            });
        });
    });
};

// PUT /api/comments/:id — Update comment (author only)
const updateComment = (req, res) => {
    const id = req.params.id;
    const authorId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ message: "Content cannot be empty" });
    }

    db.query("SELECT author_id, organization_id FROM comments WHERE id = ?", [id], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const comment = rows[0];
        if (comment.organization_id !== req.user.organization_id) {
            return res.status(403).json({ message: "Access Denied: Organization mismatch" });
        }

        if (comment.author_id !== authorId) {
            return res.status(403).json({ message: "Access Denied: Only authors can edit comments" });
        }

        db.query("UPDATE comments SET content = ? WHERE id = ?", [content.trim(), id], (upErr) => {
            if (upErr) return res.status(500).json({ message: "Database Error" });
            res.status(200).json({ message: "Comment updated successfully" });
        });
    });
};

// DELETE /api/comments/:id — Delete comment (author or Admin)
const deleteComment = (req, res) => {
    const id = req.params.id;
    const authorId = req.user.id;
    const isAdmin = req.user.role === "Admin";

    db.query("SELECT author_id, organization_id FROM comments WHERE id = ?", [id], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const comment = rows[0];
        if (comment.organization_id !== req.user.organization_id) {
            return res.status(403).json({ message: "Access Denied: Organization mismatch" });
        }

        if (comment.author_id !== authorId && !isAdmin) {
            return res.status(403).json({ message: "Access Denied: Unauthorized to delete comment" });
        }

        db.query("DELETE FROM comments WHERE id = ?", [id], (delErr) => {
            if (delErr) return res.status(500).json({ message: "Database Error" });
            res.status(200).json({ message: "Comment deleted successfully" });
        });
    });
};

module.exports = {
    getComments,
    createComment,
    updateComment,
    deleteComment
};
