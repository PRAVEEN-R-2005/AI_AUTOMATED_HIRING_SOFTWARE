const Interview = require("../models/interviewModel");
const db = require("../config/db");
const { notifyRecruiters, createNotification } = require("../utils/notifier");

// CREATE INTERVIEW WITH CONFLICT CHECKING
const createInterview = (req, res) => {
    const {
        candidate_id,
        candidate_name,
        email,
        phone,
        ai_score,
        interview_date,
        interview_time,
        mode,
        interviewer,
        round,
        duration,
        meeting_link
    } = req.body;

    if (!interviewer || !interview_date || !interview_time) {
        return res.status(400).json({ message: "Interviewer, date, and time are required." });
    }

    // 1. Conflict detection for the assigned interviewer
    const conflictSql = `
        SELECT * FROM interviews 
        WHERE interviewer = ? 
          AND interview_date = ? 
          AND interview_time = ? 
          AND status != 'Cancelled'
    `;
    db.query(conflictSql, [interviewer, interview_date, interview_time], (err, conflicts) => {
        if (err) {
            console.error("Conflict check failed:", err);
            return res.status(500).json({ message: "Conflict validation check error" });
        }

        if (conflicts && conflicts.length > 0) {
            return res.status(400).json({
                message: `Scheduling conflict: Interviewer ${interviewer} is already booked for another interview on ${interview_date} at ${interview_time}.`
            });
        }

        // 2. Create interview record
        Interview.createInterview(
            candidate_id,
            candidate_name,
            email,
            phone,
            ai_score,
            interview_date,
            interview_time,
            mode,
            interviewer,
            round,
            duration,
            meeting_link,
            (err, result) => {
                if (err) {
                    console.error("Failed to create interview record:", err);
                    return res.status(500).json({ message: "Interview Creation Failed" });
                }

                // 3. Log scheduling activity
                const detailText = `Scheduled ${round || 'Technical Interview'} with ${interviewer} on ${interview_date} at ${interview_time}`;
                db.query(
                    "INSERT INTO activities (application_id, candidate_name, action, details) VALUES (?, ?, 'Interview Scheduled', ?)",
                    [candidate_id, candidate_name, detailText],
                    (actErr) => {
                        if (actErr) console.error("Failed to log interview schedule activity:", actErr);
                    }
                );

                // 4. Progress candidate status to Interview stage in applications
                db.query(
                    "UPDATE applications SET status = 'Interview' WHERE id = ?",
                    [candidate_id],
                    (statusErr) => {
                        if (statusErr) {
                            console.error("Failed to progress status to Interview stage:", statusErr);
                        } else {
                            db.query(
                                "INSERT INTO activities (application_id, candidate_name, action, details) VALUES (?, ?, 'Stage Transition', 'Moved to Interview stage (Interview scheduled)')",
                                [candidate_id, candidate_name],
                                (transErr) => {
                                    if (transErr) console.error("Failed to log transition activity:", transErr);
                                }
                            );
                        }
                    }
                );

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
                    interviewId: result.insertId
                });
            }
        );
    });
};

// GET ALL INTERVIEWS
const getAllInterviews = (req, res) => {
    Interview.getAllInterviews((err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database Error" });
        }
        res.status(200).json(results);
    });
};

// UPDATE STATUS (CANCELLATION / RESCHEDULING)
const updateInterviewStatus = (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    db.query("SELECT * FROM interviews WHERE id = ?", [id], (findErr, rows) => {
        if (findErr || !rows || rows.length === 0) {
            return res.status(404).json({ message: "Interview not found" });
        }
        const iv = rows[0];

        Interview.updateInterviewStatus(id, status, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Update Failed" });
            }

            // Log update activity
            const detailText = `Interview status set to ${status}`;
            db.query(
                "INSERT INTO activities (application_id, candidate_name, action, details) VALUES (?, ?, 'Interview Updated', ?)",
                [iv.candidate_id, iv.candidate_name, detailText],
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

    db.query("SELECT * FROM interviews WHERE id = ?", [id], (findErr, rows) => {
        if (findErr || !rows || rows.length === 0) {
            return res.status(404).json({ message: "Interview record not found" });
        }
        const iv = rows[0];

        Interview.submitFeedback(id, feedback, rating, (err, result) => {
            if (err) {
                console.error("Failed to submit feedback:", err);
                return res.status(500).json({ message: "Feedback submission failed" });
            }

            // Log feedback activity
            const detailText = `Submitted evaluation feedback for ${iv.round} (Rating: ${rating}/5)`;
            db.query(
                "INSERT INTO activities (application_id, candidate_name, action, details) VALUES (?, ?, 'Interview Evaluation', ?)",
                [iv.candidate_id, iv.candidate_name, detailText],
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

    Interview.getInterviewsByEmail(email, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database Error" });
        }
        res.status(200).json(results);
    });
};

module.exports = {
    createInterview,
    getAllInterviews,
    updateInterviewStatus,
    submitFeedback,
    getInterviewsByEmail
};
