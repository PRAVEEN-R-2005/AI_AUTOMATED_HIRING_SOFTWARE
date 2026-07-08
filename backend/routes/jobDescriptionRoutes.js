const express = require("express");
const router = express.Router();
const { verifyToken, requireRole, requirePermission } = require("../middleware/authMiddleware");
const { PERMISSIONS } = require("../utils/permissions");

const {
    createJD,
    getAllJD,
    updateJD,
    deleteJD,
    publishJD,
    closeJD,
    getOpenJD
} = require("../controllers/jobDescriptionController");

const {
    getJobTeam,
    assignTeamMember,
    unassignTeamMember
} = require("../controllers/jobAssignmentController");

// ======================================
// CREATE JD
// ======================================
router.post(
    "/",
    verifyToken,
    requirePermission(PERMISSIONS.JOB_CREATE),
    createJD
);

// ======================================
// GET ALL JD
// ======================================
router.get(
    "/",
    verifyToken,
    requirePermission(PERMISSIONS.JOB_VIEW),
    getAllJD
);

// ======================================
// UPDATE JD
// ======================================
router.put(
    "/:id",
    verifyToken,
    requirePermission(PERMISSIONS.JOB_UPDATE),
    updateJD
);

// ======================================
// DELETE JD
// ======================================
router.delete(
    "/:id",
    verifyToken,
    requirePermission(PERMISSIONS.JOB_DELETE),
    deleteJD
);

// ======================================
// PUBLISH JD
// ======================================
router.put(
    "/publish/:id",
    verifyToken,
    requirePermission(PERMISSIONS.JOB_PUBLISH),
    publishJD
);

// ======================================
// CLOSE JD
// ======================================
router.put(
    "/close/:id",
    verifyToken,
    requirePermission(PERMISSIONS.JOB_PUBLISH),
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

// ======================================
// HIRING TEAM ASSIGNMENTS
// ======================================
router.get(
    "/:id/team",
    verifyToken,
    requirePermission(PERMISSIONS.JOB_VIEW),
    getJobTeam
);
router.post(
    "/:id/team",
    verifyToken,
    requirePermission(PERMISSIONS.JOB_ASSIGN_TEAM),
    assignTeamMember
);
router.delete(
    "/:id/team/:userId",
    verifyToken,
    requirePermission(PERMISSIONS.JOB_ASSIGN_TEAM),
    unassignTeamMember
);

module.exports = router;
