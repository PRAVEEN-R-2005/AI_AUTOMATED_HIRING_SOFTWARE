const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const db = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");

// Helper to hash tokens
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

// Register
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, invitationToken } = req.body;

        if (!name || !name.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Name and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if (invitationToken) {
            // ACCEPTING AN INVITATION FLOW
            const tokenHash = hashToken(invitationToken);
            const selectInviteSql = `
                SELECT i.id, i.organization_id, i.email, i.role, i.status, i.expires_at
                FROM invitations i
                WHERE i.token_hash = ? AND i.status = 'PENDING'
            `;

            db.query(selectInviteSql, [tokenHash], (err, invites) => {
                if (err || !invites || invites.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid or expired invitation token"
                    });
                }

                const invite = invites[0];
                const isExpired = new Date() > new Date(invite.expires_at);
                if (isExpired) {
                    db.query("UPDATE invitations SET status = 'EXPIRED' WHERE id = ?", [invite.id]);
                    return res.status(400).json({
                        success: false,
                        message: "This invitation has expired. Please contact your administrator."
                    });
                }

                // Force email and role to match invitation to prevent privilege escalation
                const finalEmail = invite.email;
                const finalRole = invite.role;

                // Create User
                User.createUser(
                    name.trim(),
                    finalEmail,
                    hashedPassword,
                    finalRole,
                    (usrErr, usrResult) => {
                        if (usrErr) {
                            if (usrErr.code === "ER_DUP_ENTRY") {
                                return res.status(409).json({
                                    success: false,
                                    message: "Email is already registered"
                                });
                            }
                            return res.status(500).json({
                                success: false,
                                message: "Registration Failed"
                            });
                        }

                        const userId = usrResult.insertId;

                        // Create Membership
                        const insertMemberSql = `
                            INSERT INTO memberships (user_id, organization_id, role, status)
                            VALUES (?, ?, ?, 'ACTIVE')
                        `;
                        db.query(insertMemberSql, [userId, invite.organization_id, finalRole], (memErr) => {
                            if (memErr) {
                                console.error("Error creating membership on invite accept:", memErr);
                            }

                            // Mark Invitation as Accepted
                            db.query(
                                "UPDATE invitations SET status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP WHERE id = ?",
                                [invite.id]
                            );

                            // Create Activity
                            db.query(
                                "INSERT INTO activities (action, details, organization_id) VALUES ('Member Joined', ?, ?)",
                                [`${name.trim()} joined the workspace via invitation`, invite.organization_id]
                            );

                            // Log Audit Event
                            logAuditEvent({
                                organizationId: invite.organization_id,
                                actorId: userId,
                                actorName: name.trim(),
                                actorEmail: finalEmail,
                                eventCategory: "TEAM",
                                action: "INVITATION_ACCEPTED",
                                resourceType: "USER",
                                resourceId: userId,
                                metadata: { email: finalEmail, role: finalRole }
                            });

                            res.status(201).json({
                                success: true,
                                message: "User Registered and Workspace Membership Created Successfully"
                            });
                        });
                    }
                );
            });

        } else {
            // NORMAL REGISTRATION FLOW
            if (!email || !role) {
                return res.status(400).json({
                    success: false,
                    message: "Email and role are required"
                });
            }

            const normalizedEmail = email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email format"
                });
            }

            const allowedRoles = ["Admin", "HR", "Candidate", "Recruiter"];
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role"
                });
            }

            if (role === "Hiring Manager" || role === "Interviewer") {
                return res.status(400).json({
                    success: false,
                    message: "Hiring Managers and Interviewers must be invited to join a workspace"
                });
            }

            User.createUser(
                name.trim(),
                normalizedEmail,
                hashedPassword,
                role,
                (usrErr, usrResult) => {
                    if (usrErr) {
                        if (usrErr.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({
                                success: false,
                                message: "Email is already registered"
                            });
                        }
                        return res.status(500).json({
                            success: false,
                            message: "Registration Failed"
                        });
                    }

                    const userId = usrResult.insertId;

                    if (role === "Admin" || role === "HR" || role === "Recruiter") {
                        // Create a new Organization for the self-registered Recruiter/Admin
                        const orgName = `${name.trim()}'s Workspace`;
                        const orgSlug = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

                        const insertOrgSql = "INSERT INTO organizations (name, slug, status) VALUES (?, ?, 'ACTIVE')";
                        db.query(insertOrgSql, [orgName, orgSlug], (orgErr, orgResult) => {
                            if (orgErr) {
                                console.error("Failed to create organization:", orgErr);
                                return res.status(201).json({
                                    success: true,
                                    message: "User Registered Successfully (Workspace creation failed)"
                                });
                            }

                            const orgId = orgResult.insertId;
                            const orgRole = role === "HR" ? "Recruiter" : role;

                            // Create Admin Membership
                            const insertMemberSql = `
                                INSERT INTO memberships (user_id, organization_id, role, status)
                                VALUES (?, ?, ?, 'ACTIVE')
                            `;
                            db.query(insertMemberSql, [userId, orgId, orgRole], (memErr) => {
                                if (memErr) console.error("Failed to create admin membership:", memErr);
                                
                                logAuditEvent({
                                    organizationId: orgId,
                                    actorId: userId,
                                    actorName: name.trim(),
                                    actorEmail: normalizedEmail,
                                    eventCategory: "AUTHENTICATION",
                                    action: "USER_REGISTERED",
                                    resourceType: "USER",
                                    resourceId: userId,
                                    metadata: { email: normalizedEmail, role, organizationName: orgName }
                                });

                                res.status(201).json({
                                    success: true,
                                    message: "User Registered and Workspace Initialized Successfully"
                                });
                            });
                        });
                    } else {
                        // Candidate registration (no organization workspace needed)
                        logAuditEvent({
                            actorId: userId,
                            actorName: name.trim(),
                            actorEmail: normalizedEmail,
                            eventCategory: "AUTHENTICATION",
                            action: "USER_REGISTERED",
                            resourceType: "USER",
                            resourceId: userId,
                            metadata: { email: normalizedEmail, role }
                        });

                        res.status(201).json({
                            success: true,
                            message: "User Registered Successfully"
                        });
                    }
                }
            );
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Login
const loginUser = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // Backend-side bypass for demo credentials (works even if database is empty/unseeded)
    const isDemoBypassAllowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_BYPASS === "true";
    if (
        isDemoBypassAllowed &&
        ((normalizedEmail === "admin@gmail.com" && normalizedPassword === "admin123") ||
         (normalizedEmail === "hr@gmail.com" && normalizedPassword === "123456") ||
         (normalizedEmail === "candidate@gmail.com" && normalizedPassword === "123456"))
    ) {
        let role = "Candidate";
        let orgId = null;
        if (normalizedEmail === "admin@gmail.com") {
            role = "Admin";
            orgId = 1;
        } else if (normalizedEmail === "hr@gmail.com") {
            role = "Recruiter";
            orgId = 1;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret && process.env.NODE_ENV === "production") {
            return res.status(500).json({
                success: false,
                message: "Internal Server Configuration Error: Secure token configuration missing."
            });
        }

        const token = jwt.sign(
            { id: normalizedEmail === "admin@gmail.com" ? 1 : normalizedEmail === "hr@gmail.com" ? 2 : 3, role, email: normalizedEmail, organization_id: orgId },
            jwtSecret || "praveen_secret_key",
            { expiresIn: "1d" }
        );

        // Log login success
        logAuditEvent({
            req,
            organizationId: orgId,
            actorName: normalizedEmail.split("@")[0],
            actorEmail: normalizedEmail,
            eventCategory: "AUTHENTICATION",
            action: "LOGIN_SUCCESS",
            resourceType: "USER",
            metadata: { email: normalizedEmail, role, note: "Demo Bypass Credential Used" }
        });

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            role,
            email: normalizedEmail,
            organization_id: orgId
        });
    }

    User.findUserByEmail(normalizedEmail, async (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }

        if (results.length === 0) {
            // Log login failure
            logAuditEvent({
                req,
                actorEmail: normalizedEmail,
                eventCategory: "AUTHENTICATION",
                action: "LOGIN_FAILURE",
                resourceType: "USER",
                result: "FAILURE",
                metadata: { email: normalizedEmail, reason: "User Not Found" }
            });
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const user = results[0];

        const isMatch = await bcrypt.compare(
            normalizedPassword,
            user.password
        );

        if (!isMatch) {
            // Log login failure
            logAuditEvent({
                req,
                actorId: user.id,
                actorName: user.name,
                actorEmail: user.email,
                eventCategory: "AUTHENTICATION",
                action: "LOGIN_FAILURE",
                resourceType: "USER",
                resourceId: user.id,
                result: "FAILURE",
                metadata: { email: user.email, reason: "Incorrect password" }
            });
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        }

        // Fetch active organization membership details for the user
        const getMembershipSql = "SELECT organization_id, role, status FROM memberships WHERE user_id = ?";
        db.query(getMembershipSql, [user.id], (memErr, memRows) => {
            let activeRole = user.role;
            let orgId = null;

            if (!memErr && memRows && memRows.length > 0) {
                // If membership is inactive/suspended, reject login if they are NOT candidate
                const primaryMembership = memRows[0];
                if (user.role !== "Candidate" && primaryMembership.status !== "ACTIVE") {
                    logAuditEvent({
                        req,
                        organizationId: primaryMembership.organization_id,
                        actorId: user.id,
                        actorName: user.name,
                        actorEmail: user.email,
                        eventCategory: "AUTHENTICATION",
                        action: "LOGIN_FAILURE",
                        resourceType: "USER",
                        resourceId: user.id,
                        result: "FAILURE",
                        metadata: { email: user.email, reason: "Membership is deactivated" }
                    });
                    return res.status(403).json({
                        success: false,
                        message: "Access Denied: Your account is deactivated."
                    });
                }
                activeRole = primaryMembership.role;
                orgId = primaryMembership.organization_id;
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret && process.env.NODE_ENV === "production") {
                return res.status(500).json({
                    success: false,
                    message: "Internal Server Configuration Error: Secure token configuration missing."
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    role: activeRole,
                    email: user.email,
                    organization_id: orgId
                },
                jwtSecret || "praveen_secret_key",
                {
                    expiresIn: "1d"
                }
            );

            // Log login success
            logAuditEvent({
                req,
                organizationId: orgId,
                actorId: user.id,
                actorName: user.name,
                actorEmail: user.email,
                eventCategory: "AUTHENTICATION",
                action: "LOGIN_SUCCESS",
                resourceType: "USER",
                resourceId: user.id,
                metadata: { email: user.email, role: activeRole }
            });

            res.status(200).json({
                success: true,
                message: "Login Successful",
                token,
                role: activeRole,
                email: user.email,
                organization_id: orgId
            });
        });
    });
};

module.exports = {
    registerUser,
    loginUser
};