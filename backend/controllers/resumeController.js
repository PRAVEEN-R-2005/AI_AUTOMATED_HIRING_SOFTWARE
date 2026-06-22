const Resume = require("../models/resumeModel");

const uploadResume = (

    req,

    res

) => {

    const {

        candidate_name,

        email

    }

    = req.body;

    const resume_file = req.file.filename;

    Resume.uploadResume(

        candidate_name,

        email,

        resume_file,

        (

            err,

            result

        ) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Upload Failed"

                });

            }

            res.status(201).json({

                message:

                "Resume Uploaded Successfully"

            });

        }

    );

};

module.exports = {

    uploadResume

};