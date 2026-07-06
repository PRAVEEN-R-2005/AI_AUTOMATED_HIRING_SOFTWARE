
const db = require("../config/db");


// CREATE INTERVIEW
const createInterview = (

    candidate_id,

    candidate_name,

    email,

    phone,

    ai_score,

    interview_date,

    interview_time,

    mode,

    interviewer,

    callback

) => {

    const sql =

    `
    INSERT INTO interviews
    (
        candidate_id,
        candidate_name,
        email,
        phone,
        ai_score,
        interview_date,
        interview_time,
        mode,
        interviewer,
        status
    )
    VALUES
    (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    `;

    db.query(

        sql,

        [

            candidate_id,
            candidate_name,
            email,
            phone,
            ai_score,
            interview_date,
            interview_time,
            mode,
            interviewer,
            "Scheduled"

        ],

        callback

    );

};


// GET ALL INTERVIEWS
const getAllInterviews = (

    callback

) => {

    const sql =

    `
    SELECT *
    FROM interviews
    ORDER BY interview_date ASC
    `;

    db.query(

        sql,

        callback

    );

};


// GET INTERVIEW BY ID
const getInterviewById = (

    id,

    callback

) => {

    db.query(

        "SELECT * FROM interviews WHERE id=?",

        [id],

        callback

    );

};


// UPDATE INTERVIEW STATUS
const updateInterviewStatus = (

    id,

    status,

    callback

) => {

    const sql =

    `
    UPDATE interviews
    SET status=?
    WHERE id=?
    `;

    db.query(

        sql,

        [

            status,

            id

        ],

        callback

    );

};


const getInterviewsByEmail = (
    email,
    callback
) => {
    db.query(
        "SELECT * FROM interviews WHERE email=? ORDER BY interview_date ASC",
        [email],
        callback
    );
};

module.exports = {

    createInterview,

    getAllInterviews,

    getInterviewById,

    updateInterviewStatus,

    getInterviewsByEmail

};
