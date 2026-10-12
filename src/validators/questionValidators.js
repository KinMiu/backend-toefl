const { z } = require("zod");

const questionZodSchema = z.object({
  section: z.enum(["structure"]).default("structure"),
  type: z.enum(["sentence_completion", "error_identification"]),
  topic: z.string().min(1, "Topik wajib diisi"),
  question: z.string().min(3, "Pertanyaan wajib diisi"),
  options: z.object({
    A: z.string().min(1, "Opsi A wajib diisi"),
    B: z.string().min(1, "Opsi B wajib diisi"),
    C: z.string().min(1, "Opsi C wajib diisi"),
    D: z.string().min(1, "Opsi D wajib diisi"),
  }),
  answer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().min(3, "Pembahasan wajib diisi"),
  source: z.enum(["manual", "ai"]).default("manual"),
  is_reference: z.boolean().default(true),
});

const geminiQuestionItemSchema = z.object({
  section: z.literal("structure").default("structure"),
  type: z.enum(["sentence_completion", "error_identification"]),
  topic: z.string().min(1),
  question: z.string().min(5),
  options: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
  }),
  answer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().min(5),
});

const geminiBatchSchema = z.array(geminiQuestionItemSchema).min(1);

const excelRowSchema = z.object({
  section: z.string().optional().default("structure"),
  type: z.string().transform((val) => {
    const clean = String(val || "").trim().toLowerCase();
    if (clean === "written expression" || clean === "error identification" || clean === "error_identification") {
      return "error_identification";
    }
    return "sentence_completion";
  }),
  topic: z.string().min(1, "Topik wajib diisi"),
  question: z.string().min(3, "Teks soal wajib diisi"),
  option_a: z.string().min(1, "Pilihan A wajib diisi"),
  option_b: z.string().min(1, "Pilihan B wajib diisi"),
  option_c: z.string().min(1, "Pilihan C wajib diisi"),
  option_d: z.string().min(1, "Pilihan D wajib diisi"),
  answer: z.string().transform((val) => {
    const clean = String(val || "").trim().toUpperCase();
    if (!["A", "B", "C", "D"].includes(clean)) {
      throw new Error(`Jawaban harus salah satu dari A, B, C, atau D. Ditemukan: ${val}`);
    }
    return clean;
  }),
  explanation: z.string().min(3, "Penjelasan pembahasan wajib diisi"),
});

module.exports = {
  questionZodSchema,
  geminiQuestionItemSchema,
  geminiBatchSchema,
  excelRowSchema,
};
