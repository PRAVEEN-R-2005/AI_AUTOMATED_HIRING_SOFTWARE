const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {
    createInterview,
    getAllInterviews,
    updateInterviewStatus,
    getInterviewsByEmail,
    submitFeedback
} = require("../controllers/interviewController");

// CREATE INTERVIEW
// POST /api/interviews
router.post(
    "/",
    verifyToken,
    requireRole(["HR", "Admin"]),
    createInterview
);

// GET ALL INTERVIEWS
// GET /api/interviews/all
router.get(
    "/all",
    verifyToken,
    requireRole(["HR", "Admin"]),
    getAllInterviews
);

// GET INTERVIEWS BY EMAIL
// GET /api/interviews/email/:email
router.get(
    "/email/:email",
    verifyToken,
    requireRole(["Candidate", "HR", "Admin"]),
    getInterviewsByEmail
);

// UPDATE STATUS
// PUT /api/interviews/status/:id
router.put(
    "/status/:id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    updateInterviewStatus
);

// SUBMIT FEEDBACK AND SCORECARD
// PUT /api/interviews/feedback/:id
router.put(
    "/feedback/:id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    submitFeedback
);

module.exports = router;
