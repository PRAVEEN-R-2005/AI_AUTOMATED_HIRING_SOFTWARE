require("dotenv").config();
const db = require("./config/db");

db.query("DESCRIBE users", (err, rows) => {
    if (err) {
        console.error("Error describing users table:", err);
    } else {
        console.log("Users Table Columns:");
        console.table(rows);
    }
    db.end();
});
