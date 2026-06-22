
const db = require("../config/db");


// ====================================
// SAVE AI CANDIDATE
// ====================================

const saveCandidate = (

    name,
    email,
    phone,
    skills,
    match_score,
    resume_file,
    callback

) => {

    const sql =

    `
    INSERT INTO ai_candidates
    (
        name,
        email,
        phone,
        skills,
        match_score,
        resume_file,
        status
    )
    VALUES
    (
        ?,?,?,?,?,?,?
    )
    `;

    db.query(

        sql,

        [

            name,
            email,
            phone,
            skills,
            match_score,
            resume_file,
            "Pending"

        ],

        callback

    );

};


// ====================================
// GET ALL CANDIDATES
// ====================================

const getAllCandidates = (callback) => {

    const sql =

    `
    SELECT *
    FROM ai_candidates
    ORDER BY match_score DESC
    `;

    db.query(

        sql,

        callback

    );

};


// ====================================
// SHORTLIST CANDIDATE
// ====================================

const shortlistCandidate = (

    id,

    callback

) => {

    const sql =

    `
    UPDATE ai_candidates
    SET status='Shortlisted'
    WHERE id=?
    `;

    db.query(

        sql,

        [id],

        callback

    );

};


// ====================================
// REJECT CANDIDATE
// ====================================

const rejectCandidate = (

    id,

    callback

) => {

    const sql =

    `
    UPDATE ai_candidates
    SET status='Rejected'
    WHERE id=?
    `;

    db.query(

        sql,

        [id],

        callback

    );

};


// ====================================
// INTERVIEW SCHEDULED
// ====================================

const scheduleCandidate = (

    id,

    callback

) => {

    const sql =

    `
    UPDATE ai_candidates
    SET status='Interview Scheduled'
    WHERE id=?
    `;

    db.query(

        sql,

        [id],

        callback

    );

};


// ====================================
// TOP 5 CANDIDATES
// ====================================

const getTopCandidates = (

    callback

) => {

    const sql =

    `
    SELECT *
    FROM ai_candidates
    ORDER BY match_score DESC
    LIMIT 5
    `;

    db.query(

        sql,

        callback

    );

};


// ====================================
// EXPORTS
// ====================================

module.exports = {

    saveCandidate,

    getAllCandidates,

    shortlistCandidate,

    rejectCandidate,

    scheduleCandidate,

    getTopCandidates

};
