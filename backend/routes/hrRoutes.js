const express = require("express");

const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {

    getTopCandidates,

    getCandidateById,

    getAllCandidates

} = require("../controllers/hrController");


router.get(

    "/top-candidates",

    verifyToken,
    requireRole(["HR", "Admin"]),

    getTopCandidates

);


router.get(

    "/candidate/:id",

    verifyToken,
    requireRole(["HR", "Admin"]),

    getCandidateById

);


router.get(

    "/all-candidates",

    verifyToken,
    requireRole(["HR", "Admin"]),

    getAllCandidates

);


module.exports = router;