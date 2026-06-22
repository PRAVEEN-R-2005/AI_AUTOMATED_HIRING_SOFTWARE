
const express = require("express");

const router = express.Router();

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

    addCandidate

);


// ==========================
// GET ALL CANDIDATES
// ==========================

router.get(

    "/all",

    getAllCandidates

);


// ==========================
// GET CANDIDATE BY ID
// ==========================

router.get(

    "/:id",

    getCandidateById

);


// ==========================
// UPDATE CANDIDATE
// ==========================

router.put(

    "/:id",

    updateCandidate

);


// ==========================
// DELETE CANDIDATE
// ==========================

router.delete(

    "/:id",

    deleteCandidate

);


// ==========================
// EXPORT ROUTER
// ==========================

module.exports = router;
