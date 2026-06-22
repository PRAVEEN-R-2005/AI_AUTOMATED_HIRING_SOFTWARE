
const Job = require("../models/jobModel");


// ======================================
// CREATE JOB
// ======================================

const createJob = (req, res) => {

    const {
        title,
        description,
        skills,
        experience,
        salary,
        location,
        employment_type
    } = req.body;

    const jd_file = req.file.filename;

    Job.createJob(

        title,
        description,
        skills,
        experience,
        salary,
        location,
        employment_type,
        jd_file,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message: "Database Error"

                });

            }

            res.status(201).json({

                message: "Job Created Successfully"

            });

        }

    );

};


// ======================================
// GET ALL JOBS
// ======================================

const getJobs = (req, res) => {

    Job.getJobs(

        (err, results) => {

            if (err) {

                return res.status(500).json({

                    message: "Database Error"

                });

            }

            res.status(200).json(

                results

            );

        }

    );

};


// ======================================
// GET OPEN JOBS
// Candidate Module
// ======================================

const getOpenJobs = (req, res) => {

    Job.getOpenJobs(

        (err, results) => {

            if (err) {

                return res.status(500).json({

                    message: "Database Error"

                });

            }

            res.status(200).json(

                results

            );

        }

    );

};


// ======================================
// PUBLISH JOB
// HR Module
// ======================================

const publishJob = (req, res) => {

    const id = req.params.id;

    Job.publishJob(

        id,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message: "Publish Failed"

                });

            }

            res.status(200).json({

                message: "Job Published Successfully"

            });

        }

    );

};


// ======================================
// CLOSE JOB
// ======================================

const closeJob = (req, res) => {

    const id = req.params.id;

    Job.closeJob(

        id,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message: "Close Failed"

                });

            }

            res.status(200).json({

                message: "Job Closed Successfully"

            });

        }

    );

};


// ======================================
// DELETE JOB
// ======================================

const deleteJob = (req, res) => {

    const id = req.params.id;

    Job.deleteJob(

        id,

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    message: "Delete Failed"

                });

            }

            res.status(200).json({

                message: "Job Deleted Successfully"

            });

        }

    );

};


// ======================================
// EXPORTS
// ======================================

module.exports = {

    createJob,

    getJobs,

    getOpenJobs,

    publishJob,

    closeJob,

    deleteJob

};
