const Interview = require("../models/interviewModel");
const db = require("../config/db");
const { notifyRecruiters, createNotification } = require("../utils/notifier");

const normalizeInterviewPayload = (body = {}) => {
    const candidateId = Number(body.candidate_id ?? body.candidateId ?? body.id ?? 0);
    const applicationId = Number(body.application_id ?? body.applicationId ?? body.application ?? body.id ?? 0);
    const jobId = Number(body.job_id ?? body.jobId ?? body.jobRequisitionId ?? body.job_requisition_id ?? 0);
    const candidateName = body.candidate_name ?? body.candidateName ?? body.name ?? "";
    const email = body.email ?? body.candidate_email ?? body.candidateEmail ?? "";
    const phone = body.phone ?? body.contact_number ?? body.contactNumber ?? "N/A";
    const aiScore = Number(body.ai_score ?? body.aiScore ?? body.match_score ?? body.matchScore ?? 0);

    const rawDate = body.interview_date ?? body.scheduledDate ?? body.date ?? "";
    let interviewDate = "";
    if (typeof rawDate === "string") {
        const trimmed = rawDate.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            interviewDate = trimmed;
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
            const [day, month, year] = trimmed.split("-");
            interviewDate = `${year}-${month}-${day}`;
        } else {
            const parsed = new Date(trimmed);
            if (!Number.isNaN(parsed.getTime())) {
                interviewDate = parsed.toISOString().slice(0, 10);
            }
        }
    }

    const rawTime = body.interview_time ?? body.startTime ?? body.time ?? "";
    const interviewTime = typeof rawTime === "string" ? rawTime.trim() : "";

    const rawDuration = body.duration ?? body.durationMinutes ?? body.duration_min ?? body.durationValue ?? body.duration_minutes ?? "";
    let duration = 30;
    if (typeof rawDuration === "string") {
        const parsed = rawDuration.match(/(\d+)/);
        duration = parsed ? Number(parsed[1]) : 30;
    } else if (typeof rawDuration === "number") {
        duration = rawDuration;
    }

    const mode = body.mode ?? body.interviewType ?? body.interview_type ?? "Video Call";
    const round = body.round ?? body.roundType ?? body.round_type ?? "Technical Interview";
    const interviewerId = Number(body.interviewer_id ?? body.interviewerId ?? body.interviewer ?? 0);
    const interviewerName = body.interviewer_name ?? body.interviewerName ?? body.interviewer ?? "";
    const interviewer = interviewerName || body.interviewer || "";
    const meetingLink = body.meeting_link ?? body.meetingLink ?? (mode === "Video Call" ? body.meeting_link || body.meetingLink || "" : null);

    return {
        candidate_id: Number.isNaN(candidateId) ? null : candidateId,
        application_id: Number.isNaN(applicationId) ? null : applicationId,
        job_id: Number.isNaN(jobId) ? null : jobId,
        candidate_name: candidateName,
        email,
        phone,
        ai_score: Number.isNaN(aiScore) ? 0 : aiScore,
        interview_date: interviewDate,
        interview_time: interviewTime,
        mode,
        interviewer,
        interviewer_id: Number.isNaN(interviewerId) ? null : interviewerId,
        interviewer_name: interviewerName || interviewer,
        round,
        duration,
        meeting_link: meetingLink || null,
        status: "Scheduled"
    };
};

