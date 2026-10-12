const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.use(requireAuth, requireAdmin);

router.get("/users", authController.getAdminUsers);
router.post("/reset-password", authController.adminResetPassword);

module.exports = router;
