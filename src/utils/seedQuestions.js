const bcrypt = require("bcryptjs");
const User = require("../model/User");
const Question = require("../model/Question");
const logger = require("./logger");

const INITIAL_REFERENCE_QUESTIONS = [
  // --- SENTENCE COMPLETION (PART A) ---
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Inversion",
    question: "Not only _______ the prestigious Ganesha Prize, but she also secured a doctoral research grant at ITB.",
    options: {
      A: "did the scholar win",
      B: "the scholar won",
      C: "she had won",
      D: "winning"
    },
    answer: "A",
    explanation: "Ketika anak kalimat diawali oleh negative correlative 'Not only', susunan kalimat mengalami inversi (auxiliary verb 'did' mendahului subjek 'the scholar').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Inversion",
    question: "Under no circumstances _______ without wearing safety goggles in the chemical engineering lab.",
    options: {
      A: "students should work",
      B: "should students work",
      C: "they should work",
      D: "work students"
    },
    answer: "B",
    explanation: "Frasa preposisi negatif 'Under no circumstances' di awal kalimat memicu inversi: modal 'should' mendahului subjek 'students'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Reduced Clause",
    question: "_______ in 1920, the Bandung Institute of Technology is recognized as the oldest technical university in Indonesia.",
    options: {
      A: "Established",
      B: "Establishing",
      C: "Was established",
      D: "It was established"
    },
    answer: "A",
    explanation: "Bentuk past participle 'Established' adalah reduced adjective clause yang bermakna pasif ('Which was established in 1920...'). Opsi C dan D membuat kalimat memiliki dua predikat utama tanpa konjungsi.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Reduced Clause",
    question: "_______ the experiment several times, the aerospace team finally recorded consistent aerodynamic data.",
    options: {
      A: "Having repeated",
      B: "Repeated",
      C: "Have repeated",
      D: "After repeated"
    },
    answer: "A",
    explanation: "Bentuk perfect participle 'Having repeated' menyatakan tindakan aktif yang telah diselesaikan sebelum tindakan pada induk kalimat terjadi.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Parallelism",
    question: "The artificial intelligence curriculum emphasizes data analysis, machine learning algorithms, and _______ complex systems.",
    options: {
      A: "to optimize",
      B: "optimizing",
      C: "optimization of",
      D: "optimized"
    },
    answer: "B",
    explanation: "Berdasarkan prinsip paralelisme (conjunction 'and'), bentuk yang setara dengan gerund phrase 'data analysis (analyzing data)' dan 'machine learning' adalah gerund 'optimizing'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Appositive",
    question: "_______, the Bosscha Observatory in Lembang remains an essential astronomical facility for planetary observation.",
    options: {
      A: "Constructed during the colonial era",
      B: "It was constructed during the colonial era",
      C: "Because constructed during the colonial era",
      D: "That was constructed during the colonial era"
    },
    answer: "A",
    explanation: "Kalimat membutuhkan frasa appositive / participial modifier di awal untuk menerangkan subjek 'the Bosscha Observatory'. Opsi B salah karena memuat subjek 'It' dan predikat 'was' berlebihan.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Noun Clause",
    question: "Geophysicists at ITB are investigating _______ triggered the unusual seismic activity along the Cimandiri fault.",
    options: {
      A: "what",
      B: "that what",
      C: "it was what",
      D: "why does"
    },
    answer: "A",
    explanation: "Kata kerja transitif 'investigating' membutuhkan direct object berupa noun clause. 'What' bertindak sebagai connector sekaligus subjek bagi verb 'triggered'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Conditional Sentence",
    question: "Had the structural engineers _______ the soil liquefaction risk earlier, the foundation design would have been modified.",
    options: {
      A: "identified",
      B: "identify",
      C: "been identified",
      D: "identifying"
    },
    answer: "A",
    explanation: "Ini adalah bentuk inversi dari conditional type 3 ('If the structural engineers had identified...'). Bentuk inversinya adalah 'Had' + Subject + Past Participle (identified).",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Subject-Verb Agreement",
    question: "A series of rigorous laboratory tests _______ required before the new biofuel compound can be patented.",
    options: {
      A: "is",
      B: "are",
      C: "were",
      D: "have been"
    },
    answer: "A",
    explanation: "Frasa 'A series of...' dianggap sebagai singular collective noun ('series' bertindak sebagai head noun tunggal), sehingga kata kerja yang tepat dalam present tense adalah 'is'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Comparative/Superlative",
    question: "The more efficiently solar panels convert photovoltaic energy, _______ the installation costs become over time.",
    options: {
      A: "the more economical",
      B: "more economical",
      C: "the economical",
      D: "most economical"
    },
    answer: "A",
    explanation: "Pola double comparative mengharuskan kedua klausa diawali 'The + comparative': 'The more efficiently..., the more economical...'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Passive Voice",
    question: "Quantum computing theories _______ by global physics communities for over three decades.",
    options: {
      A: "have been vigorously debated",
      B: "vigorously debated",
      C: "have vigorously debated",
      D: "are vigorously debating"
    },
    answer: "A",
    explanation: "Subjek 'Quantum computing theories' menerima tindakan (pasif), dan time signal 'for over three decades' menunjukkan present perfect: 'have been' + V3 (vigorously debated).",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Correlative Conjunction",
    question: "The proposed renewable energy project is _______ technically viable but also economically advantageous for local communities.",
    options: {
      A: "not only",
      B: "neither",
      C: "either",
      D: "both"
    },
    answer: "A",
    explanation: "Pasangan dari 'but also' adalah correlative conjunction 'not only'.",
    source: "manual",
    is_reference: true
  },

  // --- ERROR IDENTIFICATION (PART B / WRITTEN EXPRESSION) ---
  {
    section: "structure",
    type: "error_identification",
    topic: "Subject-Verb Agreement",
    question: "The collection of [ancient](A) geological [samples](B) from the Tangkuban Perahu crater [were](C) sent to Japan for [isotopic](D) testing.",
    options: {
      A: "ancient",
      B: "samples",
      C: "were",
      D: "isotopic"
    },
    answer: "C",
    explanation: "Subjek utama kalimat adalah 'The collection' (singular), bukan 'samples'. Oleh karena itu, to be yang benar adalah 'was', bukan 'were'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Word Form/Diction",
    question: "The civil engineering team [successfully](A) completed the bridge design [despite](B) encountering [tremendous](C) [difficult](D) in soil stability.",
    options: {
      A: "successfully",
      B: "despite",
      C: "tremendous",
      D: "difficult"
    },
    answer: "D",
    explanation: "Setelah adjective 'tremendous', dibutuhkan bentuk kata benda (noun) yaitu 'difficulty', bukan kata sifat (adjective) 'difficult'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Parallelism",
    question: "Modern satellite instruments are [used](A) for [mapping](B) oceanic currents, [tracking](C) weather phenomena, and [to detect](D) volcanic emissions.",
    options: {
      A: "used",
      B: "mapping",
      C: "tracking",
      D: "to detect"
    },
    answer: "D",
    explanation: "Untuk menjaga paralelisme dengan 'mapping' dan 'tracking', bentuk infinitive 'to detect' harus diubah menjadi gerund 'detecting'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Comparative/Superlative",
    question: "Diamond is [recognized](A) as the [hardest](B) natural material, but synthetic aggregates are [more stronger](C) under [extreme](D) thermodynamic pressure.",
    options: {
      A: "recognized",
      B: "hardest",
      C: "more stronger",
      D: "extreme"
    },
    answer: "C",
    explanation: "Penggunaan double comparative 'more stronger' adalah kesalahan gramatikal. Bentuk komparatif dari kata sifat satu suku kata 'strong' adalah 'stronger' (tanpa 'more').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Word Form/Diction",
    question: "The [recently](A) inaugurated campus laboratory conducts experiments [very](B) [careful](C) to prevent [accidental](D) chemical leaks.",
    options: {
      A: "recently",
      B: "very",
      C: "careful",
      D: "accidental"
    },
    answer: "C",
    explanation: "Kata kerja 'conducts' harus diterangkan oleh kata keterangan (adverb) 'carefully', bukan adjective 'careful'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Subject-Verb Agreement",
    question: "Neither the faculty dean [nor](A) the departmental [professors](B) [was](C) present during the [annual](D) technology exhibition.",
    options: {
      A: "nor",
      B: "professors",
      C: "was",
      D: "annual"
    },
    answer: "C",
    explanation: "Pada konjungsi 'Neither... nor...', kata kerja menyesuaikan dengan subjek terdekat ('professors' = plural), sehingga seharusnya 'were', bukan 'was'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Passive Voice",
    question: "The geothermal energy conference [was attended](A) by delegates from twenty nations, and [keynote speeches](B) [delivered](C) by [esteemed](D) researchers.",
    options: {
      A: "was attended",
      B: "keynote speeches",
      C: "delivered",
      D: "esteemed"
    },
    answer: "C",
    explanation: "Klausa kedua berbentuk pasif dan membutuhkan auxiliary verb: 'and keynote speeches were delivered' (bukan hanya 'delivered' yang menjadi aktif).",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Pronoun Agreement",
    question: "Every applicant [submitting](A) a portfolio for ITB's architecture program [must ensure](B) that [their](C) drawings comply with the [prescribed](D) format.",
    options: {
      A: "submitting",
      B: "must ensure",
      C: "their",
      D: "prescribed"
    },
    answer: "C",
    explanation: "Dalam tes standar formal TOEFL, kata ganti untuk 'Every applicant' (singular) secara preskriptif adalah 'his or her' (bukan jamak 'their').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Word Form/Diction",
    question: "Although the [theoretical](A) physics equation was [astonishing](B) intricate, the graduate researcher explained it [clear](C) to the [undergraduates](D).",
    options: {
      A: "theoretical",
      B: "astonishing",
      C: "clear",
      D: "undergraduates"
    },
    answer: "C",
    explanation: "Kata kerja 'explained' dimodifikasi oleh adverb 'clearly', bukan adjective 'clear'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Reduced Clause",
    question: "[Because](A) its superior electrical [conductivity](B), copper is [widely utilized](C) in the manufacture of [advanced](D) microchips.",
    options: {
      A: "Because",
      B: "conductivity",
      C: "widely utilized",
      D: "advanced"
    },
    answer: "A",
    explanation: "Sebelum noun phrase 'its superior electrical conductivity', harus digunakan frasa preposisi 'Because of', bukan subordinate conjunction 'Because' (yang membutuhkan subjek + verb).",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Inversion",
    question: "Seldom [meteorologists](A) [witness](B) atmospheric disturbances of such [immense](C) magnitude [during](D) the dry season.",
    options: {
      A: "meteorologists",
      B: "witness",
      C: "immense",
      D: "during"
    },
    answer: "A",
    explanation: "Ketika diawali negative adverb 'Seldom', susunan kalimat harus dibalik: 'Seldom do meteorologists witness...'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Noun Clause",
    question: "The thesis committee debated [whether](A) the experimental methodology [was valid](B) and [how](C) the data [should be interpreting](D).",
    options: {
      A: "whether",
      B: "was valid",
      C: "how",
      D: "should be interpreting"
    },
    answer: "D",
    explanation: "Data tidak melakukan interpretasi (bukan aktif), melainkan diinterpretasikan (pasif), sehingga seharusnya 'should be interpreted'.",
    source: "manual",
    is_reference: true
  }
];

async function seedDatabase() {
  try {
    // 1. Seed Default Admin
    const adminEmail = "admin@toefl.itb.ac.id";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      admin = await User.create({
        name: "Admin TOEFL ITB",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        resetPasswordRequest: false,
      });
      logger.info(`Admin user created: ${adminEmail} (password: admin123)`);
    }

    // 2. Seed Default Student
    const studentEmail = "student@itb.ac.id";
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("student123", salt);
      student = await User.create({
        name: "Mahasiswa Calon ITB",
        email: studentEmail,
        password: hashedPassword,
        role: "user",
        resetPasswordRequest: false,
      });
      logger.info(`Student user created: ${studentEmail} (password: student123)`);
    }

    // 3. Seed Reference Questions
    const existingCount = await Question.countDocuments();
    if (existingCount === 0) {
      await Question.insertMany(INITIAL_REFERENCE_QUESTIONS);
      logger.info(`Seeded ${INITIAL_REFERENCE_QUESTIONS.length} reference TOEFL ITP questions into DB.`);
    } else {
      logger.info(`Question bank already has ${existingCount} questions.`);
    }
  } catch (err) {
    logger.error(`Error during database seeding: ${err.message}`);
  }
}

module.exports = seedDatabase;
