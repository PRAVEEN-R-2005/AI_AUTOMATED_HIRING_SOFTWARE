const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
    getNotifications,
    getUnreadCount,
    markRead,
    markAllRead
} = require("../controllers/notificationController");

// GET /api/notifications
router.get("/", verifyToken, getNotifications);

// GET /api/notifications/unread-count
router.get("/unread-count", verifyToken, getUnreadCount);

// PUT /api/notifications/read/:id
router.put("/read/:id", verifyToken, markRead);

// PUT /api/notifications/read-all
router.put("/read-all", verifyToken, markAllRead);

module.exports = router;
