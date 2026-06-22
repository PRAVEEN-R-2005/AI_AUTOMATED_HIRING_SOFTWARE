
const db = require("../config/db");


// ====================================
// CREATE APPLICATION
// ====================================

const createApplication = (

    candidate_name,
    email,
    phone,
    job_id,
    resume_file,
    callback

) => {

    const sql =

    `
    INSERT INTO applications
    (
        candidate_name,
        email,
        phone,
        job_id,
        resume_file,
        status
    )
    VALUES
    (
        ?,?,?,?,?,?
    )
    `;

    db.query(

        sql,

        [

            candidate_name,
            email,
            phone,
            job_id,
            resume_file,
            "Pending"

        ],

        callback

    );

};


// ====================================
// GET ALL APPLICATIONS
// ====================================

const getApplications = (

    callback

) => {

    const sql =

    `
    SELECT applications.*, jobs.title AS job_title
    FROM applications
    LEFT JOIN jobs ON applications.job_id = jobs.id
    ORDER BY applications.id DESC
    `;

    db.query(

        sql,

        callback

    );

};


// ====================================
// GET APPLICATIONS BY EMAIL
// ====================================

const getApplicationByEmail = (

    email,

    callback

) => {

    const sql =

    `
    SELECT *
    FROM applications
    WHERE email=?
    ORDER BY id DESC
    `;

    db.query(

        sql,

        [

            email

        ],

        callback

    );

};


// ====================================
// UPDATE STATUS
// ====================================

const updateApplicationStatus = (

    id,
    status,
    callback

) => {

    const sql =

    `
    UPDATE applications
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


// ====================================
// SHORTLIST APPLICATION
// ====================================

const shortlistApplication = (

    id,

    callback

) => {

    const sql =

    `
    UPDATE applications
    SET status='Shortlisted'
    WHERE id=?
    `;

    db.query(

        sql,

        [

            id

        ],

        callback

    );

};


// ====================================
// REJECT APPLICATION
// ====================================

const rejectApplication = (

    id,

    callback

) => {

    const sql =

    `
    UPDATE applications
    SET status='Rejected'
    WHERE id=?
    `;

    db.query(

        sql,

        [

            id

        ],

        callback

    );

};


// ====================================
// UPDATE MATCH SCORE
// ====================================

const updateMatchScore = (

    id,

    match_score,

    callback

) => {

    const sql =

    `
    UPDATE applications
    SET match_score=?
    WHERE id=?
    `;

    db.query(

        sql,

        [

            match_score,

            id

        ],

        callback

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
