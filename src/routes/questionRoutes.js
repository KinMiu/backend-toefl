const express = require("express");
const router = express.Router();
const multer = require("multer");
const questionController = require("../controller/questionController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Download template can be accessed with auth
router.get("/template-excel", requireAuth, questionController.downloadTemplateExcel);

// Public / Authenticated read list of questions
router.get("/", requireAuth, questionController.getQuestions);

// Admin-only management
router.post("/", requireAuth, requireAdmin, questionController.createQuestion);
router.delete("/:id", requireAuth, requireAdmin, questionController.deleteQuestion);
router.post(
  "/import-excel",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  questionController.importExcel
);

module.exports = router;
