
const Application = require("../models/applicationModel");
const db = require("../config/db");
const { notifyRecruiters } = require("../utils/notifier");


// ====================================
// CREATE APPLICATION
// ====================================

const createApplication = (req, res) => {

    const {

        candidate_name,
        email,
        phone,
        job_id

    }

    = req.body;


    const resume_file = req.file.filename;


    Application.createApplication(

        candidate_name,
        email,
        phone,
        job_id,
        resume_file,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(201).json({

                message:

                "Application Submitted Successfully",
                applicationId:
                result.insertId

            });

        }

    );

};


// ====================================
// GET ALL APPLICATIONS
// ====================================

const getApplications = (req, res) => {

    Application.getApplications(

        (err, results) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json(

                results

            );

        }

    );

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

    Application.getApplicationByEmail(

        email,

        (err, results) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            // Mask sensitive internal properties (recruiter notes, rejection reason) for candidates
            if (req.user.role === "Candidate") {
                const masked = results.map(app => {
                    const { recruiter_notes, rejection_reason, ...rest } = app;
                    return rest;
                });
                return res.status(200).json(masked);
            }

            res.status(200).json(

                results

            );

        }

    );

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

    db.query(
        "SELECT candidate_name, status FROM applications WHERE id = ?",
        [id],
        (findErr, rows) => {
            if (findErr || !rows || rows.length === 0) {
                return res.status(404).json({ message: "Application not found" });
            }

            const app = rows[0];
            const oldStatus = app.status;

            Application.updateApplicationStatus(
                id,
                status,
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: "Database Error" });
                    }

                    db.query(
                        "INSERT INTO activities (application_id, candidate_name, action, details) VALUES (?, ?, 'Stage Transition', ?)",
                        [id, app.candidate_name, `Moved from ${oldStatus} to ${status}`],
                        (actErr) => {
                            if (actErr) console.error("Failed to insert transition activity:", actErr);
                            
                            // Broadcast pipeline notification
                            notifyRecruiters(
                                "PIPELINE_STAGE_CHANGED",
                                "NORMAL",
                                "Pipeline Stage Transition",
                                `Candidate ${app.candidate_name} moved from ${oldStatus} to ${status}`
                            );

                            res.status(200).json({
                                message: "Status Updated",
                                status
                            });
                        }
                    );
                }
            );
        }
    );
};


// ====================================
// SHORTLIST APPLICATION
// ====================================
const shortlistApplication = (req, res) => {
    const id = req.params.id;

    db.query(
        "SELECT candidate_name FROM applications WHERE id = ?",
        [id],
        (findErr, rows) => {
            if (findErr || !rows || rows.length === 0) {
                return res.status(404).json({ message: "Application not found" });
            }
            const app = rows[0];

            Application.shortlistApplication(
                id,
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: "Database Error" });
                    }

                    db.query(
                        "INSERT INTO activities (application_id, candidate_name, action, details) VALUES (?, ?, 'Shortlist', 'Candidate shortlisted for interview stages')",
                        [id, app.candidate_name],
                        (actErr) => {
                            if (actErr) console.error("Failed to insert shortlist activity:", actErr);
                            
                            // Broadcast pipeline notification
                            notifyRecruiters(
                                "PIPELINE_STAGE_CHANGED",
                                "HIGH",
                                "Candidate Shortlisted",
                                `Candidate ${app.candidate_name} has been shortlisted for interview rounds.`
                            );

                            res.status(200).json({
                                message: "Candidate Shortlisted"
                            });
                        }
                    );
                }
            );
        }
    );
};


// ====================================
// REJECT APPLICATION
// ====================================
const rejectApplication = (req, res) => {
    const id = req.params.id;
    const { reason } = req.body;

    db.query(
        "SELECT candidate_name FROM applications WHERE id = ?",
        [id],
        (findErr, rows) => {
            if (findErr || !rows || rows.length === 0) {
                return res.status(404).json({ message: "Application not found" });
            }
            const app = rows[0];

            Application.rejectApplication(
                id,
                reason || null,
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: "Database Error" });
                    }

                    db.query(
                        "INSERT INTO activities (application_id, candidate_name, action, details) VALUES (?, ?, 'Rejection', ?)",
                        [id, app.candidate_name, reason || 'No rejection reason logged'],
                        (actErr) => {
                            if (actErr) console.error("Failed to insert rejection activity:", actErr);
                            
                            // Broadcast pipeline notification
                            notifyRecruiters(
                                "CANDIDATE_REJECTED",
                                "NORMAL",
                                "Candidate Rejected",
                                `Candidate ${app.candidate_name} marked Rejected. Reason: ${reason || 'None provided'}`
                            );

                            res.status(200).json({
                                message: "Candidate Rejected"
                            });
                        }
                    );
                }
            );
        }
    );
};


// ====================================
// UPDATE NOTES
// ====================================

const updateNotes = (req, res) => {

    const id = req.params.id;
    const { notes } = req.body;

    Application.updateNotes(

        id,
        notes || null,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json({

                message:

                "Notes Updated"

            });

        }

    );

};


// ====================================
// UPDATE MATCH SCORE
// ====================================

const updateMatchScore = (req, res) => {

    const id = req.params.id;

    const {

        match_score

    }

    = req.body;


    Application.updateMatchScore(

        id,

        match_score,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json({

                message:

                "Match Score Updated Successfully"

            });

        }

    );

};


// ====================================
// EXPORTS
// ====================================

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
