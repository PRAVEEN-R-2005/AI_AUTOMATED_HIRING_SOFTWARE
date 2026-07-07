const db = require("../config/db");

// Get Top Candidates
const getTopCandidates = (callback) => {
  const sql = `
    SELECT a.id, a.candidate_name AS name, a.email, a.phone, a.status, a.match_score, a.resume_file, a.created_at, 
           j.title AS job_title, a.recruiter_notes, a.rejection_reason
    FROM applications a
    LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
    ORDER BY a.match_score DESC
  `;
  db.query(sql, callback);
};

// Get Candidate By ID
const getCandidateById = (id, callback) => {
  const sql = `
    SELECT a.id, a.candidate_name AS name, a.email, a.phone, a.status, a.match_score, a.resume_file, a.created_at, 
           j.title AS job_title, a.recruiter_notes, a.rejection_reason
    FROM applications a
    LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
    WHERE a.id = ?
  `;
  db.query(sql, [id], callback);
};

// Get All Candidates
const getAllCandidates = (callback) => {
  const sql = `
    SELECT a.id, a.candidate_name AS name, a.email, a.phone, a.status, a.match_score, a.resume_file, a.created_at, 
           j.title AS job_title, a.recruiter_notes, a.rejection_reason
    FROM applications a
    LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
    ORDER BY a.id DESC
  `;
  db.query(sql, callback);
};

module.exports = {
  getTopCandidates,
  getCandidateById,
  getAllCandidates
};