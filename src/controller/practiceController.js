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

    // 2. Tentukan target komposisi Part A (Sentence Completion) & Part B (Error Identification)
    // Untuk simulasi full 40 soal Section 2: 15 soal Part A dan 25 soal Part B
    const targetPartA = targetCount === 40 ? 15 : Math.max(1, Math.round(targetCount * (15 / 40)));
    const targetPartB = targetCount - targetPartA;

    const selectedIdSet = new Set();
    const selectedPartA = [];
    const selectedPartB = [];

    const addQuestion = (q) => {
      if (!q || !q._id) return false;
      const idStr = q._id.toString();
      if (selectedIdSet.has(idStr)) return false;
      selectedIdSet.add(idStr);

      if (q.type === "sentence_completion") {
        selectedPartA.push(q);
      } else {
        selectedPartB.push(q);
      }
      return true;
    };

    // Helper untuk shuffle array in-place
    const shuffleArray = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // Step A: Surprise Check (kelipatan 10): ambil 1-2 soal "kept"
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
          if (p.questionId.type === "sentence_completion" && selectedPartA.length < targetPartA) {
            addQuestion(p.questionId);
          } else if (p.questionId.type === "error_identification" && selectedPartB.length < targetPartB) {
            addQuestion(p.questionId);
          }
        }
      }
    }

    // Step B: Ambil progres user yang "active" (prioritaskan yang streak rendah / perlu penguatan)
    const activeProgress = await UserQuestionProgress.find({
      userId,
      status: "active",
    })
      .sort({ streak_correct: 1, lastAttempt: 1 })
      .populate("questionId");

    for (const p of activeProgress) {
      if (p.questionId) {
        if (p.questionId.type === "sentence_completion" && selectedPartA.length < targetPartA) {
          addQuestion(p.questionId);
        } else if (p.questionId.type === "error_identification" && selectedPartB.length < targetPartB) {
          addQuestion(p.questionId);
        }
      }
      if (selectedPartA.length >= targetPartA && selectedPartB.length >= targetPartB) break;
    }

    // Ambil daftar ID soal yang pernah dikerjakan user
    const allTestedProgress = await UserQuestionProgress.find({ userId }).select("questionId");
    const testedIds = allTestedProgress.map((p) => p.questionId.toString());

    // Step C: Ambil soal yang belum pernah dikerjakan user sama sekali (fresh questions)
    if (selectedPartA.length < targetPartA) {
      const neededA = targetPartA - selectedPartA.length;
      const unattemptedA = await Question.find({
        type: "sentence_completion",
        _id: { $nin: [...testedIds, ...Array.from(selectedIdSet)] },
      }).limit(neededA);
      unattemptedA.forEach((q) => addQuestion(q));
    }

    if (selectedPartB.length < targetPartB) {
      const neededB = targetPartB - selectedPartB.length;
      const unattemptedB = await Question.find({
        type: "error_identification",
        _id: { $nin: [...testedIds, ...Array.from(selectedIdSet)] },
      }).limit(neededB);
      unattemptedB.forEach((q) => addQuestion(q));
    }

    // Step D: Jika user sudah pernah mencoba semua soal di bank, ambil soal yang belum terpilih di sesi ini
    if (selectedPartA.length < targetPartA) {
      const neededA = targetPartA - selectedPartA.length;
      const remainingA = await Question.find({
        type: "sentence_completion",
        _id: { $nin: Array.from(selectedIdSet) },
      }).limit(neededA);
      remainingA.forEach((q) => addQuestion(q));
    }

    if (selectedPartB.length < targetPartB) {
      const neededB = targetPartB - selectedPartB.length;
      const remainingB = await Question.find({
        type: "error_identification",
        _id: { $nin: Array.from(selectedIdSet) },
      }).limit(neededB);
      remainingB.forEach((q) => addQuestion(q));
    }

    // Step E: Jika masih kurang juga (misal database minim), panggil Gemini AI Generator batch
    if (selectedIdSet.size < targetCount) {
      const shortage = targetCount - selectedIdSet.size;
      logger.info(`Soal unik di database kurang (${selectedIdSet.size}/${targetCount}). Memanggil Gemini AI Generator untuk ${shortage} soal...`);
      try {
        const generatedQuestions = await generateQuestionsBatch(Math.max(5, shortage));
        for (const gq of generatedQuestions) {
          if (selectedIdSet.size >= targetCount) break;
          addQuestion(gq);
        }
      } catch (genErr) {
        logger.warn(`AI generation fallback warning: ${genErr.message}`);
      }
    }

    // Step F: Jika salah satu tipe masih kurang tapi tipe lainnya ada di bank, isi tanpa memandang tipe (tetap wajib 100% UNIK)
    if (selectedIdSet.size < targetCount) {
      const remainingAny = await Question.find({
        _id: { $nin: Array.from(selectedIdSet) },
      }).limit(targetCount - selectedIdSet.size);
      remainingAny.forEach((q) => addQuestion(q));
    }

    // Step G: Susun soal sesuai urutan resmi TOEFL ITP Section 2:
    // - Part A (Sentence Completion) selalu tampil di awal (No 1-15 pada paket 40)
    // - Part B (Error Identification) selalu tampil di bagian kedua (No 16-40 pada paket 40)
    // - Masing-masing bagian diacak urutan nomornya agar tidak monoton
    const finalPartA = shuffleArray([...selectedPartA]);
    const finalPartB = shuffleArray([...selectedPartB]);
    const selectedQuestions = [...finalPartA, ...finalPartB].slice(0, targetCount);

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
        timerType: validated.timerType || (validated.totalTimeSec ? "session" : validated.timePerQuestionSec ? "question" : "none"),
        totalTimeSec: validated.totalTimeSec || null,
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
      timerType: validated.timerType || (validated.totalTimeSec ? "session" : validated.timePerQuestionSec ? "question" : "none"),
      totalTimeSec: validated.totalTimeSec || null,
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
