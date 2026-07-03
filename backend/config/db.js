const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
};

// Connect to MySQL server first to verify/create database and tables
const initConnection = mysql.createConnection(dbConfig);

initConnection.connect((err) => {
    if (err) {
        console.error("MySQL Server Connection Failed (Initialization):", err.message);
        return;
    }

    const dbName = process.env.DB_NAME || "hr_hiring_system";
    initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
        if (err) {
            console.error("Failed to create database:", err.message);
            initConnection.end();
            return;
        }

        initConnection.query(`USE \`${dbName}\``, async (err) => {
            if (err) {
                console.error("Failed to select database:", err.message);
                initConnection.end();
                return;
            }

            // Create all required tables
            const tables = [
                `CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS jobs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    skills TEXT,
                    experience VARCHAR(100),
                    salary VARCHAR(100),
                    location VARCHAR(255),
                    employment_type VARCHAR(100),
                    jd_file VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Pending',
                    published_by VARCHAR(50) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS job_descriptions (
                    jd_id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    skills TEXT,
                    experience VARCHAR(100),
                    salary VARCHAR(100),
                    location VARCHAR(255),
                    description TEXT,
                    created_by VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS applications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    job_id INT,
                    resume_file VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Pending',
                    match_score INT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS ai_candidates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    skills TEXT,
                    match_score INT,
                    resume_file VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS interviews (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_id INT,
                    candidate_name VARCHAR(255),
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    ai_score INT,
                    interview_date DATE,
                    interview_time VARCHAR(50),
                    mode VARCHAR(100),
                    interviewer VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Scheduled',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS candidates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    resume VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`
            ];

            for (const tableSql of tables) {
                await new Promise((resolve) => {
                    initConnection.query(tableSql, (err) => {
                        if (err) console.error("Error creating table:", err.message);
                        resolve();
                    });
                });
            }

            // Seed default demo users if users table is empty
            initConnection.query("SELECT COUNT(*) as count FROM users", async (err, results) => {
                if (!err && results && results[0].count === 0) {
                    console.log("Seeding default demo users...");
                    const demoUsers = [
                        { name: "Admin User", email: "admin@gmail.com", password: "admin123", role: "Admin" },
                        { name: "HR Manager", email: "hr@gmail.com", password: "123456", role: "HR" },
                        { name: "Candidate User", email: "candidate@gmail.com", password: "123456", role: "Candidate" }
                    ];

                    for (const user of demoUsers) {
                        const hashedPassword = await bcrypt.hash(user.password, 10);
                        initConnection.query(
                            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                            [user.name, user.email, hashedPassword, user.role]
                        );
                    }
                }
            });

            console.log("Database and tables initialized successfully.");
            initConnection.end();
        });
    });
});

// Create and export the pool configured with the database
const pool = mysql.createPool({
    ...dbConfig,
    database: process.env.DB_NAME || "hr_hiring_system",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("HOST:", process.env.DB_HOST);
console.log("USER:", process.env.DB_USER);
console.log("DATABASE:", process.env.DB_NAME);

module.exports = pool;