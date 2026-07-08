const Job = require("../models/jobModel");
const { logAuditEvent } = require("../utils/auditLogger");

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

    const jd_file = req.file ? req.file.filename : null;

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

            const jobId = result?.insertId || null;

            // Log audit event
            logAuditEvent({
                req,
                eventCategory: "JOB",
                action: "JOB_CREATED",
                resourceType: "JOB",
                resourceId: jobId,
                metadata: { title, location, employment_type }
            });

            res.status(201).json({
                message: "Job Created Successfully",
                jobId
            });
        }
    );
};

// ======================================
// GET ALL JOBS
// ======================================
const getJobs = (req, res) => {
    Job.getJobs((err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database Error"
            });
        }
        res.status(200).json(results);
    });
};

// ======================================
// GET OPEN JOBS
// Candidate Module
// ======================================
const getOpenJobs = (req, res) => {
    Job.getOpenJobs((err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database Error"
            });
        }
        res.status(200).json(results);
    });
};

// ======================================
// PUBLISH JOB
// HR Module
// ======================================
const publishJob = (req, res) => {
    const id = req.params.id;

    Job.publishJob(id, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Publish Failed"
            });
        }

        // Log audit event
        logAuditEvent({
            req,
            eventCategory: "JOB",
            action: "JOB_PUBLISHED",
            resourceType: "JOB",
            resourceId: id
        });

        res.status(200).json({
            message: "Job Published Successfully"
        });
    });
};

// ======================================
// CLOSE JOB
// ======================================
const closeJob = (req, res) => {
    const id = req.params.id;

    Job.closeJob(id, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Close Failed"
            });
        }

        // Log audit event
        logAuditEvent({
            req,
            eventCategory: "JOB",
            action: "JOB_CLOSED",
            resourceType: "JOB",
            resourceId: id
        });

        res.status(200).json({
            message: "Job Closed Successfully"
        });
    });
};

// ======================================
// DELETE JOB
// ======================================
const deleteJob = (req, res) => {
    const id = req.params.id;

    Job.deleteJob(id, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Delete Failed"
            });
        }

        // Log audit event
        logAuditEvent({
            req,
            eventCategory: "JOB",
            action: "JOB_DELETED",
            resourceType: "JOB",
            resourceId: id
        });

        res.status(200).json({
            message: "Job Deleted Successfully"
        });
    });
};

module.exports = {
    createJob,
    getJobs,
    getOpenJobs,
    publishJob,
    closeJob,
    deleteJob
};
