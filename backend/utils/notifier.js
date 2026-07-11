const db = require("../config/db");

/**
 * Inserts a notification record into the database for a specific user role or email.
 */
const createNotification = (email, type, priority, title, message) => {
    const sql = `
        INSERT INTO notifications (user_email, type, priority, title, message)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [email || "system@hiring.com", type, priority || "NORMAL", title, message], (err) => {
        if (err) console.error("Failed to create backend notification:", err);
    });
};

/**
 * Broadcasts a notification to all HR and Admin users (recruiters) in a specific organization.
 */
const notifyRecruiters = (organizationId, type, priority, title, message) => {
    if (!organizationId) {
        console.warn("notifyRecruiters called without organizationId");
        return;
    }
    const sql = `
        SELECT u.email FROM users u
        INNER JOIN memberships m ON u.id = m.user_id
        WHERE m.organization_id = ?
          AND m.status = 'ACTIVE'
          AND (m.role IN ('HR', 'Admin') OR u.role IN ('HR', 'Admin'))
    `;
    db.query(sql, [organizationId], (err, rows) => {
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
