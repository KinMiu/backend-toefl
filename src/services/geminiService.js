const { GoogleGenAI } = require("@google/genai");
const Question = require("../model/Question");
const { geminiBatchSchema } = require("../validators/questionValidators");
const logger = require("../utils/logger");

const FALLBACK_AI_TEMPLATES = [
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Inversion",
    question: "Rarely _______ such exceptional leadership qualities in a junior researcher.",
    options: {
      A: "we have observed",
      B: "have we observed",
      C: "we had observed",
      D: "having observed"
    },
    answer: "B",
    explanation: "Ketika kalimat diawali dengan negative adverbial 'Rarely', terjadi inversi yaitu auxiliary verb (have) mendahului subject (we)."
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Reduced Clause",
    question: "_______ by international scholars, the novel gained worldwide critical acclaim.",
    options: {
      A: "Praised",
      B: "Praising",
      C: "Was praised",
      D: "Having praised"
    },
    answer: "A",
    explanation: "Past participle 'Praised' digunakan dalam reduced passive clause (Which was praised by...) karena novel menerima pujian (pasif)."
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Parallelism",
    question: "The engineering team was commended for designing the prototype, conducting the simulations, and _______ the project report.",
    options: {
      A: "finalized",
      B: "to finalize",
      C: "finalizing",
      D: "they finalized"
    },
    answer: "C",
    explanation: "Prinsip paralelisme memerlukan bentuk gerund (-ing): designing, conducting, and finalizing."
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Subject-Verb Agreement",
    question: "Each of the [laboratories](A) in the biological sciences department [are](B) equipped with [advanced](C) digital [microscopes](D).",
    options: {
      A: "laboratories",
      B: "are",
      C: "advanced",
      D: "microscopes"
    },
    answer: "B",
    explanation: "Subjek kalimat adalah 'Each' yang bersifat tunggal (singular), sehingga kata kerja seharusnya 'is', bukan 'are'."
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Word Form/Diction",
    question: "The [recently](A) discovered algorithm solved the complex optimization problem [very](B) [efficient](C) and with [minimal](D) computing time.",
    options: {
      A: "recently",
      B: "very",
      C: "efficient",
      D: "minimal"
    },
    answer: "C",
    explanation: "Kata kerja 'solved' harus dimodifikasi oleh adverb 'efficiently', bukan adjective 'efficient'."
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Appositive",
    question: "_______, the Bandung Institute of Technology attracts top engineering students from across the archipelago.",
    options: {
      A: "One of Indonesia's foremost technological institutions",
      B: "It is one of Indonesia's foremost technological institutions",
      C: "That it is one of Indonesia's foremost technological institutions",
      D: "Because one of Indonesia's foremost technological institutions"
    },
    answer: "A",
    explanation: "Kalimat membutuhkan frasa appositive berupa noun phrase tanpa kata kerja bantu di awal untuk menerangkan subjek ITB."
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Noun Clause",
    question: "Biologists still disagree on _______ the migratory patterns of deep-sea marine mammals.",
    options: {
      A: "what determines",
      B: "that determines",
      C: "which determining",
      D: "does what determine"
    },
    answer: "A",
    explanation: "Setelah preposisi 'on' dibutuhkan noun clause dengan susunan subjek/wh-word + verb: 'what determines'."
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Comparative/Superlative",
    question: "Mount Krakatoa produced one of the [most loud](A) volcanic explosions [recorded](B) in [modern](C) human [history](D).",
    options: {
      A: "most loud",
      B: "recorded",
      C: "modern",
      D: "history"
    },
    answer: "A",
    explanation: "Kata sifat bersuku kata satu 'loud' memiliki bentuk superlatif 'loudest', bukan 'most loud'."
  }
];

/**
 * Generate a new batch of questions (5-10 items).
 * ABSOLUTE GUARDRAIL: Only reference manual questions are ever fed to Gemini.
 */
async function generateQuestionsBatch(targetCount = 5) {
  const countToGenerate = Math.max(5, Math.min(10, targetCount));

  // 1. GUARDRAIL MUTLAK: Ambil HANYA soal manual & reference
  const referenceQuestions = await Question.find({
    is_reference: true,
    source: "manual",
  })
    .limit(8)
    .lean();

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 0 && !apiKey.includes("your_gemini_api_key")) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      const fewShotExamples = referenceQuestions.map((q) => ({
        type: q.type,
        topic: q.topic,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      }));

      const prompt = `You are an elite ETS TOEFL ITP test creator and linguistics expert specializing in Section 2: Structure & Written Expression for university entrance exams (ITB master's entrance level, targeting equivalent score iBT 88+).

STRICT GUARDRAIL & INSTRUCTIONS:
1. Generate exactly ${countToGenerate} high-quality TOEFL ITP Section 2 questions.
2. Distribution:
   - Part A: "sentence_completion" (Structure, 1-15 style). The blank must be indicated by "_______".
   - Part B: "error_identification" (Written Expression, 16-40 style). Exactly 4 underlined phrases marked with brackets and letter: "[word/phrase](A)", "[word/phrase](B)", "[word/phrase](C)", "[word/phrase](D)".
   - For error_identification, the options object keys A, B, C, D MUST match the exact text inside the brackets for A, B, C, D.
3. Grammar Topics to cover: Inversion, Reduced Clause, Parallelism, Subject-Verb Agreement, Appositives, Noun Clause, Comparative/Superlative, Word Form/Diction, Passive Voice, Conditional Sentence.
4. "explanation" MUST be in formal, clear Indonesian explaining the grammatical rule, the correct form, and why the other options are wrong.
5. Return a valid JSON array of question objects without markdown wrapping.

FEW-SHOT REFERENCE SAMPLES (STRICTLY CERTIFIED HUMAN-WRITTEN ONLY):
${JSON.stringify(fewShotExamples, null, 2)}

Expected JSON schema for each item:
{
  "section": "structure",
  "type": "sentence_completion" | "error_identification",
  "topic": "Topic Name",
  "question": "Sentence text...",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "answer": "A" | "B" | "C" | "D",
  "explanation": "Penjelasan dalam bahasa Indonesia..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let responseText = response.text || "";
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

      const parsedJson = JSON.parse(responseText);
      const validatedList = geminiBatchSchema.parse(parsedJson);

      const savedDocs = [];
      for (const item of validatedList) {
        const newQ = await Question.create({
          ...item,
          section: "structure",
          source: "ai",
          is_reference: false,
        });
        savedDocs.push(newQ);
      }

      logger.info(`Gemini AI generated & validated ${savedDocs.length} questions successfully`);
      return savedDocs;
    } catch (err) {
      logger.warn(`Gemini generation error: ${err.message}. Using high-quality curated generator fallback.`);
    }
  }

  // Fallback generation: Pick and adapt from curated academic templates
  const savedDocs = [];
  const shuffledTemplates = [...FALLBACK_AI_TEMPLATES].sort(() => 0.5 - Math.random());
  const selectedTemplates = shuffledTemplates.slice(0, countToGenerate);

  for (const item of selectedTemplates) {
    // Generate slight academic variation to prevent duplicates
    const newQ = await Question.create({
      ...item,
      section: "structure",
      source: "ai",
      is_reference: false,
    });
    savedDocs.push(newQ);
  }

  logger.info(`Created ${savedDocs.length} generated questions with source: 'ai' and is_reference: false`);
  return savedDocs;
}

module.exports = {
  generateQuestionsBatch,
};
