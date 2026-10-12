/**
 * Scoring Service for TOEFL ITP Section 2 (Structure & Written Expression)
 * Official ETS Scale: 31 - 68
 * Estimated Total TOEFL ITP Scale: 310 - 677
 * Concordance to TOEFL iBT Scale: 0 - 120 (ITB Entrance & Scholarship target: iBT 88 / ITP 570-580)
 */

const RAW_TO_SCALED_SEC2 = [
  31, 31, 31, 31, 31, // 0 - 4
  31, 32, 32, 33, 34, // 5 - 9
  35, 36, 37, 38, 39, // 10 - 14
  40, 40, 41, 42, 43, // 15 - 19
  44, 45, 46, 47, 48, // 20 - 24
  49, 50, 51, 52, 53, // 25 - 29
  54, 55, 56, 57, 58, // 30 - 34
  60, 61, 63, 65, 67, // 35 - 39
  68                  // 40
];

const ITP_TO_IBT_BENCHMARKS = [
  { itp: 310, ibt: 0 },
  { itp: 400, ibt: 32 },
  { itp: 450, ibt: 45 },
  { itp: 500, ibt: 61 },
  { itp: 530, ibt: 71 },
  { itp: 550, ibt: 80 },
  { itp: 570, ibt: 88 }, // ITB minimum scholarship/entry target
  { itp: 580, ibt: 92 },
  { itp: 600, ibt: 100 },
  { itp: 627, ibt: 107 },
  { itp: 650, ibt: 114 },
  { itp: 677, ibt: 120 },
];

function calculateScaledSec2(correctAnswers, totalQuestions) {
  if (totalQuestions <= 0) return 31;
  const ratio = Math.max(0, Math.min(1, correctAnswers / totalQuestions));
  const normalizedRaw = Math.round(ratio * 40);
  const clampedRaw = Math.max(0, Math.min(40, normalizedRaw));
  return RAW_TO_SCALED_SEC2[clampedRaw];
}

function calculateEstimatedTotalITP(scaledScoreSec2) {
  // Balanced approximation across sections: Sec2 * 10, capped at ETS max 677
  const score = Math.round(scaledScoreSec2 * 10);
  return Math.max(310, Math.min(677, score));
}

function calculateEquivalentIBT(itpScore) {
  if (itpScore <= 310) return 0;
  if (itpScore >= 677) return 120;

  for (let i = 0; i < ITP_TO_IBT_BENCHMARKS.length - 1; i++) {
    const current = ITP_TO_IBT_BENCHMARKS[i];
    const next = ITP_TO_IBT_BENCHMARKS[i + 1];

    if (itpScore >= current.itp && itpScore <= next.itp) {
      const fraction = (itpScore - current.itp) / (next.itp - current.itp);
      const ibt = current.ibt + fraction * (next.ibt - current.ibt);
      return Math.round(ibt);
    }
  }

  return 88;
}

function generateTopicDiagnostics(evaluatedItems) {
  const map = {};

  evaluatedItems.forEach((item) => {
    const topic = item.topic || "General Structure";
    if (!map[topic]) {
      map[topic] = { topic, correct: 0, total: 0 };
    }
    map[topic].total += 1;
    if (item.isCorrect) {
      map[topic].correct += 1;
    }
  });

  const diagnostics = Object.values(map).map((diag) => {
    const percentage = diag.total > 0 ? Math.round((diag.correct / diag.total) * 100) : 0;
    const isMastered = percentage >= 70;
    return {
      topic: diag.topic,
      correct: diag.correct,
      total: diag.total,
      percentage,
      isMastered,
      status: isMastered ? "safe" : "need_practice",
    };
  });

  // Sort: topics needing practice first
  diagnostics.sort((a, b) => a.percentage - b.percentage);
  return diagnostics;
}

module.exports = {
  calculateScaledSec2,
  calculateEstimatedTotalITP,
  calculateEquivalentIBT,
  generateTopicDiagnostics,
};
