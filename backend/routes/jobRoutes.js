
const express = require("express");

const router = express.Router();

const upload = require("../middleware/multer");

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

    upload.single("jd_file"),

    createJob

);


// ======================================
// GET ALL JOBS
// GET /api/jobs/all
// ======================================

router.get(

    "/all",

    getJobs

);


// ======================================
// GET OPEN JOBS
// Candidate Module
// GET /api/jobs/open
// ======================================

router.get(

    "/open",

    getOpenJobs

);


// ======================================
// PUBLISH JOB
// HR Module
// PUT /api/jobs/publish/:id
// ======================================

router.put(

    "/publish/:id",

    publishJob

);


// ======================================
// CLOSE JOB
// HR Module
// PUT /api/jobs/close/:id
// ======================================

router.put(

    "/close/:id",

    closeJob

);


// ======================================
// DELETE JOB
// DELETE /api/jobs/:id
// ======================================

router.delete(

    "/:id",

    deleteJob

);


// ======================================
// EXPORT ROUTER
// ======================================

module.exports = router;
