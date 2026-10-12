const Question = require("../model/Question");
const UserQuestionProgress = require("../model/UserQuestionProgress");
const PracticeSession = require("../model/PracticeSession");
const { startPracticeSchema, submitPracticeSchema } = require("../validators/practiceValidators");
const { generateQuestionsBatch } = require("../services/geminiService");
const {
  calculateScaledSec2,
  calculateEstimatedTotalITP,
  calculateEquivalentIBT,
  generateTopicDiagnostics,
} = require("../services/scoringService");
const logger = require("../utils/logger");

/**
 * Start Practice Session with Spaced Repetition System (SRS) & Adaptive Generation
 */
exports.startPractice = async (req, res) => {
  try {
    const validated = startPracticeSchema.parse(req.body);
    const targetCount = validated.questionCount || 10;
    const userId = req.user._id;

    // 1. Ambil jumlah sesi user sejauh ini untuk mengecek Surprise Check (kelipatan 10)
    const userSessionCount = await PracticeSession.countDocuments({ userId });
    const isSurpriseCheckSession = (userSessionCount + 1) % 10 === 0;

    let selectedQuestions = [];

    // 2. Jika sesi Surprise Check (kelipatan 10), ambil 1-2 soal berstatus "kept"
    if (isSurpriseCheckSession) {
      const keptProgress = await UserQuestionProgress.find({
        userId,
        status: "kept",
      })
        .sort({ lastAttempt: 1 })
        .limit(2)
        .populate("questionId");

      for (const p of keptProgress) {
        if (p.questionId) {
          selectedQuestions.push(p.questionId);
        }
      }
    }

    // 3. Ambil progres user yang "active"
    const activeProgress = await UserQuestionProgress.find({
      userId,
      status: "active",
    })
      .sort({ streak_correct: 1, lastAttempt: 1 })
      .populate("questionId");

    const activeQuestionIdsFromProgress = new Set();
    for (const p of activeProgress) {
      if (p.questionId && !selectedQuestions.some((q) => q._id.toString() === p.questionId._id.toString())) {
        selectedQuestions.push(p.questionId);
        activeQuestionIdsFromProgress.add(p.questionId._id.toString());
      }
      if (selectedQuestions.length >= targetCount) break;
    }

    // 4. Jika masih kurang, cari soal yang belum pernah dikerjakan user sama sekali
    if (selectedQuestions.length < targetCount) {
      const allTestedProgress = await UserQuestionProgress.find({ userId }).select("questionId");
      const testedIds = allTestedProgress.map((p) => p.questionId.toString());

      const unattemptedQuestions = await Question.find({
        _id: { $nin: [...testedIds, ...selectedQuestions.map((q) => q._id.toString())] },
      }).limit(targetCount - selectedQuestions.length);

      selectedQuestions.push(...unattemptedQuestions);
    }

    // 5. Jika total soal yang tersedia di database masih KURANG dari targetCount:
    // Panggil Gemini AI generator batch 5-10 soal baru (dengan guardrail mutlak)
    if (selectedQuestions.length < targetCount) {
      const shortage = targetCount - selectedQuestions.length;
      logger.info(`Soal kurang ${shortage}. Memanggil Gemini AI Generator...`);
      const generatedQuestions = await generateQuestionsBatch(Math.max(5, shortage));
      selectedQuestions.push(...generatedQuestions.slice(0, shortage));
    }

    // 6. Jika masih kurang juga (misal database baru awal diinstal dan AI offline), ambil soal acak yang ada
    if (selectedQuestions.length < targetCount) {
      const existingRemaining = await Question.find({
        _id: { $nin: selectedQuestions.map((q) => q._id.toString()) },
      }).limit(targetCount - selectedQuestions.length);
      selectedQuestions.push(...existingRemaining);
    }

    // Acak urutan soal agar tidak monoton
    selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, targetCount);

    // Keamanan: buang kunci jawaban 'answer' dan 'explanation' saat dikirim ke frontend
    const clientQuestions = selectedQuestions.map((q, index) => ({
      _id: q._id,
      index: index + 1,
      section: q.section,
      type: q.type,
      topic: q.topic,
      question: q.question,
      options: q.options,
    }));

    return res.status(200).json({
      success: true,
      data: {
        sessionNumber: userSessionCount + 1,
        isSurpriseCheckSession,
        timePerQuestionSec: validated.timePerQuestionSec || null,
        totalQuestions: clientQuestions.length,
        questions: clientQuestions,
      },
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({
        success: false,
        message: err.errors.map((e) => e.message).join(", "),
      });
    }
    logger.error(`Error in startPractice: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal memulai sesi latihan.",
    });
  }
};

/**
 * Submit Practice Session, calculate TOEFL ITP / iBT scores and update SRS streaks
 */
exports.submitPractice = async (req, res) => {
  try {
    const validated = submitPracticeSchema.parse(req.body);
    const userId = req.user._id;
    const userAnswers = validated.answers;

    const questionIds = userAnswers.map((a) => a.questionId);
    const questionsFromDb = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map();
    questionsFromDb.forEach((q) => questionMap.set(q._id.toString(), q));

    let correctCount = 0;
    const wrongQuestionIds = [];
    const evaluatedItems = [];

    // Evaluasi jawaban
    for (const item of userAnswers) {
      const q = questionMap.get(item.questionId);
      if (!q) continue;

      const isCorrect = item.selectedAnswer === q.answer;
      if (isCorrect) {
        correctCount += 1;
      } else {
        wrongQuestionIds.push(q._id);
      }

      evaluatedItems.push({
        questionId: q._id,
        topic: q.topic,
        type: q.type,
        question: q.question,
        options: q.options,
        selectedAnswer: item.selectedAnswer || null,
        correctAnswer: q.answer,
        isCorrect,
        explanation: q.explanation,
      });

      // Update Spaced Repetition System (SRS) progres user
      let progress = await UserQuestionProgress.findOne({
        userId,
        questionId: q._id,
      });

      if (!progress) {
        progress = new UserQuestionProgress({
          userId,
          questionId: q._id,
          streak_correct: 0,
          status: "active",
          timesTested: 0,
        });
      }

      progress.timesTested += 1;
      progress.lastAttempt = new Date();

      if (isCorrect) {
        progress.streak_correct += 1;
        // Rule: Jika streak_correct >= 5, status berubah jadi "kept"
        if (progress.streak_correct >= 5) {
          progress.status = "kept";
        }
      } else {
        // Jika salah, streak kembali ke 0 dan status jadi "active"
        progress.streak_correct = 0;
        progress.status = "active";
      }

      await progress.save();
    }

    const totalQuestions = userAnswers.length;
    const scaledScoreSec2 = calculateScaledSec2(correctCount, totalQuestions);
    const estimatedTotalITP = calculateEstimatedTotalITP(scaledScoreSec2);
    const equivalentIBT = calculateEquivalentIBT(estimatedTotalITP);
    const topicDiagnostics = generateTopicDiagnostics(evaluatedItems);

    // Simpan PracticeSession
    const sessionDoc = await PracticeSession.create({
      userId,
      totalQuestions,
      correctAnswers: correctCount,
      scaledScoreSec2,
      estimatedTotalITP,
      equivalentIBT,
      wrongQuestionIds,
      topicDiagnostics: topicDiagnostics.map((t) => ({
        topic: t.topic,
        correct: t.correct,
        total: t.total,
      })),
      answers: evaluatedItems.map((e) => ({
        questionId: e.questionId,
        selectedAnswer: e.selectedAnswer,
        isCorrect: e.isCorrect,
      })),
      timePerQuestionSec: validated.timePerQuestionSec || null,
    });

    return res.status(200).json({
      success: true,
      message: "Hasil latihan berhasil dievaluasi!",
      data: {
        sessionId: sessionDoc._id,
        totalQuestions,
        correctAnswers: correctCount,
        accuracyPercentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
        scaledScoreSec2,
        estimatedTotalITP,
        equivalentIBT,
        targetITB: {
          targetITP: 580,
          targetIBT: 88,
          isPassingITP: estimatedTotalITP >= 580,
          isPassingIBT: equivalentIBT >= 88,
          gapITP: 580 - estimatedTotalITP,
          gapIBT: 88 - equivalentIBT,
        },
        topicDiagnostics,
        wrongQuestionIds,
        reviewItems: evaluatedItems,
      },
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({
        success: false,
        message: err.errors.map((e) => e.message).join(", "),
      });
    }
    logger.error(`Error in submitPractice: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengevaluasi latihan.",
    });
  }
};

