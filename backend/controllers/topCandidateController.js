const Candidate = require("../models/topCandidateModel");

const getTopCandidates = (req, res) => {
    Candidate.getTopCandidates((err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database Error"
            });
        }
        res.status(200).json(results);
    });
};

module.exports = { getTopCandidates };