const xlsx = require("xlsx");
const Question = require("../model/Question");
const { excelRowSchema } = require("../validators/questionValidators");

/**
 * Generate sample Excel workbook buffer with sample questions and instructions
 */
function generateTemplateWorkbook() {
  const sampleData = [
    {
      Type: "sentence_completion",
      Topic: "Inversion",
      Question: "Not only _______ the prestigious scholarship, but she also secured an internship at ITB.",
      Option_A: "did she receive",
      Option_B: "she received",
      Option_C: "she has received",
      Option_D: "had she received",
      Answer: "A",
      Explanation: "Ketika kalimat diawali dengan negative correlative 'Not only', susunan kalimat mengalami inversi (auxiliary verb 'did' mendahului subjek 'she')."
    },
    {
      Type: "sentence_completion",
      Topic: "Reduced Clause",
      Question: "_______ in 1920, the Bandung Institute of Technology is one of the oldest higher education institutions in Indonesia.",
      Option_A: "Founded",
      Option_B: "Founding",
      Option_C: "Was founded",
      Option_D: "Having founded",
      Answer: "A",
      Explanation: "Bentuk past participle 'Founded' digunakan dalam reduced adjective clause pasif (Which was founded in 1920...)."
    },
    {
      Type: "error_identification",
      Topic: "Parallelism",
      Question: "The engineering syllabus includes designing civil structures, [calculating](A) material stresses, and [to analyze](B) [environmental](C) impact [factors](D).",
      Option_A: "calculating",
      Option_B: "to analyze",
      Option_C: "environmental",
      Option_D: "factors",
      Answer: "B",
      Explanation: "Prinsip paralelisme mengharuskan 'to analyze' disesuaikan dengan bentuk gerund sebelumnya ('designing', 'calculating') menjadi 'analyzing'."
    },
    {
      Type: "error_identification",
      Topic: "Subject-Verb Agreement",
      Question: "Neither the principal investigator nor the [graduate students](A) [was](B) aware of the [anomalies](C) in the latest [spectrometry](D) dataset.",
      Option_A: "graduate students",
      Option_B: "was",
      Option_C: "anomalies",
      Option_D: "spectrometry",
      Answer: "B",
      Explanation: "Pada struktur 'Neither... nor...', kata kerja harus menyelaraskan dengan subjek terdekat ('graduate students' = jamak), sehingga seharusnya 'were', bukan 'was'."
    }
  ];

  const ws = xlsx.utils.json_to_sheet(sampleData);
  // Set column widths
  ws["!cols"] = [
    { wch: 22 }, // Type
    { wch: 22 }, // Topic
    { wch: 50 }, // Question
    { wch: 20 }, // Option_A
    { wch: 20 }, // Option_B
    { wch: 20 }, // Option_C
    { wch: 20 }, // Option_D
    { wch: 10 }, // Answer
    { wch: 60 }, // Explanation
  ];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Template_Soal_TOEFL");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
}

/**
 * Parse Excel / CSV buffer and bulk insert into Question collection
 */
async function processExcelImport(fileBuffer) {
  const wb = xlsx.read(fileBuffer, { type: "buffer" });
  const firstSheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[firstSheetName];

  const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

  if (!rawRows || rawRows.length === 0) {
    throw new Error("File Excel kosong atau format tidak memiliki data baris.");
  }

  const successList = [];
  const errors = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const rowNumber = idx + 2; // header is row 1

    // Normalize keys (case-insensitive)
    const normalized = {};
    for (const key of Object.keys(row)) {
      const lowerKey = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
      normalized[lowerKey] = String(row[key] || "").trim();
    }

    try {
      const validated = excelRowSchema.parse({
        section: "structure",
        type: normalized.type,
        topic: normalized.topic,
        question: normalized.question,
        option_a: normalized.option_a || normalized.a || normalized.opsi_a,
        option_b: normalized.option_b || normalized.b || normalized.opsi_b,
        option_c: normalized.option_c || normalized.c || normalized.opsi_c,
        option_d: normalized.option_d || normalized.d || normalized.opsi_d,
        answer: normalized.answer || normalized.kunci_jawaban || normalized.kunci,
        explanation: normalized.explanation || normalized.pembahasan || normalized.penjelasan,
      });

      const doc = {
        section: "structure",
        type: validated.type,
        topic: validated.topic,
        question: validated.question,
        options: {
          A: validated.option_a,
          B: validated.option_b,
          C: validated.option_c,
          D: validated.option_d,
        },
        answer: validated.answer,
        explanation: validated.explanation,
        source: "manual",
        is_reference: true, // Manual imported questions serve as reference
      };

      successList.push(doc);
    } catch (valErr) {
      errors.push({
        row: rowNumber,
        error: valErr.errors ? valErr.errors.map((e) => e.message).join(", ") : valErr.message,
      });
    }
  }

  let insertedCount = 0;
  if (successList.length > 0) {
    const inserted = await Question.insertMany(successList);
    insertedCount = inserted.length;
  }

  return {
    totalRows: rawRows.length,
    insertedCount,
    errors,
  };
}

module.exports = {
  generateTemplateWorkbook,
  processExcelImport,
};
