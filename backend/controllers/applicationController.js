
const Application = require("../models/applicationModel");


// ====================================
// CREATE APPLICATION
// ====================================

const createApplication = (req, res) => {

    const {

        candidate_name,
        email,
        phone,
        job_id

    }

    = req.body;


    const resume_file = req.file.filename;


    Application.createApplication(

        candidate_name,
        email,
        phone,
        job_id,
        resume_file,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(201).json({

                message:

                "Application Submitted Successfully",
                applicationId:
                result.insertId

            });

        }

    );

};


// ====================================
// GET ALL APPLICATIONS
// ====================================

const getApplications = (req, res) => {

    Application.getApplications(

        (err, results) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json(

                results

            );

        }

    );

};


// ====================================
// GET APPLICATIONS BY EMAIL
// ====================================

const getApplicationByEmail = (req, res) => {

    const email = req.params.email;


    Application.getApplicationByEmail(

        email,

        (err, results) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json(

                results

            );

        }

    );

};


// ====================================
// UPDATE STATUS
// ====================================

const updateApplicationStatus = (req, res) => {

    const id = req.params.id;

    const {

        status

    }

    = req.body;


    Application.updateApplicationStatus(

        id,

        status,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json({

                message:

                "Status Updated"

            });

        }

    );

};


// ====================================
// SHORTLIST APPLICATION
// ====================================

const shortlistApplication = (req, res) => {

    const id = req.params.id;

    Application.shortlistApplication(

        id,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json({

                message:

                "Candidate Shortlisted"

            });

        }

    );

};


// ====================================
// REJECT APPLICATION
// ====================================

const rejectApplication = (req, res) => {

    const id = req.params.id;

    Application.rejectApplication(

        id,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json({

                message:

                "Candidate Rejected"

            });

        }

    );

};


// ====================================
// UPDATE MATCH SCORE
// ====================================

const updateMatchScore = (req, res) => {

    const id = req.params.id;

    const {

        match_score

    }

    = req.body;


    Application.updateMatchScore(

        id,

        match_score,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Database Error"

                });

            }

            res.status(200).json({

                message:

                "Match Score Updated Successfully"

            });

        }

    );

};


// ====================================
// EXPORTS
// ====================================

module.exports = {

    createApplication,

    getApplications,

    getApplicationByEmail,

    updateApplicationStatus,

    shortlistApplication,

    rejectApplication,

    updateMatchScore

};
