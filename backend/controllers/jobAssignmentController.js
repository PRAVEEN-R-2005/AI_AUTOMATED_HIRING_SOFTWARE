const db = require("../config/db");

// Verify job belongs to organization
const verifyJobAccess = (jobId, orgId, callback) => {
    db.query("SELECT organization_id FROM job_descriptions WHERE jd_id = ?", [jobId], (err, rows) => {
        if (err || !rows || rows.length === 0) return callback(new Error("Job not found"));
        if (rows[0].organization_id !== orgId) return callback(new Error("Access Denied: Cross-organization access blocked"));
        callback(null);
    });
};

// GET /api/jobs/:id/team — Fetch hiring team for a job
const getJobTeam = (req, res) => {
    const orgId = req.user.organization_id;
    const jobId = req.params.id;

    verifyJobAccess(jobId, orgId, (err) => {
        if (err) return res.status(403).json({ message: err.message });

        const sql = `
            SELECT u.id, u.name, u.email, ja.assigned_role, ja.id as assignment_id
            FROM job_assignments ja
            INNER JOIN users u ON ja.user_id = u.id
            WHERE ja.job_id = ?
        `;

        db.query(sql, [jobId], (selectErr, rows) => {
            if (selectErr) return res.status(500).json({ message: "Database Error" });
            res.status(200).json(rows || []);
        });
    });
};

// POST /api/jobs/:id/team — Assign team member to a job
const assignTeamMember = (req, res) => {
    const orgId = req.user.organization_id;
    const jobId = req.params.id;
    const { user_id, assigned_role } = req.body;

    if (!user_id || !assigned_role) {
        return res.status(400).json({ message: "User ID and assigned role are required" });
    }

    const allowedRoles = ["Recruiter", "Hiring Manager", "Interviewer", "HR"];
    if (!allowedRoles.includes(assigned_role)) {
        return res.status(400).json({ message: "Invalid role for assignment" });
    }

    verifyJobAccess(jobId, orgId, (err) => {
        if (err) return res.status(403).json({ message: err.message });

        // Verify the user being assigned belongs to the same organization
        const verifyUserSql = "SELECT id FROM memberships WHERE user_id = ? AND organization_id = ? AND status = 'ACTIVE'";
        db.query(verifyUserSql, [user_id, orgId], (usrErr, users) => {
            if (usrErr || !users || users.length === 0) {
                return res.status(400).json({ message: "User is not an active member of this organization" });
            }

            const sql = "INSERT INTO job_assignments (job_id, user_id, assigned_role) VALUES (?, ?, ?)";
            db.query(sql, [jobId, user_id, assigned_role], (insertErr) => {
                if (insertErr) {
                    if (insertErr.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({ message: "This member is already assigned to the job" });
                    }
                    return res.status(500).json({ message: "Database Error" });
                }

                // Add activity log
                const detailsSql = "SELECT title FROM job_descriptions WHERE jd_id = ?";
                db.query(detailsSql, [jobId], (titleErr, jobs) => {
                    const jobTitle = (!titleErr && jobs.length > 0) ? jobs[0].title : "requisition";
                    const emailSql = "SELECT email FROM users WHERE id = ?";
                    db.query(emailSql, [user_id], (emailErr, userRows) => {
                        const emailStr = (!emailErr && userRows.length > 0) ? userRows[0].email : "Member";
                        db.query(
                            "INSERT INTO activities (action, details, organization_id) VALUES ('Hiring Team Updated', ?, ?)",
                            [`Assigned ${emailStr} as ${assigned_role} to job "${jobTitle}"`, orgId]
                        );
                    });
                });

                res.status(201).json({ message: "Team member assigned to job successfully" });
            });
        });
    });
};

// DELETE /api/jobs/:id/team/:userId — Unassign team member from a job
const unassignTeamMember = (req, res) => {
    const orgId = req.user.organization_id;
    const jobId = req.params.id;
    const userId = req.params.userId;

    verifyJobAccess(jobId, orgId, (err) => {
        if (err) return res.status(403).json({ message: err.message });

        const sql = "DELETE FROM job_assignments WHERE job_id = ? AND user_id = ?";
        db.query(sql, [jobId, userId], (delErr) => {
            if (delErr) return res.status(500).json({ message: "Database Error" });

            // Add activity log
            const detailsSql = "SELECT title FROM job_descriptions WHERE jd_id = ?";
            db.query(detailsSql, [jobId], (titleErr, jobs) => {
                const jobTitle = (!titleErr && jobs.length > 0) ? jobs[0].title : "requisition";
                const emailSql = "SELECT email FROM users WHERE id = ?";
                db.query(emailSql, [userId], (emailErr, userRows) => {
                    const emailStr = (!emailErr && userRows.length > 0) ? userRows[0].email : "Member";
                    db.query(
                        "INSERT INTO activities (action, details, organization_id) VALUES ('Hiring Team Updated', ?, ?)",
                        [`Unassigned ${emailStr} from job "${jobTitle}"`, orgId]
                    );
                });
            });

            res.status(200).json({ message: "Team member unassigned successfully" });
        });
    });
};

module.exports = {
    getJobTeam,
    assignTeamMember,
    unassignTeamMember
};
