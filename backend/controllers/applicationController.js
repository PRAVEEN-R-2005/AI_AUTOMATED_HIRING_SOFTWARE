const Application = require("../models/applicationModel");
const db = require("../config/db");
const { notifyRecruiters } = require("../utils/notifier");
const { logAuditEvent } = require("../utils/auditLogger");

// Helper to verify application access for safety / IDOR prevention
const verifyAppAccess = (appId, req, callback) => {
    const { role, organization_id, email, id: userId } = req.user;

    // Fetch the application and its job details
    const sql = `
        SELECT a.organization_id, a.job_id, a.email as candidate_email, a.status 
        FROM applications a 
        WHERE a.id = ?
    `;
    db.query(sql, [appId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return callback(new Error("Application not found"));
        }

        const app = rows[0];

        // Organization isolation check
        if (app.organization_id && app.organization_id !== organization_id) {
            return callback(new Error("Access Denied: Cross-organization access blocked"));
        }

        if (role === "Admin" || role === "HR" || role === "Recruiter") {
            return callback(null, app);
        }

        if (role === "Hiring Manager") {
            const checkAssign = "SELECT id FROM job_assignments WHERE job_id = ? AND user_id = ? AND assigned_role = 'Hiring Manager'";
                db.query(checkAssign, [app.job_id, userId], (assignErr, assigns) => {
                if (assignErr || !assigns || assigns.length === 0) {
                    return callback(new Error("Access Denied: You are not assigned to this job"));
                }
                callback(null, app);
            });
        } else if (role === "Interviewer") {
            const checkInterview = "SELECT id FROM interviews WHERE (candidate_id = ? OR application_id = ?) AND interviewer = ? AND organization_id = ?";
            db.query(checkInterview, [appId, appId, email, organization_id], (ivErr, ivs) => {
                if (ivErr || !ivs || ivs.length === 0) {
                    return callback(new Error("Access Denied: You do not have scheduled interviews with this candidate"));
                }
                callback(null, app);
            });
        } else if (role === "Candidate") {
            if (app.candidate_email.toLowerCase() !== email.toLowerCase()) {
                return callback(new Error("Access Denied: You do not own this application"));
            }
            callback(null, app);
        } else {
            callback(new Error("Access Denied: Invalid role permissions"));
        }
    });
};

// ====================================
// CREATE APPLICATION
// ====================================
const createApplication = (req, res) => {
    const { candidate_name, email, phone, job_id } = req.body;
    const resume_file = req.file ? req.file.filename : null;

    // Helper to delete file on validation failure
    const deleteUploadedFile = () => {
        if (req.file) {
            const fs = require("fs");
            const path = require("path");
            const filePath = path.join(__dirname, "../uploads/resumes", req.file.filename);
            fs.unlink(filePath, (err) => {
                if (err) console.error("Error deleting file after validation failure:", err);
            });
        }
    };

    if (!candidate_name || !candidate_name.trim()) {
        deleteUploadedFile();
        return res.status(400).json({ message: "Candidate name is required" });
    }

    if (!email || !email.trim()) {
        deleteUploadedFile();
        return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        deleteUploadedFile();
        return res.status(400).json({ message: "Invalid email format" });
    }

    if (!phone || !phone.trim()) {
        deleteUploadedFile();
        return res.status(400).json({ message: "Phone number is required" });
    }

    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(phone.trim())) {
        deleteUploadedFile();
        return res.status(400).json({ message: "Invalid phone number format. Please provide a valid phone number." });
    }

    if (!job_id) {
        deleteUploadedFile();
        return res.status(400).json({ message: "Job Requisition ID is required" });
    }

    if (!resume_file) {
        return res.status(400).json({ message: "Resume file upload is required" });
    }

    // Look up organization ID of the job requisition being applied to
    const jobSql = "SELECT organization_id FROM job_descriptions WHERE jd_id = ?";
    db.query(jobSql, [job_id], (jobErr, jobs) => {
        if (jobErr || !jobs || jobs.length === 0) {
            return res.status(404).json({ message: "Job Requisition not found" });
        }

        const orgId = jobs[0].organization_id || 1;

        const sql = `
            INSERT INTO applications (candidate_name, email, phone, job_id, resume_file, status, organization_id)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?)
        `;

        db.query(sql, [candidate_name, email, phone, job_id, resume_file, orgId], (err, result) => {
            if (err) {
                console.error("Create Application Error:", err);
                return res.status(500).json({ message: "Database Error" });
            }

            // Log audit event
            logAuditEvent({
                organizationId: orgId,
                actorName: candidate_name,
                actorEmail: email,
                eventCategory: "APPLICATION",
                action: "APPLICATION_STATUS_CHANGED",
                resourceType: "APPLICATION",
                resourceId: result.insertId,
                metadata: { status: "Pending", job_id }
            });

            res.status(201).json({
                message: "Application Submitted Successfully",
                applicationId: result.insertId
            });
        });
    });
};

