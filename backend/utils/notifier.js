const db = require("../config/db");

/**
 * Inserts a notification record into the database for a specific user role or email.
 */
const createNotification = (email, type, priority, title, message) => {
    const sql = `
        INSERT INTO notifications (user_email, type, priority, title, message)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [email, type, priority || "NORMAL", title, message], (err) => {
        if (err) console.error("Failed to create backend notification:", err);
    });
};

/**
 * Broadcasts a notification to all HR and Admin users (recruiters).
 */
const notifyRecruiters = (type, priority, title, message) => {
    db.query("SELECT email FROM users WHERE role IN ('HR', 'Admin')", (err, rows) => {
        if (err || !rows) return;
        rows.forEach(user => {
            createNotification(user.email, type, priority, title, message);
        });
    });
};

module.exports = {
    createNotification,
    notifyRecruiters
};
