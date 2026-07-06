const db = require("../config/db");

const getDashboardStats = (callback) => {

    const sql = `

    SELECT

    (SELECT COUNT(*) FROM jobs) AS jobs,

    (SELECT COUNT(*) FROM applications) AS candidates,

    (SELECT COUNT(*) FROM interviews) AS interviews,

    (SELECT COUNT(*) FROM applications
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