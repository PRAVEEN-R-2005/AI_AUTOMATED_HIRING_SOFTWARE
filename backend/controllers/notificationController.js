const db = require("../config/db");

// Get all in-app notifications for authenticated user
const getNotifications = (req, res) => {
    const email = req.user.email;
    db.query(
        "SELECT * FROM notifications WHERE user_email = ? ORDER BY id DESC LIMIT 100",
        [email],
        (err, results) => {
            if (err) {
                console.error("Failed to query notifications:", err);
                return res.status(500).json({ message: "Database Error" });
            }
            res.status(200).json(results || []);
        }
    );
};

// Count unread notifications
const getUnreadCount = (req, res) => {
    const email = req.user.email;
    db.query(
        "SELECT COUNT(*) as count FROM notifications WHERE user_email = ? AND is_read = FALSE",
        [email],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }
            res.status(200).json({ count: results[0]?.count || 0 });
        }
    );
};

// Mark single notification read
const markRead = (req, res) => {
    const id = req.params.id;
    const email = req.user.email;
    db.query(
        "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_email = ?",
        [id, email],
        (err) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }
            res.status(200).json({ message: "Notification marked read" });
        }
    );
};

// Mark all notifications read
const markAllRead = (req, res) => {
    const email = req.user.email;
    db.query(
        "UPDATE notifications SET is_read = TRUE WHERE user_email = ?",
        [email],
        (err) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }
            res.status(200).json({ message: "All notifications marked read" });
        }
    );
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markRead,
    markAllRead
};
