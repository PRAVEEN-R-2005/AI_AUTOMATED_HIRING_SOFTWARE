const db = require("../config/db");
const bcrypt = require("bcryptjs");

// GET /api/settings/profile — Get current user profile
const getProfile = (req, res) => {
    const email = req.user.email;
    db.query("SELECT id, name, email, role, created_at FROM users WHERE email = ?", [email], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(rows[0]);
    });
};

// PUT /api/settings/profile — Update name
const updateProfile = (req, res) => {
    const email = req.user.email;
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
    }
    db.query("UPDATE users SET name = ? WHERE email = ?", [name.trim(), email], (err) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        res.status(200).json({ message: "Profile updated successfully" });
    });
};

// PUT /api/settings/change-password
const changePassword = (req, res) => {
    const email = req.user.email;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    db.query("SELECT password FROM users WHERE email = ?", [email], async (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email], (updateErr) => {
            if (updateErr) return res.status(500).json({ message: "Database Error" });
            res.status(200).json({ message: "Password changed successfully" });
        });
    });
};

// GET /api/settings/users — Admin: List all users
const listUsers = (req, res) => {
    db.query("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC", (err, rows) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        res.status(200).json(rows || []);
    });
};

// POST /api/settings/users/invite — Admin: Invite new HR user
const inviteUser = (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
    }
    const userRole = role || "HR";
    db.query("SELECT id FROM users WHERE email = ?", [email], async (err, existing) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        if (existing && existing.length > 0) {
            return res.status(409).json({ message: "A user with this email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, userRole],
            (insertErr, result) => {
                if (insertErr) return res.status(500).json({ message: "Database Error" });
                res.status(201).json({ message: "User invited successfully", userId: result.insertId });
            }
        );
    });
};

// DELETE /api/settings/users/:id — Admin: Delete user
const deleteUser = (req, res) => {
    const id = req.params.id;
    const adminEmail = req.user.email;
    db.query("SELECT email FROM users WHERE id = ?", [id], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        if (rows[0].email === adminEmail) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }
        db.query("DELETE FROM users WHERE id = ?", [id], (delErr) => {
            if (delErr) return res.status(500).json({ message: "Database Error" });
            res.status(200).json({ message: "User deleted successfully" });
        });
    });
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    listUsers,
    inviteUser,
    deleteUser
};
