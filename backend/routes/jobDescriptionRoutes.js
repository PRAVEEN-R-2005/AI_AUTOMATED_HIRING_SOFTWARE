
const express = require("express");

const router = express.Router();



const {

    createJD,

    getAllJD,

    updateJD,

    deleteJD,

    publishJD,

    closeJD,

    getOpenJD

}

=

require(

"../controllers/jobDescriptionController"

);


// ======================================
// CREATE JD
// ======================================

router.post(

    "/",

    createJD

);


// ======================================
// GET ALL JD
// ======================================

router.get(

    "/",

    getAllJD

);


// ======================================
// UPDATE JD
// ======================================

router.put(

    "/:id",

    updateJD

);


// ======================================
// DELETE JD
// ======================================

router.delete(

    "/:id",

    deleteJD

);
router.put(

    "/publish/:id",

    publishJD

);


router.put(

    "/close/:id",

    closeJD

);
router.get(

    "/open",

    getOpenJD

);

module.exports = router;