// Helper to verify interview access (prevent cross-organization IDOR)
const verifyInterviewAccess = (ivId, req, callback) => {
    const { role, organization_id, email } = req.user;

    const sql = "SELECT * FROM interviews WHERE id = ?";
    db.query(sql, [ivId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return callback(new Error("Interview not found"));
        }

        const iv = rows[0];

        // Organization check
        if (iv.organization_id && iv.organization_id !== organization_id) {
            return callback(new Error("Access Denied: Cross-organization access blocked"));
        }

        if (role === "Admin" || role === "HR" || role === "Recruiter") {
            return callback(null, iv);
        }

        if (role === "Interviewer") {
            // Check if user is the assigned interviewer (matching email or name)
            const interviewerEmail = email.toLowerCase();
            const assignedEmail = iv.interviewer ? iv.interviewer.toLowerCase() : "";

            if (assignedEmail !== interviewerEmail) {
                return callback(new Error("Access Denied: You are not the assigned interviewer for this session"));
            }
            return callback(null, iv);
        }

        if (role === "Hiring Manager") {
            // Check if assigned to the candidate's job — support both application_id and candidate_id
            const resourceAppId = iv.application_id || iv.candidate_id || null;
            const checkAssign = `
                SELECT ja.id FROM job_assignments ja
                INNER JOIN applications a ON ja.job_id = a.job_id
                WHERE a.id = ? AND ja.user_id = ? AND ja.assigned_role = 'Hiring Manager'
            `;
            db.query(checkAssign, [resourceAppId, req.user.id], (checkErr, assigns) => {
                if (checkErr || !assigns || assigns.length === 0) {
                    return callback(new Error("Access Denied: You are not assigned to this job requisition"));
                }
                callback(null, iv);
            });
        } else {
            callback(new Error("Access Denied: Invalid role permissions"));
        }
    });
};

