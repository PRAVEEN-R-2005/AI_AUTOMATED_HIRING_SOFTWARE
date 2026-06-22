
const express = require("express");

const router = express.Router();

const upload = require("../middleware/multer");

const {

    createApplication,

    getApplications,

    getApplicationByEmail,

    updateApplicationStatus,

    shortlistApplication,

    rejectApplication,

    updateMatchScore

}

=

require("../controllers/applicationController");


// ====================================
// CREATE APPLICATION
// POST /api/applications
// ====================================

router.post(

    "/",

    upload.single(

        "resume_file"

    ),

    createApplication

);


// ====================================
// GET ALL APPLICATIONS
// GET /api/applications/all
// ====================================

router.get(

    "/all",

    getApplications

);


// ====================================
// GET APPLICATIONS BY EMAIL
// GET /api/applications/:email
// ====================================

router.get(

    "/email/:email",

    getApplicationByEmail

);


// ====================================
// UPDATE STATUS
// PUT /api/applications/status/:id
// ====================================

router.put(

    "/status/:id",

    updateApplicationStatus

);


// ====================================
// SHORTLIST APPLICATION
// PUT /api/applications/shortlist/:id
// ====================================

router.put(

    "/shortlist/:id",

    shortlistApplication

);


// ====================================
// REJECT APPLICATION
// PUT /api/applications/reject/:id
// ====================================

router.put(

    "/reject/:id",

    rejectApplication

);


// ====================================
// UPDATE MATCH SCORE
// PUT /api/applications/score/:id
// ====================================

router.put(

    "/score/:id",

    updateMatchScore

);


// ====================================
// EXPORT ROUTER
// ====================================

module.exports = router;
