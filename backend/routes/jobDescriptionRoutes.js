const express = require("express");

const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {
    createJD,
    getAllJD,
    updateJD,
    deleteJD,
    publishJD,
    closeJD,
    getOpenJD
} = require("../controllers/jobDescriptionController");

// ======================================
// CREATE JD
// ======================================
router.post(
    "/",
    verifyToken,
    requireRole(["Admin", "HR"]),
    createJD
);

// ======================================
// GET ALL JD
// ======================================
router.get(
    "/",
    verifyToken,
    requireRole(["Admin", "HR"]),
    getAllJD
);

// ======================================
// UPDATE JD
// ======================================
router.put(
    "/:id",
    verifyToken,
    requireRole(["Admin", "HR"]),
    updateJD
);

// ======================================
// DELETE JD
// ======================================
router.delete(
    "/:id",
    verifyToken,
    requireRole(["Admin", "HR"]),
    deleteJD
);

// ======================================
// PUBLISH JD
// ======================================
router.put(
    "/publish/:id",
    verifyToken,
    requireRole(["Admin", "HR"]),
    publishJD
);

// ======================================
// CLOSE JD
// ======================================
router.put(
    "/close/:id",
    verifyToken,
    requireRole(["Admin", "HR"]),
    closeJD
);

// ======================================
// GET OPEN JD (Candidate view)
// ======================================
router.get(
    "/open",
    verifyToken,
    requireRole(["Candidate", "HR", "Admin"]),
    getOpenJD
);

module.exports = router;
