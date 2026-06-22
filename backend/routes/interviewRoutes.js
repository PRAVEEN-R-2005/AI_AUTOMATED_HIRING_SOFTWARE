
const express = require("express");

const router = express.Router();

const {

    createInterview,

    getAllInterviews,

    updateInterviewStatus

}

=

require("../controllers/interviewController");


// CREATE INTERVIEW
router.post(

    "/",

    createInterview

);


// GET ALL INTERVIEWS
router.get(

    "/all",

    getAllInterviews

);


// UPDATE STATUS
router.put(

    "/status/:id",

    updateInterviewStatus

);


module.exports = router;
