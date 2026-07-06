
const Interview = require("../models/interviewModel");


// CREATE INTERVIEW
const createInterview = (

    req,

    res

) => {

    const {

        candidate_id,

        candidate_name,

        email,

        phone,

        ai_score,

        interview_date,

        interview_time,

        mode,

        interviewer

    }

    = req.body;


    Interview.createInterview(

        candidate_id,
        candidate_name,
        email,
        phone,
        ai_score,
        interview_date,
        interview_time,
        mode,
        interviewer,

        (

            err,

            result

        ) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Interview Creation Failed"

                });

            }

            res.status(201).json({

                message:

                "Interview Scheduled Successfully"

            });

        }

    );

};


// GET ALL INTERVIEWS
const getAllInterviews = (

    req,

    res

) => {

    Interview.getAllInterviews(

        (

            err,

            results

        ) => {

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


// UPDATE STATUS
const updateInterviewStatus = (

    req,

    res

) => {

    const id = req.params.id;

    const {

        status

    }

    = req.body;


    Interview.updateInterviewStatus(

        id,

        status,

        (

            err,

            result

        ) => {

            if (err) {

                return res.status(500).json({

                    message:

                    "Update Failed"

                });

            }

            res.status(200).json({

                message:

                "Interview Status Updated"

            });

        }

    );

};


const getInterviewsByEmail = (req, res) => {
    const email = req.params.email;

    if (req.user.role === "Candidate" && req.user.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({
            success: false,
            message: "Access Denied: You are not authorized to view interviews for this email"
        });
    }

    Interview.getInterviewsByEmail(email, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database Error"
            });
        }
        res.status(200).json(results);
    });
};

module.exports = {

    createInterview,

    getAllInterviews,

    updateInterviewStatus,

    getInterviewsByEmail

};
