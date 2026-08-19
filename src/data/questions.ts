/**
 * Local mock quiz content (the brief allows local data for the exercise).
 * Turkish, ages 5–8: short prompts, every option paired with an emoji or a digit.
 * Five sets; a lesson picks one deterministically from its id (ADR 0015), so the
 * same lesson always asks the same questions — retakes stay comparable.
 */
export type Question = {
  prompt: string;
  /** Exactly four answer options. */
  options: readonly [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
};

export type QuestionSet = readonly Question[];

export const QUESTIONS_PER_ATTEMPT = 3;
export const SECONDS_PER_QUESTION = 15;

const questionSets: readonly QuestionSet[] = [
  // Colors
  [
    {
      prompt: 'Hangisi kırmızı?',
      options: ['🍎 Elma', '🍌 Muz', '🥬 Marul', '🫐 Yaban mersini'],
      correctIndex: 0,
    },
    {
      prompt: 'Hangisi sarı?',
      options: ['🍇 Üzüm', '🍋 Limon', '🍅 Domates', '🥦 Brokoli'],
      correctIndex: 1,
    },
    {
      prompt: 'Hangisi yeşil?',
      options: ['🍓 Çilek', '🍊 Portakal', '🥒 Salatalık', '🍒 Kiraz'],
      correctIndex: 2,
    },
  ],
  // Counting
  [
    {
      prompt: 'Kaç tane yıldız var? ⭐⭐',
      options: ['1', '2', '3', '4'],
      correctIndex: 1,
    },
    {
      prompt: 'Kaç tane kalp var? ❤️❤️❤️',
      options: ['4', '2', '3', '5'],
      correctIndex: 2,
    },
    {
      prompt: 'Kaç tane top var? ⚽⚽⚽⚽',
      options: ['3', '5', '6', '4'],
      correctIndex: 3,
    },
  ],
  // Animals
  [
    {
      prompt: 'Hangisi uçar?',
      options: ['🐟 Balık', '🐘 Fil', '🐦 Kuş', '🐢 Kaplumbağa'],
      correctIndex: 2,
    },
    {
      prompt: 'Hangisi suda yaşar?',
      options: ['🐬 Yunus', '🐱 Kedi', '🐕 Köpek', '🐔 Tavuk'],
      correctIndex: 0,
    },
    {
      prompt: 'Hangisi miyav der?',
      options: ['🐄 İnek', '🐱 Kedi', '🐑 Koyun', '🦁 Aslan'],
      correctIndex: 1,
    },
  ],
  // Addition
  [
    {
      prompt: '1 + 1 kaç eder?',
      options: ['2', '1', '3', '4'],
      correctIndex: 0,
    },
    {
      prompt: '2 + 1 kaç eder?',
      options: ['2', '4', '3', '5'],
      correctIndex: 2,
    },
    {
      prompt: '2 + 2 kaç eder?',
      options: ['3', '5', '6', '4'],
      correctIndex: 3,
    },
  ],
  // Shapes
  [
    {
      prompt: 'Hangisi yuvarlak?',
      options: ['⚽ Top', '📦 Kutu', '📏 Cetvel', '🔺 Üçgen'],
      correctIndex: 0,
    },
    {
      prompt: 'Hangisi üçgen?',
      options: ['🟦 Kare', '🔺 Üçgen', '⭕ Halka', '📦 Kutu'],
      correctIndex: 1,
    },
    {
      prompt: 'Hangisi kare?',
      options: ['🌙 Ay', '🎲 Zar', '⚽ Top', '🥚 Yumurta'],
      correctIndex: 1,
    },
  ],
];

/**
 * Deterministic set selection: a stable string hash of the lesson id. No storage
 * involved, and the picsum ids are stable, so a lesson keeps its questions forever.
 */
export function getQuestionSet(lessonId: string): QuestionSet {
  let hash = 0;
  for (const char of lessonId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  // questionSets is a non-empty literal, so the index is always valid.
  return questionSets[hash % questionSets.length]!;
}

/** Exposed for data-integrity tests only. */
export const allQuestionSets = questionSets;
