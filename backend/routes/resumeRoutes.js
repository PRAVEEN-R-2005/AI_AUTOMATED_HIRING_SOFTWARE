const express = require("express");

const router = express.Router();

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

uploadResume.single(

"resume_file"

),

uploadResumeController

);


module.exports = router;