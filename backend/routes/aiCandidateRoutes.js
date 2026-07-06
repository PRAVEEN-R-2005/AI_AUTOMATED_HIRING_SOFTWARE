const express = require("express");

const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {

    runAI

}

=

require("../controllers/aiController");


// =====================================
// RUN AI ENGINE
// POST /api/ai-candidates/run
// =====================================

router.post(

    "/run",

    verifyToken,
    requireRole(["HR", "Admin"]),
    runAI

);


// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;
