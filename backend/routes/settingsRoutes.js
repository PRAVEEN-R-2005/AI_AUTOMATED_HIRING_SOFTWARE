const express = require("express");
const router = express.Router();
const { verifyToken, requireRole, requirePermission } = require("../middleware/authMiddleware");
const {
    getProfile,
    updateProfile,
    changePassword,
    getOrganization,
    updateOrganization,
    getAuditLogs,
    getSystemInfo,
    listUsers,
    inviteUser,
    deleteUser
} = require("../controllers/settingsController");

// Profile routes (any authenticated user)
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);

// Organization settings (all workspace members can read, only Admin can edit)
router.get("/organization", verifyToken, getOrganization);
router.put("/organization", verifyToken, requirePermission("ORGANIZATION_UPDATE"), updateOrganization);

// System logs and diagnostic endpoints (Admin only)
router.get("/audit-logs", verifyToken, requirePermission("AUDIT_LOG_VIEW"), getAuditLogs);
router.get("/system-info", verifyToken, requirePermission("SYSTEM_INFO_VIEW"), getSystemInfo);

// Legacy admin user management routes
router.get("/users", verifyToken, requireRole(["Admin"]), listUsers);
router.post("/users/invite", verifyToken, requireRole(["Admin"]), inviteUser);
router.delete("/users/:id", verifyToken, requireRole(["Admin"]), deleteUser);

module.exports = router;
