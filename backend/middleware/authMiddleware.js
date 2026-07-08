const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { hasPermission } = require("../utils/permissions");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access Denied: No Token Provided"
        });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Configuration Error: Secure token configuration missing."
            });
        }
        const decoded = jwt.verify(
            token,
            jwtSecret
        );
        
        // Fetch current active user state and membership from database in real-time
        const sql = `
            SELECT u.id, u.email, u.role as global_role, m.organization_id, m.role as org_role, m.status as membership_status
            FROM users u
            LEFT JOIN memberships m ON u.id = m.user_id
            WHERE u.id = ?
        `;
        db.query(sql, [decoded.id], (err, rows) => {
            if (err || !rows || rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Access Denied: User not found"
                });
            }
            
            const user = rows[0];
            
            // If user is not a Candidate and has no membership or has inactive membership status
            if (user.global_role !== 'Candidate') {
                if (!user.organization_id || user.membership_status !== 'ACTIVE') {
                    return res.status(403).json({
                        success: false,
                        message: "Access Denied: Your account is deactivated or has no active workspace."
                    });
                }
            }
            
            req.user = {
                id: user.id,
                email: user.email,
                role: user.org_role || user.global_role, // Organization role overrides global role
                organization_id: user.organization_id,
                global_role: user.global_role
            };
            next();
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Access Denied: Invalid or Expired Token"
        });
    }
};

const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Access Denied: Not Authenticated"
            });
        }

        // Support HR and Recruiter as aliases
        let effectiveUserRole = req.user.role;
        if (effectiveUserRole === "HR" && allowedRoles.includes("Recruiter")) {
            effectiveUserRole = "Recruiter";
        }
        if (effectiveUserRole === "Recruiter" && allowedRoles.includes("HR")) {
            effectiveUserRole = "HR";
        }

        const match = allowedRoles.includes(effectiveUserRole) || allowedRoles.includes(req.user.role);

        if (!match) {
            return res.status(403).json({
                success: false,
                message: "Access Denied: Unauthorized Role"
            });
        }

        next();
    };
};

const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Access Denied: Not Authenticated"
            });
        }

        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({
                success: false,
                message: `Access Denied: Missing Permission: ${permission}`
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    requireRole,
    requirePermission
};
