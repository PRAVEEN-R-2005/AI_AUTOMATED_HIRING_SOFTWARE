
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();


// ====================
// Middleware
// ====================

app.use(cors());

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
