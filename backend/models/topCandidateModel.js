const db = require("../config/db");

const getTopCandidates = (callback) => {
    const sql = `
    SELECT *
    FROM applications
    ORDER BY match_score DESC
    `;

    db.query(sql, callback);
};

module.exports = { getTopCandidates };