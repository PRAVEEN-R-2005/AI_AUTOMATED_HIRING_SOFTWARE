const db = require("../config/db");


// ======================================
// CREATE JOB
// ======================================

const createJob = (

    title,
    description,
    skills,
    experience,
    salary,
    location,
    employment_type,
    jd_file,

    callback

) => {

    const sql =

    `
    INSERT INTO jobs
    (
        title,
        description,
        skills,
        experience,
        salary,
        location,
        employment_type,
        jd_file
    )

    VALUES

    (
        ?,?,?,?,?,?,?,?
    )
    `;

    db.query(

        sql,

        [

            title,
            description,
            skills,
            experience,
            salary,
            location,
            employment_type,
            jd_file

        ],

        callback

    );

};



// ======================================
// GET ALL JOBS
// ======================================

const getJobs = (callback) => {

    const sql =

    `
    SELECT *
    FROM jobs
    ORDER BY id DESC
    `;

    db.query(

        sql,

        callback

    );

};



// ======================================
// GET OPEN JOBS
// Candidate Module
// ======================================

const getOpenJobs = (callback) => {

    const sql =

    `
    SELECT *
    FROM jobs

    WHERE status='Open'

    ORDER BY id DESC
    `;

    db.query(

        sql,

        callback

    );

};



// ======================================
// PUBLISH JOB
// HR Module
// ======================================

const publishJob = (

    id,

    callback

) => {

    const sql =

    `
    UPDATE jobs

    SET

    status='Open',

    published_by='HR'

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



// ======================================
// CLOSE JOB
// HR Module
// ======================================

const closeJob = (

    id,

    callback

) => {

    const sql =

    `
    UPDATE jobs

    SET

    status='Closed'

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



// ======================================
// DELETE JOB
// ======================================

const deleteJob = (

    id,

    callback

) => {

    const sql =

    `
    DELETE FROM jobs

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