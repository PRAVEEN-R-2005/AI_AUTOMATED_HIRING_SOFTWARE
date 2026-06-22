const db = require("../config/db");

// =====================================
// RUN AI ENGINE + UPDATE MATCH SCORE
// =====================================

const runAI = (req, res) => {
    try {
        const id = req.params.id;
        const score = Math.floor(Math.random() * 100);
        const sql =
        `
        UPDATE applications
        SET match_score=?
        WHERE id=?
        `;

        db.query(
            sql,
            [
                score,
                id
            ],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Database Error"
                    });
                }
                res.status(200).json({
                    message: "AI Score Updated",
                    score
                });
            }
        );
    }
    catch (error) {
        console.log("AI ERROR:");
        console.log(error);
        res.status(500).json({
            message: "AI Failed",
            error: error.message
        });
    }
};

module.exports = {
    runAI
};
