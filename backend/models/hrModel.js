const db = require("../config/db");


// Get Top Candidates

const getTopCandidates = (callback)=>{

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


// Get Candidate By ID

const getCandidateById = (

    id,

    callback

)=>{

    const sql =

    `
    SELECT *

    FROM ai_candidates

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
    SELECT *

    FROM ai_candidates
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