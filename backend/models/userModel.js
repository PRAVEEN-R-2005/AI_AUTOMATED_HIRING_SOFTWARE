const db = require("../config/db");

const createUser = (name, email, password, role, callback) => {

    const sql = `
        INSERT INTO users(name,email,password,role)
        VALUES(?,?,?,?)
    `;

    db.query(sql, [name, email, password, role], callback);
};

const findUserByEmail = (email, callback) => {

    const sql = `
        SELECT * FROM users WHERE email = ?
    `;

    db.query(sql, [email], callback);
};

module.exports = {
    createUser,
    findUserByEmail
};