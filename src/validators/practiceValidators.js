const { z } = require("zod");

const startPracticeSchema = z.object({
  questionCount: z.number().int().min(1).max(50).default(10),
  timerType: z.enum(["session", "question", "none"]).optional(),
  totalTimeSec: z.number().int().positive().nullable().optional(),
  timePerQuestionSec: z.number().int().positive().nullable().optional(),
});

const submitPracticeSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1, "questionId wajib diisi"),
      selectedAnswer: z.enum(["A", "B", "C", "D"]).nullable().optional(),
    })
  ).min(1, "Minimal ada 1 jawaban dikirim"),
  timerType: z.enum(["session", "question", "none"]).optional(),
  totalTimeSec: z.number().nullable().optional(),
  timePerQuestionSec: z.number().nullable().optional(),
});

module.exports = {
  startPracticeSchema,
  submitPracticeSchema,
};
