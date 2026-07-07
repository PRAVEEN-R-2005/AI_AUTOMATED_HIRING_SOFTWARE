const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
    getCommunicationsByCandidate,
    sendCommunication
} = require("../controllers/communicationController");

// GET /api/communications/candidate/:candidate_id
router.get(
    "/candidate/:candidate_id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    getCommunicationsByCandidate
);

// POST /api/communications/send
router.post(
    "/send",
    verifyToken,
    requireRole(["HR", "Admin"]),
    sendCommunication
);

module.exports = router;
