const bcrypt = require("bcryptjs");
const User = require("../model/User");
const Question = require("../model/Question");
const logger = require("./logger");

const INITIAL_REFERENCE_QUESTIONS = [
  // =========================================================================
  // --- SENTENCE COMPLETION (PART A: QUESTIONS 1-15 STYLE) ---
  // =========================================================================
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
    topic: "Inversion",
    question: "Rarely _______ such rapid technological advancement occurred in a single decade.",
    options: {
      A: "has",
      B: "is having",
      C: "it has",
      D: "have been"
    },
    answer: "A",
    explanation: "Negative adverb 'Rarely' di awal kalimat memicu inversi. Subjek 'advancement' adalah tunggal, sehingga auxiliary yang tepat adalah 'has'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Inversion",
    question: "Seldom _______ so clearly observed from the terrestrial observatory as during the dry season.",
    options: {
      A: "distant galaxies are",
      B: "are distant galaxies",
      C: "distant galaxies were",
      D: "have distant galaxies"
    },
    answer: "B",
    explanation: "Kata pembatas 'Seldom' di awal kalimat memicu inversi predikat pasif ('are' mendahului subjek jamak 'distant galaxies').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Inversion",
    question: "Only after conducting rigorous simulations _______ able to finalize the aerodynamic prototype.",
    options: {
      A: "the team was",
      B: "was the team",
      C: "the team were",
      D: "they were"
    },
    answer: "B",
    explanation: "Frasa 'Only after...' di awal kalimat mengharuskan klausa utama diinversi: auxiliary 'was' mendahului subjek 'the team'.",
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
    explanation: "Bentuk past participle 'Established' adalah reduced adjective clause bermakna pasif ('Which was established in 1920...'). Opsi C dan D menyebabkan double predicate tanpa konjungsi.",
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
    topic: "Reduced Clause",
    question: "_______ by dense tropical rain forests, the research outpost was inaccessible by conventional motor vehicles.",
    options: {
      A: "Surrounded",
      B: "Surrounding",
      C: "It was surrounded",
      D: "Surrounds"
    },
    answer: "A",
    explanation: "Reduced passive clause membutuhkan Past Participle (V3) 'Surrounded' karena pos penelitian tersebut dikelilingi oleh hutan (makna pasif).",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Reduced Clause",
    question: "_______ that the initial calculation contained systemic errors, the mathematician recalculated the entire formula.",
    options: {
      A: "Realizing",
      B: "Realized",
      C: "Was realizing",
      D: "Having been realized"
    },
    answer: "A",
    explanation: "Subjek setelah koma ('the mathematician') melakukan tindakan menyadari secara aktif, sehingga menggunakan Present Participle 'Realizing'.",
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
    explanation: "Berdasarkan prinsip paralelisme (conjunction 'and'), bentuk yang setara dengan gerund phrase adalah gerund 'optimizing'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Parallelism",
    question: "Modern architectural design requires aesthetic creativity, structural feasibility, and _______ with environmental regulations.",
    options: {
      A: "compliance",
      B: "complying",
      C: "to comply",
      D: "complied"
    },
    answer: "A",
    explanation: "Seri frasa kata benda (noun phrase) 'aesthetic creativity' dan 'structural feasibility' membutuhkan kata benda 'compliance' agar paralel.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Correlative Conjunctions",
    question: "Neither the principal investigator nor the graduate research assistants _______ willing to compromise on safety standards.",
    options: {
      A: "were",
      B: "was",
      C: "is",
      D: "being"
    },
    answer: "A",
    explanation: "Pada pola 'Neither ... nor', kata kerja mengikuti subjek terdekat (setelah nor). Karena 'assistants' jamak, kata kerja yang benar dalam past tense adalah 'were'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Correlative Conjunctions",
    question: "The volcanic soil around Mount Tangkuban Perahu is _______ fertile that tea plantations thrive across the entire highland.",
    options: {
      A: "so",
      B: "such",
      C: "too",
      D: "very"
    },
    answer: "A",
    explanation: "Pola 'so + adjective + that' digunakan sebelum kata sifat tunggal 'fertile'. 'Such' hanya digunakan jika diikuti noun phrase (such + noun).",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Correlative Conjunctions",
    question: "It was _______ demanding engineering challenge that professors and students collaborated day and night.",
    options: {
      A: "such a",
      B: "so",
      C: "such",
      D: "too a"
    },
    answer: "A",
    explanation: "Diikuti oleh noun phrase tunggal yang dapat dihitung ('demanding engineering challenge'), maka pola yang tepat adalah 'such a + noun phrase + that'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Correlative Conjunctions",
    question: "The newly developed battery pack is _______ lightweight as it is energy-dense.",
    options: {
      A: "as",
      B: "so",
      C: "more",
      D: "than"
    },
    answer: "A",
    explanation: "Perbandingan setara menggunakan pasangan paten 'as ... as' ('as lightweight as').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Correlative Conjunctions",
    question: "Engineers at the aerospace workshop prefer composite polymers _______ traditional aluminum alloys.",
    options: {
      A: "to",
      B: "than",
      C: "from",
      D: "over than"
    },
    answer: "A",
    explanation: "Kata kerja 'prefer' di TOEFL selalu berpasangan dengan preposisi 'to' (prefer A to B), bukan 'than'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Comparative/Superlative",
    question: "The more sophisticated the neural network becomes, _______ computing power it demands for training.",
    options: {
      A: "the greater",
      B: "greater",
      C: "more great",
      D: "the greatest"
    },
    answer: "A",
    explanation: "Pola double comparative mensyaratkan kedua sisi diawali artikel 'The' + comparative: 'The more ..., the greater ...'.",
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
    topic: "Appositive",
    question: "Dr. Soekarno, _______ of Indonesia, studied civil engineering at Technische Hoogeschool te Bandoeng.",
    options: {
      A: "the first president",
      B: "he was the first president",
      C: "who he was the president",
      D: "being that the first president"
    },
    answer: "A",
    explanation: "Appositive phrase yang diapit koma harus berupa frasa kata benda murni tanpa kata kerja mandiri ('the first president').",
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
    topic: "Noun Clause",
    question: "Theoretical physicists are uncertain _______ quantum gravity can be reconciled with general relativity.",
    options: {
      A: "whether",
      B: "that if",
      C: "what does",
      D: "which"
    },
    answer: "A",
    explanation: "Menyatakan keraguan (uncertain) membutuhkan noun clause penghubung 'whether' (apakah).",
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
    topic: "Conditional Sentence",
    question: "_______ the ambient temperature drop below freezing, the emergency heating system activates automatically.",
    options: {
      A: "Should",
      B: "Were",
      C: "Had",
      D: "Would"
    },
    answer: "A",
    explanation: "Bentuk inversi conditional type 1 (pengganti 'If the temperature should drop') diawali dengan modal 'Should' + Subject + V1 (drop).",
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
    topic: "Subject-Verb Agreement",
    question: "The number of research papers published by Indonesian scientists _______ exponentially over the past five years.",
    options: {
      A: "has grown",
      B: "have grown",
      C: "are growing",
      D: "grow"
    },
    answer: "A",
    explanation: "Pola 'The number of + noun jamak' selalu diikuti kata kerja tunggal (singular verb 'has grown'). Berbeda dengan 'A number of' yang diikuti kata kerja jamak.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Subjunctive Mood",
    question: "The academic senate recommended that the doctoral student _______ the dissertation data before public defense.",
    options: {
      A: "revise",
      B: "revises",
      C: "revised",
      D: "would revise"
    },
    answer: "A",
    explanation: "Setelah kata kerja yang menyatakan rekomendasi/tuntutan ('recommended that...'), klausa menggunakan Subjunctive Mood berupa Bare Infinitive (V1 murni tanpa -s) yaitu 'revise'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Subjunctive Mood",
    question: "It is essential that every laboratory technician _______ strictly to the biohazard protocols.",
    options: {
      A: "adhere",
      B: "adheres",
      C: "adhered",
      D: "is adhering"
    },
    answer: "A",
    explanation: "Frasa tuntutan 'It is essential that...' memicu Subjunctive Mood: subjek diikuti kata kerja bentuk dasar V1 tanpa -s ('adhere').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Causative Verbs",
    question: "The lead investigator had his post-doctoral fellow _______ the complex mathematical simulation overnight.",
    options: {
      A: "run",
      B: "to run",
      C: "running",
      D: "ran"
    },
    answer: "A",
    explanation: "Causative verb 'have/had + person' dalam makna aktif diikuti oleh bare infinitive V1 murni tanpa 'to' ('run').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Causative Verbs",
    question: "The dean got the corporate partners _______ additional funding for the new cleanroom facility.",
    options: {
      A: "to provide",
      B: "provide",
      C: "providing",
      D: "provided"
    },
    answer: "A",
    explanation: "Berbeda dengan 'have/make', causative verb 'get + person' dalam makna aktif selalu diikuti infinitif dengan 'to' ('to provide').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Preposition + Gerund",
    question: "By _______ the microscopic crystalline structure of the mineral, researchers discovered unprecedented magnetic properties.",
    options: {
      A: "examining",
      B: "examine",
      C: "examined",
      D: "examination of"
    },
    answer: "A",
    explanation: "Setelah preposisi 'By', kata kerja yang berfungsi sebagai penjelas tindakan wajib dalam bentuk gerund V-ing ('examining').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "sentence_completion",
    topic: "Relative Clause",
    question: "Materials _______ thermal conductivity exceeds that of copper are currently being synthesized for semiconductor cooling.",
    options: {
      A: "whose",
      B: "which",
      C: "that their",
      D: "of which"
    },
    answer: "A",
    explanation: "Kata ganti relatif kepemilikan 'whose' digunakan untuk menerangkan kata benda milik subjek ('whose thermal conductivity' = konduktivitas termal material tersebut).",
    source: "manual",
    is_reference: true
  },

  // =========================================================================
  // --- ERROR IDENTIFICATION (PART B: QUESTIONS 16-40 STYLE) ---
  // =========================================================================
  {
    section: "structure",
    type: "error_identification",
    topic: "Subject-Verb Agreement",
    question: "The collection of [ancient](A) geological samples [from](B) Mount Papandayan [were](C) preserved in the university's [central](D) archive.",
    options: {
      A: "ancient",
      B: "from",
      C: "were",
      D: "central"
    },
    answer: "C",
    explanation: "Subjek utama kalimat adalah 'The collection' (tunggal), bukan 'samples' (objek preposisi). Oleh karena itu, kata kerja yang benar adalah 'was', bukan 'were'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Subject-Verb Agreement",
    question: "Neither the dean [nor](A) the department heads [was](B) informed about the sudden [cancellation](C) of the annual [symposium](D).",
    options: {
      A: "nor",
      B: "was",
      C: "cancellation",
      D: "symposium"
    },
    answer: "B",
    explanation: "Pada pola 'Neither ... nor', kata kerja harus menyelaraskan dengan subjek terdekat ('the department heads' = jamak). Seharusnya 'were', bukan 'was'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Subject-Verb Agreement",
    question: "Every student [and](A) faculty member in the biotechnology department [are](B) entitled to [equal](C) access to the cleanroom [facilities](D).",
    options: {
      A: "and",
      B: "are",
      C: "equal",
      D: "facilities"
    },
    answer: "B",
    explanation: "Subjek yang diawali kata 'Every' selalu dianggap tunggal (singular). Maka kata kerja yang benar adalah 'is', bukan 'are'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Subject-Verb Agreement",
    question: "The vast [amount](A) of toxic chemical contaminants [were](B) safely neutralized [before](C) entering the city's drainage [system](D).",
    options: {
      A: "amount",
      B: "were",
      C: "before",
      D: "system"
    },
    answer: "B",
    explanation: "Frasa 'The vast amount' mengindikasikan kuantitas tak terhitung tunggal, sehingga kata kerjanya wajib 'was', bukan 'were'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Word Form/Diction",
    question: "The analytical chemist conducted the titration [extreme](A) [carefully](B) to avoid any [unwanted](C) chemical [reaction](D).",
    options: {
      A: "extreme",
      B: "carefully",
      C: "unwanted",
      D: "reaction"
    },
    answer: "A",
    explanation: "Kata keterangan 'carefully' harus diterangkan oleh adverb lain, yaitu 'extremely' (bukan kata sifat 'extreme').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Word Form/Diction",
    question: "Due to the [tremendous](A) [difficult](B) of the mathematical theorem, only a few scholars [could](C) comprehend its [proof](D).",
    options: {
      A: "tremendous",
      B: "difficult",
      C: "could",
      D: "proof"
    },
    answer: "B",
    explanation: "Setelah kata sifat 'tremendous' dan preposisi 'Due to the', dibutuhkan kata benda (Noun) yaitu 'difficulty', bukan kata sifat 'difficult'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Word Form/Diction",
    question: "The newly designed electric turbine operates [remarkable](A) [smoothly](B) even under [severe](C) atmospheric [turbulence](D).",
    options: {
      A: "remarkable",
      B: "smoothly",
      C: "severe",
      D: "turbulence"
    },
    answer: "A",
    explanation: "Kata keterangan 'smoothly' harus diterangkan oleh sesama adverb, yaitu 'remarkably' (bukan adjective 'remarkable').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Word Form/Diction",
    question: "Her pioneering research on quantum computing has proved to be [high](A) [influential](B) in developing [modern](C) cryptographic [ciphers](D).",
    options: {
      A: "high",
      B: "influential",
      C: "modern",
      D: "ciphers"
    },
    answer: "A",
    explanation: "Kata sifat 'influential' harus dimodifikasi oleh adverb derajat 'highly', bukan kata sifat 'high'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Parallelism",
    question: "The graduate scholarship covers [tuition fees](A), monthly housing [allowances](B), and [to purchase](C) essential academic [literature](D).",
    options: {
      A: "tuition fees",
      B: "allowances",
      C: "to purchase",
      D: "literature"
    },
    answer: "C",
    explanation: "Berdasarkan aturan paralelisme, seri noun phrase 'tuition fees' dan 'housing allowances' harus diikuti noun phrase atau gerund 'purchasing', bukan to-infinitive 'to purchase'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Parallelism",
    question: "The automated robotic arm is [capable of](A) detecting defects, sorting [components](B), and [it packages](C) finished products [efficiently](D).",
    options: {
      A: "capable of",
      B: "components",
      C: "it packages",
      D: "efficiently"
    },
    answer: "C",
    explanation: "Seri gerund setelah 'capable of': 'detecting defects', 'sorting components', dan seharusnya 'packaging finished products' (bukan klausa 'it packages').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Parallelism",
    question: "Dr. B.J. Habibie was widely respected for his [intellectual](A) brilliance, his visionary [leadership](B), and [he was dedicated](C) to aeronautical [engineering](D).",
    options: {
      A: "intellectual",
      B: "leadership",
      C: "he was dedicated",
      D: "engineering"
    },
    answer: "C",
    explanation: "Pola paralel menuntut frasa benda berkepemilikan yang seragam: 'his intellectual brilliance', 'his visionary leadership', dan 'his dedication' (bukan klausa 'he was dedicated').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Comparative/Superlative",
    question: "Synthetic diamond is considered [much more harder](A) than naturally [occurring](B) quartz [found](C) in igneous [rock](D).",
    options: {
      A: "much more harder",
      B: "occurring",
      C: "found",
      D: "rock"
    },
    answer: "A",
    explanation: "Terjadi kesalahan double comparative. Kata sifat bersuku kata satu 'hard' hanya membutuhkan imbuhan '-er' (much harder), tidak boleh menggunakan kata 'more'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Comparative/Superlative",
    question: "Of the three geothermal [exploration](A) proposals evaluated by the committee, the second draft was clearly the [more](B) financially [feasible](C) for long-term [investment](D).",
    options: {
      A: "exploration",
      B: "more",
      C: "feasible",
      D: "investment"
    },
    answer: "B",
    explanation: "Ketika membandingkan lebih dari dua entitas ('three proposals'), bentuk yang wajib digunakan adalah Superlative ('most'), bukan Comparative ('more').",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Comparative/Superlative",
    question: "The climate in the Lembang highlands is significantly [cooler](A) [as](B) the temperature in the [densely](C) populated valleys of [downtown](D) Bandung.",
    options: {
      A: "cooler",
      B: "as",
      C: "densely",
      D: "downtown"
    },
    answer: "B",
    explanation: "Bentuk comparative 'cooler' wajib berpasangan dengan kata 'than' (cooler than), bukan 'as'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Conjunction vs Preposition",
    question: "The field geological expedition was [postponed](A) [because](B) the unexpected landslides that blocked the primary [mountain](C) access [route](D).",
    options: {
      A: "postponed",
      B: "because",
      C: "mountain",
      D: "route"
    },
    answer: "B",
    explanation: "Karena hanya diikuti oleh frasa kata benda ('the unexpected landslides...'), seharusnya menggunakan preposisi 'because of', bukan konjungsi 'because'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Conjunction vs Preposition",
    question: "[Although](A) the [adverse](B) weather conditions and zero visibility, the mountaineering team [managed to](C) reach the volcanic [crater](D).",
    options: {
      A: "Although",
      B: "adverse",
      C: "managed to",
      D: "crater"
    },
    answer: "A",
    explanation: "'Although' harus diikuti klausa subjek + predikat. Karena yang mengikuti adalah noun phrase ('the adverse weather conditions...'), maka yang benar adalah preposisi 'Despite' atau 'In spite of'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Correlative Conjunctions",
    question: "Both civil engineering [as well as](A) regional planning [are](B) among the most [competitive](C) academic programs [offered](D) at ITB.",
    options: {
      A: "as well as",
      B: "are",
      C: "competitive",
      D: "offered"
    },
    answer: "A",
    explanation: "Kata 'Both' memiliki pasangan paten 'and' (Both A and B). Tidak boleh dipasangkan dengan 'as well as'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Correlative Conjunctions",
    question: "The international symposium on renewable energy will [take place](A) between November 12 [to](B) November 15 at the [campus](C) main [auditorium](D).",
    options: {
      A: "take place",
      B: "to",
      C: "campus",
      D: "auditorium"
    },
    answer: "B",
    explanation: "Pasangan paten dari 'between' adalah 'and' (between X and Y). Jika ingin menggunakan 'to', pasangannya adalah 'from' (from X to Y).",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Correlative Conjunctions",
    question: "Undergraduate researchers must choose [either](A) advanced fluid dynamics [nor](B) continuum mechanics as their [elective](C) course for the [upcoming](D) semester.",
    options: {
      A: "either",
      B: "nor",
      C: "elective",
      D: "upcoming"
    },
    answer: "B",
    explanation: "Pasangan paten 'either' adalah 'or' (Either ... or). Kata 'nor' hanya berpasangan dengan 'neither'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Correlative Conjunctions",
    question: "Professor Sutami preferred practical civil construction [than](A) abstract [theoretical](B) discourses during the [nation's](C) infrastructure [boom](D).",
    options: {
      A: "than",
      B: "theoretical",
      C: "nation's",
      D: "boom"
    },
    answer: "A",
    explanation: "Kata 'preferred' selalu berpasangan dengan preposisi 'to' (prefer A to B), bukan 'than'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Pronoun Agreement",
    question: "Each member of the academic council must submit [their](A) official voting [ballot](B) directly to the [office of](C) the rectorate [in person](D).",
    options: {
      A: "their",
      B: "ballot",
      C: "office of",
      D: "in person"
    },
    answer: "A",
    explanation: "Subjek diawali 'Each member' yang bersifat singular tunggal. Dalam tata bahasa formal TOEFL, kata ganti kepemilikan tunggal yang tepat adalah 'his or her', bukan jamak 'their'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Noun Form/Countability",
    question: "The geological laboratory purchased [many](A) modern electronic [equipments](B) to analyze rock samples [gathered from](C) active Indonesian [volcanoes](D).",
    options: {
      A: "many",
      B: "equipments",
      C: "gathered from",
      D: "volcanoes"
    },
    answer: "B",
    explanation: "'Equipment' adalah uncountable noun (kata benda tidak dapat dihitung) sehingga tidak memiliki bentuk jamak dengan akhiran -s. Seharusnya 'pieces of equipment' atau 'equipment'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Noun Form/Countability",
    question: "The senior professor provided numerous constructive [advices](A) on [how to](B) structure the methodology section [of](C) the doctoral [dissertation](D).",
    options: {
      A: "advices",
      B: "how to",
      C: "of",
      D: "dissertation"
    },
    answer: "A",
    explanation: "'Advice' adalah uncountable noun yang tidak bisa ditambah akhiran '-s'. Seharusnya 'pieces of advice' atau 'recommendations'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Double Subject/Redundancy",
    question: "The massive suspension bridge, [which](A) connects the two industrial districts, [it was](B) designed to withstand [high-magnitude](C) seismic [tremors](D).",
    options: {
      A: "which",
      B: "it was",
      C: "high-magnitude",
      D: "tremors"
    },
    answer: "B",
    explanation: "Terjadi pemborosan subjek ganda (double subject). Subjek utama 'The massive suspension bridge' tidak boleh diulangi lagi dengan kata ganti 'it'. Seharusnya langsung 'was designed'.",
    source: "manual",
    is_reference: true
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
    explanation: "Kata kerja 'solved' harus dimodifikasi oleh adverb 'efficiently', bukan adjective 'efficient'.",
    source: "manual",
    is_reference: true
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
    explanation: "Subjek kalimat adalah 'Each' yang bersifat tunggal (singular), sehingga kata kerja seharusnya 'is', bukan 'are'.",
    source: "manual",
    is_reference: true
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
    explanation: "Kata sifat bersuku kata satu 'loud' memiliki bentuk superlatif 'loudest', bukan 'most loud'.",
    source: "manual",
    is_reference: true
  },
  {
    section: "structure",
    type: "error_identification",
    topic: "Passive Voice",
    question: "The thesis committee debated [whether](A) the experimental methodology [was valid](B) and [how](C) the data [should be interpreting](D).",
    options: {
      A: "whether",
      B: "was valid",
      C: "how",
      D: "should be interpreting"
    },
    answer: "D",
    explanation: "Data tidak melakukan interpretasi secara aktif, melainkan diinterpretasikan (pasif), sehingga seharusnya 'should be interpreted'.",
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

    // 3. Seed Reference Questions (Upsert each item to ensure at least 60+ certified reference questions in DB)
    let addedCount = 0;
    for (const q of INITIAL_REFERENCE_QUESTIONS) {
      const existing = await Question.findOne({ question: q.question });
      if (!existing) {
        await Question.create(q);
        addedCount++;
      }
    }

    const totalCount = await Question.countDocuments();
    const countPartA = await Question.countDocuments({ type: "sentence_completion" });
    const countPartB = await Question.countDocuments({ type: "error_identification" });

    logger.info(
      `Question bank verified: ${totalCount} total questions in DB (${countPartA} Part A, ${countPartB} Part B). Added ${addedCount} new reference questions.`
    );
  } catch (err) {
    logger.error(`Error during database seeding: ${err.message}`);
  }
}

module.exports = seedDatabase;
