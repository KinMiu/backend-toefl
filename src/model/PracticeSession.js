const mongoose = require("mongoose");

const practiceSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    scaledScoreSec2: {
      type: Number,
      required: true,
      min: 31,
      max: 68,
    },
    estimatedTotalITP: {
      type: Number,
      required: true,
      min: 310,
      max: 677,
    },
    equivalentIBT: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },
    wrongQuestionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    topicDiagnostics: [
      {
        topic: { type: String, required: true },
        correct: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        selectedAnswer: { type: String },
        isCorrect: { type: Boolean },
      },
    ],
    timerType: {
      type: String,
      enum: ["session", "question", "none"],
      default: "question",
    },
    totalTimeSec: {
      type: Number,
      default: null,
    },
    timePerQuestionSec: {
      type: Number,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "sessions",
  }
);

module.exports = mongoose.model("PracticeSession", practiceSessionSchema);
