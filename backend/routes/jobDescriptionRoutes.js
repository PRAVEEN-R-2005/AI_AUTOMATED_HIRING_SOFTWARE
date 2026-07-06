const express = require("express");

const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

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

    verifyToken,
    requireRole(["Admin"]),

    createJD

);


// ======================================
// GET ALL JD
// ======================================

router.get(

    "/",

    verifyToken,
    requireRole(["Admin", "HR"]),

    getAllJD

);


// ======================================
// UPDATE JD
// ======================================

router.put(

    "/:id",

    verifyToken,
    requireRole(["Admin"]),

    updateJD

);


// ======================================
// DELETE JD
// ======================================

router.delete(

    "/:id",

    verifyToken,
    requireRole(["Admin"]),

    deleteJD

);
router.put(

    "/publish/:id",

    verifyToken,
    requireRole(["Admin"]),

    publishJD

);


router.put(

    "/close/:id",

    verifyToken,
    requireRole(["Admin"]),

    closeJD

);
router.get(

    "/open",

    verifyToken,
    requireRole(["Candidate", "HR", "Admin"]),

    getOpenJD

);

module.exports = router;
