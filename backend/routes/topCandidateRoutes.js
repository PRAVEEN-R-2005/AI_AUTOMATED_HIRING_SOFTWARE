const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { getTopCandidates } = require("../controllers/topCandidateController");

router.get("/", verifyToken, requireRole(["HR", "Admin"]), getTopCandidates);

module.exports = router;