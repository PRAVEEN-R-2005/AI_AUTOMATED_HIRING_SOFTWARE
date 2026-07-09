const db = require("../config/db");

const getTopCandidates = (orgId, callback) => {
    const sql = `
    SELECT *
    FROM applications
    WHERE organization_id = ?
    ORDER BY match_score DESC
    `;

    db.query(sql, [orgId], callback);
};

module.exports = { getTopCandidates };