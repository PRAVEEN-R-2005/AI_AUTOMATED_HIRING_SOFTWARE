const HR = require("../models/hrModel");
const db = require("../config/db");

// Helper to get SQL scoping criteria based on organization and roles
const getCandidateScope = (req) => {
    const { role, organization_id, email, id: userId } = req.user;
    let whereClause = "a.organization_id = ?";
    const params = [organization_id];

    if (role === "Admin" || role === "HR" || role === "Recruiter") {
        // No additional filters
    } else if (role === "Hiring Manager") {
        whereClause += `
            AND a.job_id IN (
                SELECT job_id FROM job_assignments 
                WHERE user_id = ? AND assigned_role = 'Hiring Manager'
            )
        `;
        params.push(userId);
    } else if (role === "Interviewer") {
        whereClause += `
            AND a.id IN (
                SELECT candidate_id FROM interviews 
                WHERE organization_id = ? AND interviewer = ?
            )
        `;
        params.push(organization_id, email);
    } else {
        // Block other roles
        whereClause += " AND 1=0";
    }

    return { whereClause, params };
};

// Top Candidates
const getTopCandidates = (req, res) => {
    const { whereClause, params } = getCandidateScope(req);
    const sql = `
        SELECT a.id, a.candidate_name AS name, a.email, a.phone, a.status, a.match_score, a.resume_file, a.created_at, 
               j.title AS job_title, a.recruiter_notes, a.rejection_reason
        FROM applications a
        LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
        WHERE ${whereClause}
        ORDER BY a.match_score DESC
    `;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Fetch Top Candidates Error:", err);
            return res.status(500).json({ message: "Error" });
        }
        res.status(200).json(results || []);
    });
};

// Candidate By ID
const getCandidateById = (req, res) => {
    const id = req.params.id;
    const { role, organization_id, email, id: userId } = req.user;

    // Check if the user is authorized to view this specific candidate
    let sql = `
        SELECT a.id, a.candidate_name AS name, a.email, a.phone, a.status, a.match_score, a.resume_file, a.created_at, 
               j.title AS job_title, a.recruiter_notes, a.rejection_reason, a.job_id
        FROM applications a
        LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
        WHERE a.id = ? AND a.organization_id = ?
    `;
    const params = [id, organization_id];

    db.query(sql, params, (err, results) => {
        if (err || !results || results.length === 0) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        const candidate = results[0];

        // Specific role validation checks
        if (role === "Hiring Manager") {
            const assignmentCheck = "SELECT id FROM job_assignments WHERE job_id = ? AND user_id = ? AND assigned_role = 'Hiring Manager'";
            db.query(assignmentCheck, [candidate.job_id, userId], (checkErr, checkRows) => {
                if (checkErr || !checkRows || checkRows.length === 0) {
                    return res.status(403).json({ message: "Access Denied: You are not assigned to this job" });
                }
                res.status(200).json(results);
            });
        } else if (role === "Interviewer") {
            // Check if there is an interview scheduled with this interviewer for this candidate
            const interviewCheck = "SELECT id FROM interviews WHERE candidate_id = ? AND interviewer = ? AND organization_id = ?";
            db.query(interviewCheck, [id, email, organization_id], (checkErr, checkRows) => {
                if (checkErr || !checkRows || checkRows.length === 0) {
                    return res.status(403).json({ message: "Access Denied: You do not have scheduled interviews with this candidate" });
                }
                // Mask recruiter notes and other interviewer feedback for privacy
                const maskedCandidate = { ...candidate, recruiter_notes: null };
                res.status(200).json([maskedCandidate]);
            });
        } else {
            res.status(200).json(results);
        }
    });
};

// All Candidates
const getAllCandidates = (req, res) => {
    const { whereClause, params } = getCandidateScope(req);
    const sql = `
        SELECT a.id, a.candidate_name AS name, a.email, a.phone, a.status, a.match_score, a.resume_file, a.created_at, 
               j.title AS job_title, a.recruiter_notes, a.rejection_reason
        FROM applications a
        LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
        WHERE ${whereClause}
        ORDER BY a.id DESC
    `;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Fetch All Candidates Error:", err);
            return res.status(500).json({ message: "Error" });
        }
        res.status(200).json(results || []);
    });
};

// Get Pipeline Activity Log
const getActivities = (req, res) => {
    const orgId = req.user.organization_id;
    const sql = `
        SELECT * FROM activities 
        WHERE organization_id = ?
        ORDER BY id DESC 
        LIMIT 50
    `;
    db.query(sql, [orgId], (err, results) => {
        if (err) {
            console.error("Failed to query activities:", err);
            return res.status(500).json({ message: "Database Error" });
        }
        res.status(200).json(results || []);
    });
};

module.exports = {
    getTopCandidates,
    getCandidateById,
    getAllCandidates,
    getActivities
};