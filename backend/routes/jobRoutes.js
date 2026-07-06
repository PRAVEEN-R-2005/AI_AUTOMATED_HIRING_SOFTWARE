const express = require("express");

const router = express.Router();

const upload = require("../middleware/multer");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {

    createJob,
    getJobs,
    getOpenJobs,
    publishJob,
    closeJob,
    deleteJob

} = require("../controllers/jobController");


// ======================================
// CREATE JOB
// POST /api/jobs
// ======================================

router.post(

    "/",

    verifyToken,
    requireRole(["HR", "Admin"]),

    upload.single("jd_file"),

    createJob

);


// ======================================
// GET ALL JOBS
// GET /api/jobs/all
// ======================================

router.get(

    "/all",

    verifyToken,
    requireRole(["HR", "Admin"]),

    getJobs

);


// ======================================
// GET OPEN JOBS
// Candidate Module
// GET /api/jobs/open
// ======================================

router.get(

    "/open",

    verifyToken,
    requireRole(["Candidate", "HR", "Admin"]),

    getOpenJobs

);


// ======================================
// PUBLISH JOB
// HR Module
// PUT /api/jobs/publish/:id
// ======================================

router.put(

    "/publish/:id",

    verifyToken,
    requireRole(["HR", "Admin"]),

    publishJob

);


// ======================================
// CLOSE JOB
// HR Module
// PUT /api/jobs/close/:id
// ======================================

router.put(

    "/close/:id",

    verifyToken,
    requireRole(["HR", "Admin"]),

    closeJob

);


// ======================================
// DELETE JOB
// DELETE /api/jobs/:id
// ======================================

router.delete(

    "/:id",

    verifyToken,
    requireRole(["HR", "Admin"]),

    deleteJob

);


// ======================================
// EXPORT ROUTER
// ======================================

module.exports = router;