// CREATE INTERVIEW WITH CONFLICT CHECKING
const createInterview = (req, res) => {
    const orgId = req.user.organization_id ?? null;
    const payload = normalizeInterviewPayload(req.body);
    const {
        candidate_id,
        application_id,
        job_id,
        candidate_name,
        email,
        phone,
        ai_score,
        interview_date,
        interview_time,
        mode,
        interviewer,
        interviewer_id,
        interviewer_name,
        round,
        duration,
        meeting_link,
        status
    } = payload;

    console.log("[Interview] Scheduling request received:", {
        candidate_id,
        application_id,
        job_id,
        candidate_name,
        interview_date,
        interview_time,
        interviewer_id,
        interviewer_name,
        round,
        mode,
        duration,
        organization_id: orgId
    });

    if (!candidate_id && !application_id) {
        return res.status(400).json({
            success: false,
            message: "A valid candidate or application is required.",
            errorCode: "INVALID_CANDIDATE"
        });
    }

    if (!interviewer_id && !interviewer) {
        return res.status(400).json({
            success: false,
            message: "A valid interviewer is required.",
            errorCode: "INTERVIEWER_REQUIRED"
        });
    }

    if (!interview_date || !interview_time) {
        return res.status(400).json({
            success: false,
            message: "Interview date and time are required.",
            errorCode: "INVALID_DATE_TIME"
        });
    }

    // 1. Conflict detection for the assigned interviewer within the organization
    const conflictSql = `
        SELECT * FROM interviews 
        WHERE interviewer = ? 
          AND interview_date = ? 
          AND interview_time = ? 
          AND status != 'Cancelled'
          AND organization_id = ?
    `;
    db.query(conflictSql, [interviewer, interview_date, interview_time, orgId], (err, conflicts) => {
        if (err) {
            console.error("Conflict check failed:", err);
            return res.status(500).json({ message: "Conflict validation check error" });
        }

        if (conflicts && conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Scheduling conflict: Interviewer ${interviewer} is already booked for another interview on ${interview_date} at ${interview_time}.`,
                errorCode: "SCHEDULING_CONFLICT"
            });
        }

        // 2. Create interview record
        const insertSql = `
            INSERT INTO interviews (
                candidate_id, application_id, job_id, candidate_name, email, phone, ai_score,
                interview_date, interview_time, mode, interviewer, interviewer_id, interviewer_name,
                round, duration, meeting_link, status, organization_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Ensure candidate_id satisfies FK constraint to ai_candidates. If not present,
        // null it out and rely on application_id for linking to `applications`.
        const ensureCandidateFk = (cb) => {
            if (!candidate_id) return cb(null, null);
            db.query("SELECT id FROM ai_candidates WHERE id = ?", [candidate_id], (fkErr, rows) => {
                if (fkErr) {
                    console.error("Failed to validate ai_candidates FK:", fkErr);
                    return cb(null, null);
                }
                if (!rows || rows.length === 0) return cb(null, null);
                cb(null, candidate_id);
            });
        };

        ensureCandidateFk((fkErr, candidateDbId) => {
            db.query(
                insertSql,
                [
                    candidateDbId, application_id || null, job_id || null, candidate_name, email, phone || "N/A", ai_score || 0,
                    interview_date, interview_time, mode, interviewer, interviewer_id || null, interviewer_name || interviewer,
                    round || "Technical Interview", duration || 30, meeting_link || null, status, orgId
                ],
                (err, result) => {
                    if (err) {
                        console.error("[Interview Creation Error]", {
                            message: err.message,
                            name: err.name,
                            stack: err.stack
                        });
                        return res.status(500).json({
                            success: false,
                            message: "Interview Creation Failed",
                            errorCode: "DATABASE_INSERT_FAILED",
                            error: process.env.NODE_ENV === "development" ? err.message : undefined
                        });
                    }

                    const interviewId = result.insertId;

                    // 3. Log scheduling activity
                    const detailText = `Scheduled ${round || 'Technical Interview'} with ${interviewer} on ${interview_date} at ${interview_time}`;
                    const activityAppId = application_id || candidateDbId || null;
                    db.query(
                        "INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (?, ?, 'Interview Scheduled', ?, ?)",
                        [activityAppId, candidate_name, detailText, orgId],
                        (actErr) => {
                            if (actErr) console.error("Failed to log interview schedule activity:", actErr);
                        }
                    );

                    // 4. Progress candidate status to Interview stage in applications (if we have an application_id)
                    if (application_id) {
                        db.query(
                            "UPDATE applications SET status = 'Interview' WHERE id = ? AND organization_id = ?",
                            [application_id, orgId],
                            (statusErr) => {
                                if (statusErr) {
                                    console.error("Failed to progress status to Interview stage:", statusErr);
                                } else {
                                    db.query(
                                        "INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (?, ?, 'Stage Transition', 'Moved to Interview stage (Interview scheduled)', ?)",
                                        [application_id, candidate_name, orgId],
                                        (transErr) => {
                                            if (transErr) console.error("Failed to log transition activity:", transErr);
                                        }
                                    );
                                }
                            }
                        );
                    }

                    // Log Notifications
                    notifyRecruiters(
                        "INTERVIEW_SCHEDULED",
                        "HIGH",
                        "New Interview Scheduled",
                        `Scheduled ${round || 'Technical Interview'} for ${candidate_name} with ${interviewer} on ${interview_date}`
                    );
                    createNotification(
                        email,
                        "INTERVIEW_SCHEDULED",
                        "HIGH",
                        "Interview Scheduled",
                        `Your interview round ${round || 'Technical Interview'} is scheduled on ${interview_date} at ${interview_time}`
                    );

                    res.status(201).json({
                        message: "Interview Scheduled Successfully",
                        interviewId
                    });
                }
            );
        });
    });
};

// GET ALL INTERVIEWS
const getAllInterviews = (req, res) => {
    const { role, organization_id, email, id: userId } = req.user;

    let sql = "";
    const params = [organization_id];

    if (role === "Admin" || role === "HR" || role === "Recruiter") {
        sql = "SELECT * FROM interviews WHERE organization_id = ? ORDER BY id DESC";
    } else if (role === "Hiring Manager") {
        sql = `
            SELECT iv.* FROM interviews iv
            INNER JOIN applications a ON COALESCE(iv.application_id, iv.candidate_id) = a.id
            INNER JOIN job_assignments ja ON a.job_id = ja.job_id
            WHERE iv.organization_id = ? AND ja.user_id = ? AND ja.assigned_role = 'Hiring Manager'
            ORDER BY iv.id DESC
        `;
        params.push(userId);
    } else if (role === "Interviewer") {
        sql = "SELECT * FROM interviews WHERE organization_id = ? AND LOWER(interviewer) = LOWER(?) ORDER BY id DESC";
        params.push(email);
    } else {
        return res.status(403).json({ message: "Access Denied: Invalid role permissions" });
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Fetch Interviews Error:", err);
            return res.status(500).json({ message: "Database Error" });
        }
        res.status(200).json(results || []);
    });
};

