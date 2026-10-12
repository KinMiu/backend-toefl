const express = require("express");
const router = express.Router();
const practiceController = require("../controller/practiceController");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

router.post("/start", practiceController.startPractice);
router.post("/submit", practiceController.submitPractice);
router.post("/retry-wrong", practiceController.retryWrongQuestions);
router.get("/stats", practiceController.getPracticeStats);

module.exports = router;
