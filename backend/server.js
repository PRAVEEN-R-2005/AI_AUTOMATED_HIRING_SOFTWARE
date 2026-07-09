require("dotenv").config();

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in the environment variables. The application cannot start securely.");
    process.exit(1);
}

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
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(allowed => {
            const normalizedAllowed = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
            return origin === normalizedAllowed;
        });

        if (isAllowed || origin.endsWith(".vercel.app")) {
            return callback(null, true);
        }
        return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    },
    credentials: true
}));


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
// Health Check Routes
// ====================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        success: true,
        message: "Smart ATS backend is running"
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        success: true,
        message: "Smart ATS backend is running"
    });
});

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

const PORT = process.env.PORT || 8080;

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Server running on port ${PORT} - server ready`
        );
    }
);
