const db = require("../config/db");

const uploadResume = (

    candidate_name,

    email,

    resume_file,

    callback

) => {

    const sql =

    `
    INSERT INTO resumes
    (
        candidate_name,
        email,
        resume_file
    )
    VALUES
    (
        ?, ?, ?
    )
    `;

    db.query(

        sql,

        [

            candidate_name,

            email,

            resume_file

        ],

        callback

    );

};

module.exports = {

    uploadResume

};