// ====================================
// GET ALL APPLICATIONS
// ====================================
const getApplications = (req, res) => {
    const { role, organization_id, id: userId, email } = req.user;

    let sql = "";
    const params = [organization_id];

    if (role === "Admin" || role === "HR" || role === "Recruiter") {
        sql = `
            SELECT a.*, j.title AS job_title 
            FROM applications a
            LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
            WHERE a.organization_id = ?
            ORDER BY a.id DESC
        `;
    } else if (role === "Hiring Manager") {
        sql = `
            SELECT a.*, j.title AS job_title 
            FROM applications a
            LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
            INNER JOIN job_assignments ja ON a.job_id = ja.job_id
            WHERE a.organization_id = ? AND ja.user_id = ? AND ja.assigned_role = 'Hiring Manager'
            ORDER BY a.id DESC
        `;
        params.push(userId);
    } else if (role === "Interviewer") {
        sql = `
            SELECT a.*, j.title AS job_title 
            FROM applications a
            LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
            INNER JOIN interviews iv ON COALESCE(iv.application_id, iv.candidate_id) = a.id
            WHERE a.organization_id = ? AND iv.interviewer = ?
            ORDER BY a.id DESC
        `;
        params.push(email);
    } else {
        return res.status(403).json({ message: "Access Denied: Invalid role permissions" });
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Fetch Applications Error:", err);
            return res.status(500).json({ message: "Database Error" });
        }

        const normalizedResults = (results || []).map((app) => ({
            ...app,
            overallFit: app.match_score ?? app.overallFit ?? app.overall_score ?? null,
            overallScore: app.match_score ?? app.overallScore ?? app.overall_fit ?? null,
            screeningStatus: app.screening_status || (app.match_score !== null ? "Completed" : "Pending")
        }));

        res.status(200).json(normalizedResults);
    });
};

// ====================================
// GET APPLICATIONS BY EMAIL
// ====================================
const getApplicationByEmail = (req, res) => {
    const email = req.params.email;

    // IDOR Protection: Candidates can only fetch applications matching their own email.
    if (req.user.role === "Candidate" && req.user.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({
            success: false,
            message: "Access Denied: You are not authorized to view applications for this email"
        });
    }

    const sql = `
        SELECT a.*, j.title AS job_title 
        FROM applications a
        LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
        WHERE a.email = ?
        ORDER BY a.id DESC
    `;

    db.query(sql, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database Error" });
        }

        const normalizedResults = (results || []).map((app) => ({
            ...app,
            overallFit: app.match_score ?? app.overallFit ?? app.overall_score ?? null,
            overallScore: app.match_score ?? app.overallScore ?? app.overall_fit ?? null,
            screeningStatus: app.screening_status || (app.match_score !== null ? "Completed" : "Pending")
        }));

        // Mask sensitive internal properties (recruiter notes, rejection reason) for candidates
        if (req.user.role === "Candidate") {
            const masked = normalizedResults.map(app => {
                const { recruiter_notes, rejection_reason, ...rest } = app;
                return rest;
            });
            return res.status(200).json(masked);
        }

        res.status(200).json(normalizedResults);
    });
};

// ====================================
// UPDATE STATUS
// ====================================
const updateApplicationStatus = (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    const VALID_STAGES = ["Pending", "Screening", "Shortlisted", "Interview", "Hired", "Rejected"];
    if (!VALID_STAGES.includes(status)) {
        return res.status(400).json({ message: "Invalid status stage value." });
    }

    verifyAppAccess(id, req, (authErr, app) => {
        if (authErr) return res.status(403).json({ message: authErr.message });

        const oldStatus = app.status;

        Application.updateApplicationStatus(id, status, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }

            db.query(
                "INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (?, ?, 'Stage Transition', ?, ?)",
                [id, app.candidate_name || "Applicant", `Moved from ${oldStatus} to ${status}`, req.user.organization_id],
                (actErr) => {
                    if (actErr) console.error("Failed to insert transition activity:", actErr);
                    
                    // Broadcast pipeline notification using user organization context
                    notifyRecruiters(
                        req.user.organization_id,
                        "PIPELINE_STAGE_CHANGED",
                        "NORMAL",
                        "Pipeline Stage Transition",
                        `Candidate ${app.candidate_name || "Applicant"} moved from ${oldStatus} to ${status}`
                    );

                    logAuditEvent({
                        req,
                        eventCategory: "APPLICATION",
                        action: "APPLICATION_STATUS_CHANGED",
                        resourceType: "APPLICATION",
                        resourceId: id,
                        metadata: { oldStatus, newStatus: status }
                    });

                    res.status(200).json({
                        message: "Status Updated",
                        status
                    });
                }
            );
        });
    });
};

