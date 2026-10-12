const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const {
  registerSchema,
  loginSchema,
  forgotPasswordRequestSchema,
  resetPasswordAdminSchema,
} = require("../validators/authValidators");

const JWT_SECRET = process.env.JWT_SECRET || "toefl_itb_secret_key_super_secure_2026";

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

exports.register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar. Silakan login atau gunakan email lain.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const newUser = await User.create({
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      resetPasswordRequest: false,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil!",
      data: {
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({
        success: false,
        message: err.errors.map((e) => e.message).join(", "),
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan pada server saat registrasi.",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login berhasil!",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          resetPasswordRequest: user.resetPasswordRequest,
          tempPassword: user.tempPassword,
        },
      },
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({
        success: false,
        message: err.errors.map((e) => e.message).join(", "),
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan pada server saat login.",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengambil data profil.",
    });
  }
};

exports.requestForgotPassword = async (req, res) => {
  try {
    const validatedData = forgotPasswordRequestSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (!user) {
      // Don't disclose user existence for security
      return res.status(200).json({
        success: true,
        message: "Jika email Anda terdaftar, permohonan reset password telah dikirim ke Administrator.",
      });
    }

    user.resetPasswordRequest = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Permintaan reset password berhasil diajukan. Administrator akan mengatur temporary password untuk akun Anda.",
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({
        success: false,
        message: err.errors.map((e) => e.message).join(", "),
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal memproses permintaan reset password.",
    });
  }
};

// Admin: list all users & password requests
exports.getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    const totalUsers = users.length;
    const resetRequestsCount = users.filter((u) => u.resetPasswordRequest).length;
    const adminCount = users.filter((u) => u.role === "admin").length;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        resetRequestsCount,
        adminCount,
        users,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengambil daftar pengguna untuk admin.",
    });
  }
};

// Admin: set temporary password for user
exports.adminResetPassword = async (req, res) => {
  try {
    const validatedData = resetPasswordAdminSchema.parse(req.body);

    const user = await User.findById(validatedData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordRequest = false;
    user.tempPassword = validatedData.newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Password untuk ${user.email} berhasil direset!`,
      data: {
        userId: user._id,
        email: user.email,
        tempPassword: validatedData.newPassword,
      },
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({
        success: false,
        message: err.errors.map((e) => e.message).join(", "),
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mereset password.",
    });
  }
};
