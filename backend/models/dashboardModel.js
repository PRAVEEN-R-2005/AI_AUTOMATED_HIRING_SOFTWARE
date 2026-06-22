const db = require("../config/db");

const getDashboardStats = (callback) => {

    const sql = `

    SELECT

    (SELECT COUNT(*) FROM jobs) AS jobs,

    (SELECT COUNT(*) FROM ai_candidates) AS candidates,

    (SELECT COUNT(*) FROM interviews) AS interviews,

    (SELECT COUNT(*) FROM ai_candidates
     WHERE match_score >= 80) AS topCandidates

    `;

    db.query(

        sql,

        callback

    );

};

module.exports = {

    getDashboardStats

};