const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
    getComments,
    createComment,
    updateComment,
    deleteComment
} = require("../controllers/commentController");

router.get("/:resourceType/:resourceId", verifyToken, getComments);
router.post("/", verifyToken, createComment);
router.put("/:id", verifyToken, updateComment);
router.delete("/:id", verifyToken, deleteComment);

module.exports = router;
