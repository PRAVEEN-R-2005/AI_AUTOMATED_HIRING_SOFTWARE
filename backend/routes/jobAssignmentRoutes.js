const express = require("express");
const router = express.Router();
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const { PERMISSIONS } = require("../utils/permissions");
const {
    getJobTeam,
    assignTeamMember,
    unassignTeamMember
} = require("../controllers/jobAssignmentController");

// Hiring team assignments routes
router.get("/:id/team", verifyToken, requirePermission(PERMISSIONS.JOB_VIEW), getJobTeam);
router.post("/:id/team", verifyToken, requirePermission(PERMISSIONS.JOB_ASSIGN_TEAM), assignTeamMember);
router.delete("/:id/team/:userId", verifyToken, requirePermission(PERMISSIONS.JOB_ASSIGN_TEAM), unassignTeamMember);

module.exports = router;
