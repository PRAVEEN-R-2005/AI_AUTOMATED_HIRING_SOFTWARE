const db = require("../config/db");

// Get outbound email logs for specific candidate
const getCommunicationsByCandidate = (req, res) => {
    const candidate_id = req.params.candidate_id;
    db.query(
        "SELECT * FROM communications WHERE candidate_id = ? ORDER BY id DESC",
        [candidate_id],
        (err, results) => {
            if (err) {
                console.error("Failed to query communications:", err);
                return res.status(500).json({ message: "Database Error" });
            }
            res.status(200).json(results || []);
        }
    );
};

// Log a candidate message transmission event (Simulated real provider status tracking)
const sendCommunication = (req, res) => {
    const { candidate_id, candidate_name, type, subject, message } = req.body;

    if (!candidate_id || !type || !subject || !message) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const sql = `
        INSERT INTO communications (candidate_id, candidate_name, type, subject, message, delivery_status)
        VALUES (?, ?, ?, ?, ?, 'SENT')
    `;

    db.query(sql, [candidate_id, candidate_name, type, subject, message], (err, result) => {
        if (err) {
            console.error("Failed to save communication log:", err);
            return res.status(500).json({ message: "Database Error" });
        }

        // Add event into activities timeline
        const activityText = `Sent general recruiter message: "${subject}"`;
        db.query(
            "INSERT INTO activities (application_id, candidate_name, action, details) VALUES (?, ?, 'Communication Sent', ?)",
            [candidate_id, candidate_name, activityText],
            (actErr) => {
                if (actErr) console.error("Failed to insert communication activity:", actErr);
            }
        );

        res.status(201).json({
            message: "Recruitment message sent successfully",
            communicationId: result.insertId
        });
    });
};

module.exports = {
    getCommunicationsByCandidate,
    sendCommunication
};
