const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
    getProfile,
    updateProfile,
    changePassword,
    listUsers,
    inviteUser,
    deleteUser
} = require("../controllers/settingsController");

// Profile routes (any authenticated user)
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);

// Admin user management routes
router.get("/users", verifyToken, requireRole(["Admin"]), listUsers);
router.post("/users/invite", verifyToken, requireRole(["Admin"]), inviteUser);
router.delete("/users/:id", verifyToken, requireRole(["Admin"]), deleteUser);

module.exports = router;
