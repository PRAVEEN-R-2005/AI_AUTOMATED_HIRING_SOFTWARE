
const db = require("../config/db");


// ======================================
// CREATE JD
// ======================================

const createJD = (

    title,
    skills,
    experience,
    salary,
    location,
    description,
    created_by,

    callback

) => {

    const sql =

    `
    INSERT INTO job_descriptions
    (
        title,
        skills,
        experience,
        salary,
        location,
        description,
        created_by
    )

    VALUES

    (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(

        sql,

        [

            title,
            skills,
            experience,
            salary,
            location,
            description,
            created_by

        ],

        callback

    );

};


// ======================================
// GET ALL JD
// ======================================

const getAllJD = (callback) => {

    const sql =

    `
    SELECT *
    FROM job_descriptions
    ORDER BY jd_id DESC
    `;

    db.query(

        sql,

        callback

    );

};


// ======================================
// UPDATE JD
// ======================================

const updateJD = (

    id,

    title,
    skills,
    experience,
    salary,
    location,
    description,

    callback

) => {

    const sql =

    `
    UPDATE job_descriptions

    SET

    title=?,
    skills=?,
    experience=?,
    salary=?,
    location=?,
    description=?

    WHERE jd_id=?
    `;

    db.query(

        sql,

        [

            title,
            skills,
            experience,
            salary,
            location,
            description,

            id

        ],

        callback

    );

};


// ======================================
// DELETE JD
// ======================================

const deleteJD = (

    id,

    callback

) => {

    const sql =

    `
    DELETE FROM job_descriptions
    WHERE jd_id=?
    `;

    db.query(

        sql,

        [

            id

        ],

        callback

    );

};
// PUBLISH JD

const publishJD = (

    id,

    callback

) => {

    const sql =

    `
    UPDATE job_descriptions

    SET status='Open'

    WHERE jd_id=?
    `;

    db.query(

        sql,

        [

            id

        ],

        callback

    );

};





const closeJD = (

    id,

    callback

) => {

    const sql =

    `
    UPDATE job_descriptions

    SET status='Closed'

    WHERE jd_id=?
    `;

    db.query(

        sql,

        [

            id

        ],

        callback

    );

};
// GET OPEN JD

const getOpenJD = (callback) => {

    const sql = `

    SELECT *

    FROM job_descriptions

    WHERE status='Open'

    ORDER BY jd_id DESC

    `;

    db.query(

        sql,

        callback

    );

};

module.exports = {

    createJD,

    getAllJD,

    updateJD,

    deleteJD,

    publishJD,

    closeJD,
     
    getOpenJD

};
