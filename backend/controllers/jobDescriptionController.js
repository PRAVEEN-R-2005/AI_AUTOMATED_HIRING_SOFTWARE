const JobDescription = require("../models/jobDescriptionModel");
const db = require("../config/db");

// Helper check to verify recruiter ownership and organization matching
const verifyOwnership = (id, req, callback) => {
  JobDescription.getJDById(id, (err, results) => {
    if (err) return callback(err, null);
    if (!results || results.length === 0) return callback(null, { exists: false });
    
    const job = results[0];
    
    // Organization isolation check
    if (job.organization_id && job.organization_id !== req.user.organization_id) {
      return callback(null, { exists: true, authorized: false });
    }
    
    const isOwner = job.created_by === req.user.email;
    const isAdmin = req.user.role === "Admin";
    
    if (!isOwner && !isAdmin) {
      return callback(null, { exists: true, authorized: false });
    }
    return callback(null, { exists: true, authorized: true, job });
  });
};

// ======================================
// CREATE JD
// ======================================
const createJD = (req, res) => {
  const { title, skills, experience, salary, location, description } = req.body;
  const created_by = req.user.email; // Extracted securely from jwt token
  const organization_id = req.user.organization_id;

  const sql = `
    INSERT INTO job_descriptions (title, skills, experience, salary, location, description, created_by, organization_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [title, skills, experience, salary, location, description, created_by, organization_id], (err, result) => {
    if (err) {
      console.error("Create JD Error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    res.status(201).json({ message: "Job Description Created Successfully" });
  });
};

// ======================================
// GET ALL JD
// ======================================
const getAllJD = (req, res) => {
  const { role, organization_id, id: userId } = req.user;

  if (role === "Interviewer") {
    return res.status(403).json({ message: "Access Denied: Interviewers cannot view the jobs list" });
  }

  let sql = "";
  const params = [organization_id];

  if (role === "Admin" || role === "HR" || role === "Recruiter") {
    sql = "SELECT * FROM job_descriptions WHERE organization_id = ? ORDER BY jd_id DESC";
  } else if (role === "Hiring Manager") {
    sql = `
      SELECT jd.* FROM job_descriptions jd
      INNER JOIN job_assignments ja ON jd.jd_id = ja.job_id
      WHERE jd.organization_id = ? AND ja.user_id = ? AND ja.assigned_role = 'Hiring Manager'
      ORDER BY jd.jd_id DESC
    `;
    params.push(userId);
  } else {
    return res.status(403).json({ message: "Access Denied: Invalid role permissions" });
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Fetch JDs Error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    res.status(200).json(results || []);
  });
};

// ======================================
// UPDATE JD
// ======================================
const updateJD = (req, res) => {
  const id = req.params.id;
  const { title, skills, experience, salary, location, description } = req.body;

  verifyOwnership(id, req, (err, auth) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    if (!auth.exists) return res.status(404).json({ message: "Job Description Not Found" });
    if (!auth.authorized) {
      return res.status(403).json({ message: "Access Denied: Unauthorized to modify this resource" });
    }

    JobDescription.updateJD(
      id,
      title,
      skills,
      experience,
      salary,
      location,
      description,
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Update Failed" });
        }
        res.status(200).json({ message: "Job Description Updated Successfully" });
      }
    );
  });
};

// ======================================
// DELETE JD
// ======================================
const deleteJD = (req, res) => {
  const id = req.params.id;

  verifyOwnership(id, req, (err, auth) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    if (!auth.exists) return res.status(404).json({ message: "Job Description Not Found" });
    if (!auth.authorized) {
      return res.status(403).json({ message: "Access Denied: Unauthorized to delete this resource" });
    }

    JobDescription.deleteJD(id, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Delete Failed" });
      }
      res.status(200).json({ message: "Job Description Deleted" });
    });
  });
};

// ======================================
// PUBLISH JD
// ======================================
const publishJD = (req, res) => {
  const id = req.params.id;

  verifyOwnership(id, req, (err, auth) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    if (!auth.exists) return res.status(404).json({ message: "Job Description Not Found" });
    if (!auth.authorized) {
      return res.status(403).json({ message: "Access Denied: Unauthorized to publish this resource" });
    }

    JobDescription.publishJD(id, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Publish Failed" });
      }
      res.status(200).json({ message: "Published" });
    });
  });
};

// ======================================
// CLOSE JD
// ======================================
const closeJD = (req, res) => {
  const id = req.params.id;

  verifyOwnership(id, req, (err, auth) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    if (!auth.exists) return res.status(404).json({ message: "Job Description Not Found" });
    if (!auth.authorized) {
      return res.status(403).json({ message: "Access Denied: Unauthorized to close this resource" });
    }

    JobDescription.closeJD(id, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Close Failed" });
      }
      res.status(200).json({ message: "Closed" });
    });
  });
};

// ======================================
// GET OPEN JD (Public Candidates view)
// ======================================
const getOpenJD = (req, res) => {
  JobDescription.getOpenJD((err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database Error" });
    }
    res.status(200).json(results);
  });
};

module.exports = {
  createJD,
  getAllJD,
  updateJD,
  deleteJD,
  publishJD,
  closeJD,
  getOpenJD
};
