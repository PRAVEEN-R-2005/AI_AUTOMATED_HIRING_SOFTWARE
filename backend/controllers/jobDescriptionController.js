const JobDescription = require("../models/jobDescriptionModel");

// Helper check to verify recruiter ownership
const verifyOwnership = (id, req, callback) => {
  JobDescription.getJDById(id, (err, results) => {
    if (err) return callback(err, null);
    if (!results || results.length === 0) return callback(null, { exists: false });
    
    const job = results[0];
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

  JobDescription.createJD(
    title,
    skills,
    experience,
    salary,
    location,
    description,
    created_by,
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Database Error" });
      }
      res.status(201).json({ message: "Job Description Created Successfully" });
    }
  );
};

// ======================================
// GET ALL JD
// ======================================
const getAllJD = (req, res) => {
  const filterEmail = req.user.role === "Admin" ? null : req.user.email;
  JobDescription.getAllJD(filterEmail, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database Error" });
    }
    res.status(200).json(results);
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
      return res.status(403).json({ message: "Access Denied: You do not own this job posting" });
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
      return res.status(403).json({ message: "Access Denied: You do not own this job posting" });
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
      return res.status(403).json({ message: "Access Denied: You do not own this job posting" });
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
      return res.status(403).json({ message: "Access Denied: You do not own this job posting" });
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