// UPDATE STATUS (CANCELLATION / RESCHEDULING)
const updateInterviewStatus = (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    verifyInterviewAccess(id, req, (authErr, iv) => {
        if (authErr) return res.status(403).json({ message: authErr.message });

        Interview.updateInterviewStatus(id, status, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Update Failed" });
            }

            // Log update activity
            const detailText = `Interview status set to ${status}`;
            const updateActivityAppId = iv.application_id || iv.candidate_id || null;
            db.query(
                "INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (?, ?, 'Interview Updated', ?, ?)",
                [updateActivityAppId, iv.candidate_name, detailText, req.user.organization_id],
                (actErr) => {
                    if (actErr) console.error("Failed to insert update activity:", actErr);
                }
            );

            // Log Notifications
            notifyRecruiters(
                "INTERVIEW_RESCHEDULED",
                "HIGH",
                "Interview Booking Updated",
                `Interview status updated to ${status} for candidate ${iv.candidate_name}`
            );
            createNotification(
                iv.email,
                "INTERVIEW_RESCHEDULED",
                "HIGH",
                "Interview Status Updated",
                `Your interview round ${iv.round} status has been updated to ${status}.`
            );

            res.status(200).json({
                message: "Interview Status Updated",
                status
            });
        });
    });
};

// SUBMIT FEEDBACK AND SCORECARD EVALUATIONS
const submitFeedback = (req, res) => {
    const id = req.params.id;
    const { feedback, rating } = req.body;

    if (!feedback || !rating) {
        return res.status(400).json({ message: "Evaluation comments and rating are required." });
    }

    verifyInterviewAccess(id, req, (authErr, iv) => {
        if (authErr) return res.status(403).json({ message: authErr.message });

        // Enforce that only the assigned interviewer can submit feedback (unless Admin)
        if (req.user.role === "Interviewer" && iv.interviewer.toLowerCase() !== req.user.email.toLowerCase()) {
            return res.status(403).json({ message: "Access Denied: You cannot submit feedback for an interview assigned to another member" });
        }

        Interview.submitFeedback(id, feedback, rating, (err, result) => {
            if (err) {
                console.error("Failed to submit feedback:", err);
                return res.status(500).json({ message: "Feedback submission failed" });
            }

            // Log feedback activity
            const detailText = `Submitted evaluation feedback for ${iv.round} (Rating: ${rating}/5)`;
            const feedbackActivityAppId = iv.application_id || iv.candidate_id || null;
            db.query(
                "INSERT INTO activities (application_id, candidate_name, action, details, organization_id) VALUES (?, ?, 'Interview Evaluation', ?, ?)",
                [feedbackActivityAppId, iv.candidate_name, detailText, req.user.organization_id],
                (actErr) => {
                    if (actErr) console.error("Failed to insert feedback activity:", actErr);
                }
            );

            // Broadcast pipeline notification
            notifyRecruiters(
                "FEEDBACK_SUBMITTED",
                "NORMAL",
                "Feedback Evaluation Logged",
                `Scorecard evaluation logged for ${iv.candidate_name} (Rating: ${rating}/5)`
            );

            res.status(200).json({
                message: "Feedback and rating scorecard submitted successfully",
                status: "Completed"
            });
        });
    });
};

const getInterviewsByEmail = (req, res) => {
    const email = req.params.email;

    if (req.user.role === "Candidate" && req.user.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({
            success: false,
            message: "Access Denied: You are not authorized to view interviews for this email"
        });
    }

    if (req.user.role === "Candidate") {
        Interview.getInterviewsByEmail(email, (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }
            res.status(200).json(results || []);
        });
    } else {
        const orgId = req.user.organization_id;
        db.query(
            "SELECT * FROM interviews WHERE email=? AND organization_id=? ORDER BY interview_date ASC",
            [email, orgId],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ message: "Database Error" });
                }
                res.status(200).json(results || []);
            }
        );
    }
};

module.exports = {
    normalizeInterviewPayload,
    createInterview,
    getAllInterviews,
    updateInterviewStatus,
    submitFeedback,
    getInterviewsByEmail
};
