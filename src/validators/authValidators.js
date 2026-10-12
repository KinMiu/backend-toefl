const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

const resetPasswordAdminSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordRequestSchema,
  resetPasswordAdminSchema,
};
