const mongoose = require("mongoose");

const userQuestionProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },
    streak_correct: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "kept"],
      default: "active",
      index: true,
    },
    lastAttempt: {
      type: Date,
      default: Date.now,
    },
    timesTested: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "user_question_progress",
  }
);

userQuestionProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("UserQuestionProgress", userQuestionProgressSchema);
