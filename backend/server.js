require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();


// ====================
// Middleware
// ====================

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Rate limiting — 200 requests per 15-minute window per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." }
});
app.use("/api/", apiLimiter);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// ====================
// Static Folder
// ====================

app.use(

    "/uploads/resumes",

    express.static(

        path.join(

            __dirname,

            "uploads/resumes"

        )

    )

);

app.use(

    "/uploads/JD",

    express.static(

        path.join(

            __dirname,

            "uploads/JD"

        )

    )

);


// ====================
// Route Imports
// ====================

const authRoutes = require(

    "./routes/authRoutes"

);

const jobRoutes = require(

    "./routes/jobRoutes"

);





const interviewRoutes = require(

    "./routes/interviewRoutes"

);

const dashboardRoutes = require(

    "./routes/dashboardRoutes"

);

const hrRoutes = require(

    "./routes/hrRoutes"

);



const applicationRoutes = require(

    "./routes/applicationRoutes"

);

const topCandidateRoutes = require(
    "./routes/topCandidateRoutes"
);

const aiRoutes = require(

    "./routes/aiRoutes"

);
const jobDescriptionRoutes = require(
"./routes/jobDescriptionRoutes"
);
const notificationRoutes = require("./routes/notificationRoutes");
const communicationRoutes = require("./routes/communicationRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const teamRoutes = require("./routes/teamRoutes");
const commentRoutes = require("./routes/commentRoutes");


// ====================
// Routes
// ====================

app.use(

    "/api/auth",

    authRoutes

);

app.use(

    "/api/jobs",

    jobRoutes

);





app.use(

    "/api/interviews",

    interviewRoutes

);

app.use(

    "/api/dashboard",

    dashboardRoutes

);

app.use(

    "/api/hr",

    hrRoutes

);



app.use(

    "/api/top-candidates",

    topCandidateRoutes

);

app.use(

    "/api/applications",

    applicationRoutes

);

app.use(

    "/api/ai",

    aiRoutes

);
app.use(

    "/api/job-descriptions",

    jobDescriptionRoutes

);
app.use("/api/notifications", notificationRoutes);
app.use("/api/communications", communicationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/comments", commentRoutes);


// ====================
// Home Route
// ====================

app.get(

    "/",

    (req, res) => {

        res.send(

            "AI Hiring Software Backend Running"

        );

    }

);


// ====================
// Global Error Handler
// ====================
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "An unexpected error occurred on the server. Please contact support."
            : err.message
    });
});

// ====================
// Start Server
// ====================

const PORT = process.env.PORT || 5000;

app.listen(

    PORT,

    () => {

        console.log(

            `Server running on port ${PORT}`

        );

    }

);
