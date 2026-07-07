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
    round,
    duration,
    meeting_link,
    callback
) => {
    const sql = `
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
        round,
        duration,
        meeting_link,
        status
    )
    VALUES
    (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
            round || 'Technical Interview',
            duration || 30,
            meeting_link || null,
            "Scheduled"
        ],
        callback
    );
};

// GET ALL INTERVIEWS
const getAllInterviews = (callback) => {
    const sql = `
    SELECT *
    FROM interviews
    ORDER BY interview_date ASC
    `;
    db.query(sql, callback);
};

// GET INTERVIEW BY ID
const getInterviewById = (id, callback) => {
    db.query(
        "SELECT * FROM interviews WHERE id=?",
        [id],
        callback
    );
};

// UPDATE INTERVIEW STATUS
const updateInterviewStatus = (id, status, callback) => {
    const sql = `
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

// SUBMIT EVALUATION FEEDBACK AND SCORECARD
const submitFeedback = (id, feedback, rating, callback) => {
    const sql = `
    UPDATE interviews
    SET feedback=?, rating=?, status='Completed'
    WHERE id=?
    `;
    db.query(
        sql,
        [
            feedback,
            rating,
            id
        ],
        callback
    );
};

const getInterviewsByEmail = (email, callback) => {
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
    submitFeedback,
    getInterviewsByEmail
};
