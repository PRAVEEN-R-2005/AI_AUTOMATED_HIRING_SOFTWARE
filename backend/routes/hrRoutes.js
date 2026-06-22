const express = require("express");

const router = express.Router();

const {

    getTopCandidates,

    getCandidateById,

    getAllCandidates

} = require("../controllers/hrController");


router.get(

    "/top-candidates",

    getTopCandidates

);


router.get(

    "/candidate/:id",

    getCandidateById

);


router.get(

    "/all-candidates",

    getAllCandidates

);


module.exports = router;