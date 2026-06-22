const express = require("express");

const router = express.Router();

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

    runAI

);


// ====================
// EXPORT
// ====================

module.exports = router;