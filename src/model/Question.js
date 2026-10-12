const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      enum: ["structure"],
      default: "structure",
      required: true,
    },
    type: {
      type: String,
      enum: ["sentence_completion", "error_identification"],
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      A: { type: String, required: true, trim: true },
      B: { type: String, required: true, trim: true },
      C: { type: String, required: true, trim: true },
      D: { type: String, required: true, trim: true },
    },
    answer: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ["manual", "ai"],
      default: "manual",
      required: true,
    },
    is_reference: {
      type: Boolean,
      default: true,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "questions",
  }
);

questionSchema.index({ topic: 1, type: 1 });
questionSchema.index({ is_reference: 1, source: 1 });

module.exports = mongoose.model("Question", questionSchema);
