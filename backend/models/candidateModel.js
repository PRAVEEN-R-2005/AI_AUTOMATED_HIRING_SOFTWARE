const db = require("../config/db");

const addCandidate = (

    name,
    email,
    resume,

    callback

)=>{

    const sql =

    `
    INSERT INTO candidates
    (name,email,resume)

    VALUES
    (?,?,?)
    `;

    db.query(

        sql,

        [name,email,resume],

        callback

    );

};
const getAllCandidates = (callback) => {

    const sql = "SELECT * FROM candidates";

    db.query(sql, callback);

};


const getCandidateById = (id, callback) => {

    const sql = "SELECT * FROM candidates WHERE id=?";

    db.query(sql, [id], callback);

};


const updateCandidate = (

    id,
    name,
    email,

    callback

) => {

    const sql =

    `
    UPDATE candidates
    SET name=?,email=?
    WHERE id=?
    `;

    db.query(

        sql,

        [name, email, id],

        callback

    );

};


const deleteCandidate = (

    id,

    callback

) => {

    const sql =

    "DELETE FROM candidates WHERE id=?";

    db.query(

        sql,

        [id],

        callback

    );

};

module.exports = {

    addCandidate,

    getAllCandidates,

    getCandidateById,

    updateCandidate,

    deleteCandidate

};