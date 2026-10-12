const jwt = require("jsonwebtoken");
const User = require("../model/User");

const JWT_SECRET = process.env.JWT_SECRET || "toefl_itb_secret_key_super_secure_2026";

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak. Token autentikasi tidak ditemukan.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Pengguna tidak ditemukan atau sesi telah kedaluwarsa.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau telah kedaluwarsa.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Fitur ini hanya untuk Administrator.",
    });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
