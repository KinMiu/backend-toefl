const router = require("express").Router();
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const practiceRoutes = require("./practiceRoutes");
const questionRoutes = require("./questionRoutes");

router.use("/api/auth", authRoutes);
router.use("/api/admin", adminRoutes);
router.use("/api/practice", practiceRoutes);
router.use("/api/questions", questionRoutes);

// Health check
router.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "TOEFL ITP ITB Practice API",
    time: new Date(),
  });
});

module.exports = router;
