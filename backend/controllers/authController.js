const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");


// Register
const registerUser = async (req, res) => {

    try {

        const { name, email, password, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        User.createUser(
            name,
            email,
            hashedPassword,
            role,
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        message: "Registration Failed"
                    });
                }

                res.status(201).json({
                    message: "User Registered Successfully"
                });

            }
        );

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


// Login
const loginUser = (req, res) => {

    const { email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = password?.trim();

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
            { id: 999, role },
            process.env.JWT_SECRET || "praveen_secret_key",
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Login Successful",
            token,
            role
        });
    }

    User.findUserByEmail(email, async (err, results) => {

        if (err) {

            return res.status(500).json({
                message: "Server Error"
            });

        }

        if (results.length === 0) {

            return res.status(404).json({
                message: "User Not Found"
            });

        }

        const user = results[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {

            return res.status(401).json({
                message: "Invalid Password"
            });

        }

        const token = jwt.sign(

            {
                id: user.id,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "1d"
            }

        );

        res.status(200).json({

    message: "Login Successful",

    token,

    role: user.role

});

    });

};


module.exports = {

    registerUser,
    loginUser

};