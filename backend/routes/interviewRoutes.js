const express = require("express");

const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {

    createInterview,

    getAllInterviews,

    updateInterviewStatus,

    getInterviewsByEmail

} = require("../controllers/interviewController");


// CREATE INTERVIEW
router.post(

    "/",

    verifyToken,
    requireRole(["HR", "Admin"]),

    createInterview

);


// GET ALL INTERVIEWS
router.get(

    "/all",

    verifyToken,
    requireRole(["HR", "Admin"]),

    getAllInterviews

);


// GET INTERVIEWS BY EMAIL
router.get(

    "/email/:email",

    verifyToken,
    requireRole(["Candidate", "HR", "Admin"]),

    getInterviewsByEmail

);


// UPDATE STATUS
router.put(

    "/status/:id",

    verifyToken,
    requireRole(["HR", "Admin"]),

    updateInterviewStatus

);


module.exports = router;
