const express = require("express");
const router = express.Router();
const { getTopCandidates } = require("../controllers/topCandidateController");

router.get("/", getTopCandidates);

module.exports = router;