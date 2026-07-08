const db = require("../config/db");

/**
 * Log a security, administrative, or recruitment event in the audit trail.
 * Multi-tenant safe, append-only, and scrubs sensitive metadata properties.
 */
const logAuditEvent = async ({
    req,
    organizationId,
    actorId,
    actorName,
    actorEmail,
    eventCategory,
    action,
    resourceType,
    resourceId = null,
    result = "SUCCESS",
    metadata = {}
}) => {
    try {
        let finalOrgId = organizationId;
        let finalActorId = actorId;
        let finalActorName = actorName;
        let finalActorEmail = actorEmail;
        let finalIp = null;
        let finalUa = null;

        // If Express request is provided, extract client metadata and auth context
        if (req) {
            finalIp = (req.headers ? req.headers["x-forwarded-for"] : null) || req.socket?.remoteAddress || null;
            // Handle proxy arrays
            if (finalIp && finalIp.includes(",")) {
                finalIp = finalIp.split(",")[0].trim();
            }
            finalUa = req.headers ? req.headers["user-agent"] : null;

            if (req.user) {
                finalOrgId = finalOrgId || req.user.organization_id;
                finalActorId = finalActorId || req.user.id;
                finalActorEmail = finalActorEmail || req.user.email;
            }
        }

        // Clean metadata to protect secrets from being logged in the audit trail
        const cleanMetadata = { ...metadata };
        const sensitiveKeys = [
            "password",
            "password_hash",
            "token",
            "token_hash",
            "currentpassword",
            "newpassword",
            "confirmpassword",
            "secret",
            "apikey",
            "authorization",
            "cookie"
        ];

        for (const key of Object.keys(cleanMetadata)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
                cleanMetadata[key] = "[REDACTED]";
            }
        }

        // Final fallbacks for system background jobs
        finalOrgId = finalOrgId || 1; // Default to demo org
        finalActorId = finalActorId || null; // Nullable if no user context
        finalActorEmail = finalActorEmail || "system@ats.com";
        if (!finalActorName) {
            finalActorName = finalActorEmail.split("@")[0] || "System";
        }

        const sql = `
            INSERT INTO audit_logs 
            (organization_id, actor_id, actor_name, actor_email, event_category, action, resource_type, resource_id, result, ip_address, user_agent, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            finalOrgId,
            finalActorId,
            finalActorName,
            finalActorEmail,
            eventCategory,
            action,
            resourceType,
            resourceId,
            result,
            finalIp,
            finalUa ? finalUa.substring(0, 255) : null,
            JSON.stringify(cleanMetadata)
        ];

        db.query(sql, params, (err) => {
            if (err) {
                console.error("CRITICAL: Failed to write audit event log:", err);
            }
        });
    } catch (err) {
        console.error("CRITICAL: Error in auditLogger utility:", err);
    }
};

module.exports = {
    logAuditEvent
};
