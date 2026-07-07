const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {
    createApplication,
    getApplications,
    getApplicationByEmail,
    updateApplicationStatus,
    shortlistApplication,
    rejectApplication,
    updateNotes,
    updateMatchScore
} = require("../controllers/applicationController");

// ====================================
// CREATE APPLICATION
// POST /api/applications
// ====================================
router.post(
    "/",
    verifyToken,
    requireRole(["Candidate", "HR", "Admin"]),
    upload.single("resume_file"),
    createApplication
);

// ====================================
// GET ALL APPLICATIONS
// GET /api/applications/all
// ====================================
router.get(
    "/all",
    verifyToken,
    requireRole(["HR", "Admin"]),
    getApplications
);

// ====================================
// GET APPLICATIONS BY EMAIL
// GET /api/applications/email/:email
// ====================================
router.get(
    "/email/:email",
    verifyToken,
    requireRole(["Candidate", "HR", "Admin"]),
    getApplicationByEmail
);

// ====================================
// UPDATE STATUS
// PUT /api/applications/status/:id
// ====================================
router.put(
    "/status/:id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    updateApplicationStatus
);

// ====================================
// SHORTLIST APPLICATION
// PUT /api/applications/shortlist/:id
// ====================================
router.put(
    "/shortlist/:id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    shortlistApplication
);

// ====================================
// REJECT APPLICATION
// PUT /api/applications/reject/:id
// ====================================
router.put(
    "/reject/:id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    rejectApplication
);

// ====================================
// UPDATE NOTES
// PUT /api/applications/notes/:id
// ====================================
router.put(
    "/notes/:id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    updateNotes
);

// ====================================
// UPDATE MATCH SCORE
// PUT /api/applications/score/:id
// ====================================
router.put(
    "/score/:id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    updateMatchScore
);

module.exports = router;
