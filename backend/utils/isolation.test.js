// Load environment variables before connecting to the database
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// Enforce running against the test database sandbox
process.env.DB_NAME = "hr_hiring_system_test";

const test = require("node:test");
const assert = require("node:assert");
const db = require("../config/db");
const { getAllJD, createJD, updateJD } = require("../controllers/jobDescriptionController");

// Cleanup helper
const cleanupDB = () => {
    return new Promise((resolve) => {
        db.query("DELETE FROM job_descriptions WHERE title LIKE '%Test JD%'", () => {
            db.query("DELETE FROM memberships WHERE user_id IN (1001, 1002)", () => {
                db.query("DELETE FROM users WHERE id IN (1001, 1002)", () => {
                    db.query("DELETE FROM organizations WHERE id IN (101, 102)", () => {
                        resolve();
                    });
                });
            });
        });
    });
};

test("Multi-Tenant Organization Isolation Tests", async (t) => {
    // Wait for DB pool to initialize
    await db.initPromise;
    await cleanupDB();

    // 1. Seed two test organizations
    await new Promise((resolve) => {
        db.query("INSERT INTO organizations (id, name, slug) VALUES (101, 'Org One', 'org-one'), (102, 'Org Two', 'org-two')", resolve);
    });

    // 2. Seed recruiters for each organization
    await new Promise((resolve) => {
        db.query(`
            INSERT INTO users (id, name, email, password, role) VALUES 
            (1001, 'Recruiter One', 'rec1@example.com', 'pwd', 'HR'),
            (1002, 'Recruiter Two', 'rec2@example.com', 'pwd', 'HR')
        `, resolve);
    });

    // 3. Seed memberships
    await new Promise((resolve) => {
        db.query(`
            INSERT INTO memberships (user_id, organization_id, role, status) VALUES 
            (1001, 101, 'Recruiter', 'ACTIVE'),
            (1002, 102, 'Recruiter', 'ACTIVE')
        `, resolve);
    });

    // 4. Create Job Requisition for Org One
    let jdIdOne = null;
    await new Promise((resolve) => {
        const req = {
            user: { email: "rec1@example.com", organization_id: 101, role: "HR" },
            body: { title: "Test JD Org One", skills: "JS", experience: "2", salary: "10k", location: "Remote", description: "JD" }
        };
        const res = {
            status(code) { return this; },
            json(data) {
                resolve();
            }
        };
        createJD(req, res);
    });

    // Fetch the created JD id
    await new Promise((resolve) => {
        db.query("SELECT jd_id FROM job_descriptions WHERE title = 'Test JD Org One'", (err, rows) => {
            if (rows && rows.length > 0) {
                jdIdOne = rows[0].jd_id;
            }
            resolve();
        });
    });

    await t.test("Recruiter One can fetch Org One JDs", async () => {
        const req = {
            user: { id: 1001, email: "rec1@example.com", organization_id: 101, role: "HR" }
        };
        const res = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        await new Promise((resolve) => {
            getAllJD(req, res);
            const check = setInterval(() => {
                if (res.jsonData) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        assert.strictEqual(res.statusCode, 200);
        assert.ok(Array.isArray(res.jsonData));
        assert.ok(res.jsonData.some(jd => jd.title === "Test JD Org One"));
    });

    await t.test("Recruiter Two cannot fetch Org One JDs", async () => {
        const req = {
            user: { id: 1002, email: "rec2@example.com", organization_id: 102, role: "HR" }
        };
        const res = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        await new Promise((resolve) => {
            getAllJD(req, res);
            const check = setInterval(() => {
                if (res.jsonData) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.some(jd => jd.title === "Test JD Org One"), false);
    });

    await t.test("Recruiter Two is blocked from updating Org One JD", async () => {
        const req = {
            user: { id: 1002, email: "rec2@example.com", organization_id: 102, role: "HR" },
            params: { id: jdIdOne },
            body: { title: "Hacked Title", skills: "JS", experience: "2", salary: "10k", location: "Remote", description: "JD" }
        };
        const res = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(data) {
                this.jsonData = data;
                return this;
            }
        };

        await new Promise((resolve) => {
            updateJD(req, res);
            const check = setInterval(() => {
                if (res.jsonData) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.jsonData.message, "Access Denied: Unauthorized to modify this resource");
    });

    // Reset and cleanup
    await cleanupDB();
    db.end();
});
