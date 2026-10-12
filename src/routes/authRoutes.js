const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { requireAuth } = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.getMe);
router.post("/forgot-password-request", authController.requestForgotPassword);

module.exports = router;
