const Candidate = require("../models/topCandidateModel");

const getTopCandidates = (req, res) => {
    Candidate.getTopCandidates(req.user.organization_id, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database Error"
            });
        }
        res.status(200).json(results);
    });
};

module.exports = { getTopCandidates };