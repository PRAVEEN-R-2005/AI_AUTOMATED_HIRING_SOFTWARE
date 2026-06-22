
const express = require("express");

const router = express.Router();

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

    runAI

);


// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;
