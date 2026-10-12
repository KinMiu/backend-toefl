const Question = require("../model/Question");
const { questionZodSchema } = require("../validators/questionValidators");
const { generateTemplateWorkbook, processExcelImport } = require("../services/excelService");
const logger = require("../utils/logger");

/**
 * Get Question Bank list with filters & pagination
 */
exports.getQuestions = async (req, res) => {
  try {
    const { topic, type, source, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (topic && topic !== "all") {
      query.topic = topic;
    }
    if (type && type !== "all") {
      query.type = type;
    }
    if (source && source !== "all") {
      query.source = source;
    }
    if (search && search.trim().length > 0) {
      query.$or = [
        { question: { $regex: search.trim(), $options: "i" } },
        { topic: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, questions, availableTopics] = await Promise.all([
      Question.countDocuments(query),
      Question.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Question.distinct("topic"),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        availableTopics,
        questions,
      },
    });
  } catch (err) {
    logger.error(`Error in getQuestions: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengambil daftar soal.",
    });
  }
};

/**
 * Create a new question manually
 */
exports.createQuestion = async (req, res) => {
  try {
    const validated = questionZodSchema.parse(req.body);

    const question = await Question.create({
      ...validated,
      source: "manual",
      is_reference: true,
    });

    return res.status(201).json({
      success: true,
      message: "Soal berhasil ditambahkan!",
      data: question,
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
      message: err.message || "Gagal menambahkan soal.",
    });
  }
};

/**
 * Delete a question by ID
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Soal berhasil dihapus.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal menghapus soal.",
    });
  }
};

/**
 * Download sample Excel template
 */
exports.downloadTemplateExcel = async (req, res) => {
  try {
    const buffer = generateTemplateWorkbook();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Template_Soal_TOEFL_ITP.xlsx"'
    );
    return res.send(buffer);
  } catch (err) {
    logger.error(`Error generating Excel template: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Gagal membuat template file Excel.",
    });
  }
};

/**
 * Bulk import questions via Excel / CSV file
 */
exports.importExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "File Excel (.xlsx / .csv) wajib diunggah.",
      });
    }

    const result = await processExcelImport(req.file.buffer);

    return res.status(200).json({
      success: true,
      message: `Berhasil mengimpor ${result.insertedCount} dari ${result.totalRows} baris soal.`,
      data: result,
    });
  } catch (err) {
    logger.error(`Error importing Excel: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: err.message || "Gagal memproses file Excel.",
    });
  }
};
