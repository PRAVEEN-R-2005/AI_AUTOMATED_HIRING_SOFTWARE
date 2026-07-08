const express = require("express");
const router = express.Router();
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const { PERMISSIONS } = require("../utils/permissions");
const {
    getMembers,
    updateMemberRole,
    updateMemberStatus,
    removeMember,
    getInvitations,
    createInvitation,
    cancelInvitation,
    resendInvitation,
    validateInvitationToken,
    getInterviewers
} = require("../controllers/teamController");

// Public routes (used during signup/registration)
router.get("/invitations/validate/:token", validateInvitationToken);

// Protected routes (require token validation)
router.get("/members", verifyToken, requirePermission(PERMISSIONS.TEAM_VIEW), getMembers);
router.put("/members/:id/role", verifyToken, requirePermission(PERMISSIONS.TEAM_UPDATE_ROLE), updateMemberRole);
router.put("/members/:id/status", verifyToken, requirePermission(PERMISSIONS.TEAM_DEACTIVATE), updateMemberStatus);
router.delete("/members/:id", verifyToken, requirePermission(PERMISSIONS.TEAM_REMOVE), removeMember);

router.get("/invitations", verifyToken, requirePermission(PERMISSIONS.TEAM_VIEW), getInvitations);
router.post("/invitations", verifyToken, requirePermission(PERMISSIONS.TEAM_INVITE), createInvitation);
router.delete("/invitations/:id", verifyToken, requirePermission(PERMISSIONS.TEAM_REMOVE), cancelInvitation);
router.post("/invitations/:id/resend", verifyToken, requirePermission(PERMISSIONS.TEAM_INVITE), resendInvitation);

router.get("/interviewers", verifyToken, getInterviewers);

module.exports = router;
