const express = require("express");

const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const uploadResume =

require(

"../middleware/uploadResume"

);

const {

    uploadResume:

    uploadResumeController

}

=

require(

"../controllers/resumeController"

);


router.post(

"/upload",

verifyToken,
requireRole(["Candidate", "HR", "Admin"]),
uploadResume.single(

"resume_file"

),

uploadResumeController

);


module.exports = router;