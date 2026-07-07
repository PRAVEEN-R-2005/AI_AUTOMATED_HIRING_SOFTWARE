const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {
    getTopCandidates,
    getCandidateById,
    getAllCandidates,
    getActivities
} = require("../controllers/hrController");

// GET /api/hr/top-candidates
router.get(
    "/top-candidates",
    verifyToken,
    requireRole(["HR", "Admin"]),
    getTopCandidates
);

// GET /api/hr/candidate/:id
router.get(
    "/candidate/:id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    getCandidateById
);

// GET /api/hr/all-candidates
router.get(
    "/all-candidates",
    verifyToken,
    requireRole(["HR", "Admin"]),
    getAllCandidates
);

// GET /api/hr/activities
router.get(
    "/activities",
    verifyToken,
    requireRole(["HR", "Admin"]),
    getActivities
);

module.exports = router;