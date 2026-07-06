const express = require("express");

const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {

    runAI

}

=

require("../controllers/aiController");


// ====================
// RUN AI
// PUT /api/ai/run/:id
// ====================

router.put(

    "/run/:id",

    verifyToken,
    requireRole(["HR", "Admin"]),
    runAI

);


// ====================
// EXPORT
// ====================

module.exports = router;