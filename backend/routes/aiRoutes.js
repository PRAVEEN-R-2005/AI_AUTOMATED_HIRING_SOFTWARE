const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {
    runAI,
    uploadAndRunAI
} = require("../controllers/aiController");

// ====================
// RUN AI ON EXISTING APPLICATION
// PUT /api/ai/run/:id
// ====================
router.put(
    "/run/:id",
    verifyToken,
    requireRole(["HR", "Admin"]),
    runAI
);

// ====================
// UPLOAD RESUME AND RUN AI
// POST /api/ai/upload-run
// ====================
router.post(
    "/upload-run",
    verifyToken,
    requireRole(["HR", "Admin"]),
    upload.single("resume_file"),
    uploadAndRunAI
);

module.exports = router;