// ====================================
// SHORTLIST APPLICATION
// ====================================
const shortlistApplication = (req, res) => {
    const id = req.params.id;

    verifyAppAccess(id, req, (authErr, app) => {
        if (authErr) return res.status(403).json({ message: authErr.message });

        Application.shortlistApplication(id, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }

            db.query(
                "INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (?, ?, 'Shortlist', 'Candidate shortlisted for interview stages', ?)",
                [id, app.candidate_name || "Applicant", req.user.organization_id],
                (actErr) => {
                    if (actErr) console.error("Failed to insert shortlist activity:", actErr);
                    
                    notifyRecruiters(
                        req.user.organization_id,
                        "PIPELINE_STAGE_CHANGED",
                        "HIGH",
                        "Candidate Shortlisted",
                        `Candidate ${app.candidate_name || "Applicant"} has been shortlisted for interview rounds.`
                    );

                    logAuditEvent({
                        req,
                        eventCategory: "APPLICATION",
                        action: "APPLICATION_STATUS_CHANGED",
                        resourceType: "APPLICATION",
                        resourceId: id,
                        metadata: { oldStatus: app.status, newStatus: "Shortlisted" }
                    });

                    res.status(200).json({
                        message: "Candidate Shortlisted"
                    });
                }
            );
        });
    });
};

// ====================================
// REJECT APPLICATION
// ====================================
const rejectApplication = (req, res) => {
    const id = req.params.id;
    const { reason } = req.body;

    verifyAppAccess(id, req, (authErr, app) => {
        if (authErr) return res.status(403).json({ message: authErr.message });

        Application.rejectApplication(id, reason || null, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }

            db.query(
                "INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (?, ?, 'Rejection', ?, ?)",
                [id, app.candidate_name || "Applicant", reason || 'No rejection reason logged', req.user.organization_id],
                (actErr) => {
                    if (actErr) console.error("Failed to insert rejection activity:", actErr);
                    
                    notifyRecruiters(
                        "CANDIDATE_REJECTED",
                        "NORMAL",
                        "Candidate Rejected",
                        `Candidate ${app.candidate_name || "Applicant"} marked Rejected. Reason: ${reason || 'None provided'}`
                    );

                    logAuditEvent({
                        req,
                        eventCategory: "APPLICATION",
                        action: "APPLICATION_STATUS_CHANGED",
                        resourceType: "APPLICATION",
                        resourceId: id,
                        metadata: { oldStatus: app.status, newStatus: "Rejected", reason }
                    });

                    res.status(200).json({
                        message: "Candidate Rejected"
                    });
                }
            );
        });
    });
};

// ====================================
// UPDATE NOTES
// ====================================
const updateNotes = (req, res) => {
    const id = req.params.id;
    const { notes } = req.body;

    verifyAppAccess(id, req, (authErr, app) => {
        if (authErr) return res.status(403).json({ message: authErr.message });

        Application.updateNotes(id, notes || null, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }
            logAuditEvent({
                req,
                eventCategory: "CANDIDATE",
                action: "CANDIDATE_UPDATED",
                resourceType: "APPLICATION",
                resourceId: id,
                metadata: { field: "recruiter_notes" }
            });

            res.status(200).json({
                message: "Notes Updated"
            });
        });
    });
};

// ====================================
// UPDATE MATCH SCORE
// ====================================
const updateMatchScore = (req, res) => {
    const id = req.params.id;
    const { match_score } = req.body;

    verifyAppAccess(id, req, (authErr, app) => {
        if (authErr) return res.status(403).json({ message: authErr.message });

        Application.updateMatchScore(id, match_score, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }
            res.status(200).json({
                message: "Match Score Updated Successfully"
            });
        });
    });
};

module.exports = {
    createApplication,
    getApplications,
    getApplicationByEmail,
    updateApplicationStatus,
    shortlistApplication,
    rejectApplication,
    updateNotes,
    updateMatchScore
};
