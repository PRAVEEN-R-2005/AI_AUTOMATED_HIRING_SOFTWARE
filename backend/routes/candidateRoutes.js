const express = require("express");

const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {

    addCandidate,

    getAllCandidates,

    getCandidateById,

    updateCandidate,

    deleteCandidate

}

=

require("../controllers/candidateController");


// ==========================
// ADD CANDIDATE
// ==========================

router.post(

    "/",

    verifyToken,
    requireRole(["Candidate", "HR", "Admin"]),
    addCandidate

);


// ==========================
// GET ALL CANDIDATES
// ==========================

router.get(

    "/all",

    verifyToken,
    requireRole(["HR", "Admin"]),
    getAllCandidates

);


// ==========================
// GET CANDIDATE BY ID
// ==========================

router.get(

    "/:id",

    verifyToken,
    requireRole(["HR", "Admin"]),
    getCandidateById

);


// ==========================
// UPDATE CANDIDATE
// ==========================

router.put(

    "/:id",

    verifyToken,
    requireRole(["Candidate", "HR", "Admin"]),
    updateCandidate

);


// ==========================
// DELETE CANDIDATE
// ==========================

router.delete(

    "/:id",

    verifyToken,
    requireRole(["HR", "Admin"]),
    deleteCandidate

);


// ==========================
// EXPORT ROUTER
// ==========================

module.exports = router;
