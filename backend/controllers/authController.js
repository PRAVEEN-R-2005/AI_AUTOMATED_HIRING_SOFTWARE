const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");


// Register
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !name.trim() || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
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

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        const allowedRoles = ["Admin", "HR", "Candidate"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        User.createUser(
            name.trim(),
            normalizedEmail,
            hashedPassword,
            role,
            (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
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

                res.status(201).json({
                    success: true,
                    message: "User Registered Successfully"
                });
            }
        );

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
    if (
        (normalizedEmail === "admin@gmail.com" && normalizedPassword === "admin123") ||
        (normalizedEmail === "hr@gmail.com" && normalizedPassword === "123456") ||
        (normalizedEmail === "candidate@gmail.com" && normalizedPassword === "123456")
    ) {
        let role = "Candidate";
        if (normalizedEmail === "admin@gmail.com") role = "Admin";
        else if (normalizedEmail === "hr@gmail.com") role = "HR";

        const token = jwt.sign(
            { id: 999, role, email: normalizedEmail },
            process.env.JWT_SECRET || "praveen_secret_key",
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            role,
            email: normalizedEmail
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
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET || "praveen_secret_key",
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            role: user.role,
            email: user.email
        });
    });
};


module.exports = {
    registerUser,
    loginUser
};