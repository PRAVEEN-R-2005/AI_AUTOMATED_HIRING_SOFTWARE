// Load environment variables before connecting to the database
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// Enforce running against the test database sandbox
process.env.DB_NAME = "hr_hiring_system_test";

const test = require("node:test");
const assert = require("node:assert");
const db = require("../config/db");
const { registerUser, loginUser } = require("../controllers/authController");

// Cleanup helper to run after test sequences
const cleanupDB = () => {
    return new Promise((resolve) => {
        db.query("DELETE FROM users WHERE email LIKE '%@example.com'", () => {
            db.query("DELETE FROM memberships WHERE organization_id = 1 AND user_id NOT IN (1, 2, 3)", () => {
                resolve();
            });
        });
    });
};

test("Authentication Controller Tests", async (t) => {
    // Wait for db pool creation and self-healing tables mapping
    await db.initPromise;
    await cleanupDB();

    await t.test("Register user successfully", async () => {
        const req = {
            body: {
                name: "John Recruiter",
                email: "john@example.com",
                password: "securepassword",
                role: "Recruiter"
            }
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        await new Promise((resolve) => {
            registerUser(req, res);
            // Poll for response resolution
            const check = setInterval(() => {
                if (res.jsonData) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.jsonData.success, true);
        assert.match(res.jsonData.message, /Registered and Workspace/);
    });

    await t.test("Fail registration with duplicate email", async () => {
        const req = {
            body: {
                name: "John Duplicate",
                email: "john@example.com",
                password: "securepassword",
                role: "Recruiter"
            }
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        await new Promise((resolve) => {
            registerUser(req, res);
            const check = setInterval(() => {
                if (res.jsonData) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData.success, false);
        assert.match(res.jsonData.message, /Email already registered/);
    });

    await t.test("Fail registration with short password", async () => {
        const req = {
            body: {
                name: "Short Pass",
                email: "short@example.com",
                password: "123",
                role: "Recruiter"
            }
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        await new Promise((resolve) => {
            registerUser(req, res);
            const check = setInterval(() => {
                if (res.jsonData) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData.success, false);
        assert.match(res.jsonData.message, /Password must be at least 6 characters/);
    });

    await t.test("Login user successfully with correct db credentials", async () => {
        const req = {
            body: {
                email: "john@example.com",
                password: "securepassword"
            }
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        await new Promise((resolve) => {
            loginUser(req, res);
            const check = setInterval(() => {
                if (res.jsonData) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.success, true);
        assert.ok(res.jsonData.token);
        assert.strictEqual(res.jsonData.email, "john@example.com");
    });

    await t.test("Fail login with incorrect password", async () => {
        const req = {
            body: {
                email: "john@example.com",
                password: "wrongpassword"
            }
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        await new Promise((resolve) => {
            loginUser(req, res);
            const check = setInterval(() => {
                if (res.jsonData) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        assert.strictEqual(res.statusCode, 401);
        assert.strictEqual(res.jsonData.success, false);
        assert.match(res.jsonData.message, /Invalid Password/);
    });

    await t.test("Demo bypass should succeed in development/testing mode", async () => {
        process.env.NODE_ENV = "development";
        const req = {
            body: {
                email: "admin@gmail.com",
                password: "admin123"
            }
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        loginUser(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.success, true);
        assert.strictEqual(res.jsonData.role, "Admin");
    });

    await t.test("Demo bypass should fail in production mode", async () => {
        process.env.NODE_ENV = "production";
        
        // Remove admin@gmail.com database record to verify the bypass switch
        await new Promise((resolve) => {
            db.query("DELETE FROM users WHERE email = 'admin@gmail.com'", resolve);
        });

        const req = {
            body: {
                email: "admin@gmail.com",
                password: "admin123"
            }
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        await new Promise((resolve) => {
            loginUser(req, res);
            const check = setInterval(() => {
                if (res.jsonData) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        // Should fall back to DB lookup and return User Not Found (404) or database check since admin@gmail.com is not registered in the clean test DB.
        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.jsonData.success, false);
    });

    // Reset env context and run final cleanup
    process.env.NODE_ENV = "development";
    await cleanupDB();
    
    // Close the database pool connection to allow test runner to exit cleanly
    db.end();
});
