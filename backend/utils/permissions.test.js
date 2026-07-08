const test = require("node:test");
const assert = require("node:assert");
const { hasPermission, ROLES, PERMISSIONS } = require("./permissions");

test("Permissions Unit Tests", () => {
    test("Admin should have all permissions", () => {
        const allPerms = Object.values(PERMISSIONS);
        for (const perm of allPerms) {
            assert.strictEqual(hasPermission(ROLES.ADMIN, perm), true);
        }
    });

    test("Recruiter should have core recruitment permissions", () => {
        assert.strictEqual(hasPermission(ROLES.RECRUITER, PERMISSIONS.JOB_CREATE), true);
        assert.strictEqual(hasPermission(ROLES.RECRUITER, PERMISSIONS.APPLICATION_VIEW), true);
        assert.strictEqual(hasPermission(ROLES.RECRUITER, PERMISSIONS.AUDIT_LOG_VIEW), false);
    });

    test("Candidate should only have JOB_VIEW permission", () => {
        assert.strictEqual(hasPermission(ROLES.CANDIDATE, PERMISSIONS.JOB_VIEW), true);
        assert.strictEqual(hasPermission(ROLES.CANDIDATE, PERMISSIONS.JOB_CREATE), false);
        assert.strictEqual(hasPermission(ROLES.CANDIDATE, PERMISSIONS.APPLICATION_VIEW), false);
    });

    test("Interviewer should only have interview and organization permissions", () => {
        assert.strictEqual(hasPermission(ROLES.INTERVIEWER, PERMISSIONS.INTERVIEW_VIEW), true);
        assert.strictEqual(hasPermission(ROLES.INTERVIEWER, PERMISSIONS.INTERVIEW_FEEDBACK_SUBMIT), true);
        assert.strictEqual(hasPermission(ROLES.INTERVIEWER, PERMISSIONS.JOB_CREATE), false);
        assert.strictEqual(hasPermission(ROLES.INTERVIEWER, PERMISSIONS.TEAM_VIEW), false);
    });
});
