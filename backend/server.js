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

const resumeRoutes = require(

    "./routes/resumeRoutes"

);

const candidateRoutes = require(

    "./routes/candidateRoutes"

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

const aiCandidateRoutes = require(

    "./routes/aiCandidateRoutes"

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

    "/api/resumes",

    resumeRoutes

);

app.use(

    "/api/candidates",

    candidateRoutes

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

    "/api/ai-candidates",

    aiCandidateRoutes

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