/**
 * Start immediate practice with the specific wrong questions from recent attempt
 */
exports.retryWrongQuestions = async (req, res) => {
  try {
    const { questionIds } = req.body;
    let targetIds = questionIds;

    // Jika tidak dikirim via body, ambil wrongQuestionIds dari session terakhir user
    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      const lastSession = await PracticeSession.findOne({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .select("wrongQuestionIds");

      if (lastSession && lastSession.wrongQuestionIds && lastSession.wrongQuestionIds.length > 0) {
        targetIds = lastSession.wrongQuestionIds;
      } else {
        return res.status(400).json({
          success: false,
          message: "Tidak ada soal yang salah dari sesi sebelumnya.",
        });
      }
    }

    const questions = await Question.find({ _id: { $in: targetIds } });

    const clientQuestions = questions.map((q, index) => ({
      _id: q._id,
      index: index + 1,
      section: q.section,
      type: q.type,
      topic: q.topic,
      question: q.question,
      options: q.options,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalQuestions: clientQuestions.length,
        questions: clientQuestions,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal memuat soal latihan khusus.",
    });
  }
};

/**
 * User Dashboard Stats & Diagnostics History
 */
exports.getPracticeStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalBankQuestions, userProgressList, userSessions] = await Promise.all([
      Question.countDocuments(),
      UserQuestionProgress.find({ userId }),
      PracticeSession.find({ userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    const activeCount = userProgressList.filter((p) => p.status === "active").length;
    const keptCount = userProgressList.filter((p) => p.status === "kept").length;

    let totalAttempted = 0;
    let totalCorrect = 0;
    userSessions.forEach((s) => {
      totalAttempted += s.totalQuestions;
      totalCorrect += s.correctAnswers;
    });

    const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    const latestSession = userSessions[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        totalBankQuestions,
        totalAttempted,
        totalCorrect,
        overallAccuracy,
        srsActive: activeCount,
        srsKept: keptCount,
        studyStreak: userSessions.length > 0 ? Math.min(userSessions.length, 7) : 1, // streak days indicator
        latestScore: latestSession
          ? {
              scaledScoreSec2: latestSession.scaledScoreSec2,
              estimatedTotalITP: latestSession.estimatedTotalITP,
              equivalentIBT: latestSession.equivalentIBT,
              createdAt: latestSession.createdAt,
            }
          : null,
        recentSessions: userSessions.map((s) => ({
          _id: s._id,
          date: s.createdAt,
          totalQuestions: s.totalQuestions,
          correctAnswers: s.correctAnswers,
          scaledScoreSec2: s.scaledScoreSec2,
          estimatedTotalITP: s.estimatedTotalITP,
          equivalentIBT: s.equivalentIBT,
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal memuat statistik latihan.",
    });
  }
};
