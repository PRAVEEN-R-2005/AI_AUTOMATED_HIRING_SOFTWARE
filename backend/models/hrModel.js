const db = require("../config/db");


// Get Top Candidates

const getTopCandidates = (callback)=>{

    const sql =

    `
    SELECT id, candidate_name AS name, email, phone, status, match_score, resume_file, created_at
    FROM applications

    ORDER BY match_score DESC
    `;

    db.query(

        sql,

        callback

    );

};


// Get Candidate By ID

const getCandidateById = (

    id,

    callback

)=>{

    const sql =

    `
    SELECT id, candidate_name AS name, email, phone, status, match_score, resume_file, created_at
    FROM applications

    WHERE id = ?
    `;

    db.query(

        sql,

        [id],

        callback

    );

};


// Get All Candidates

const getAllCandidates = (

    callback

)=>{

    const sql =

    `
    SELECT id, candidate_name AS name, email, phone, status, match_score, resume_file, created_at
    FROM applications
    `;

    db.query(

        sql,

        callback

    );

};


module.exports = {

    getTopCandidates,

    getCandidateById,

    getAllCandidates

};