/**
 * Pure quiz state machine driven by the Exercise screen. Keeping transitions pure
 * makes the double-answer lock, timeout handling and finish condition unit-testable
 * without rendering anything.
 */
export type AnswerChoice = number | 'timeout';

export type QuizAnswer = {
  choice: AnswerChoice;
  isCorrect: boolean;
};

/** One question's recorded outcome; timeout is kept distinct for a11y honesty. */
export type QuestionOutcome = 'correct' | 'wrong' | 'timeout';

export type QuizState = {
  /** Index of the question currently on screen. */
  index: number;
  /** Correct answers so far (includes the currently shown feedback). */
  correct: number;
  /** Non-null while the answer feedback for the current question is showing. */
  answer: QuizAnswer | null;
  /**
   * Outcome per answered question, appended at lock-in time — so the progress
   * bar can flip a segment during the feedback window, before the advance.
   */
  outcomes: QuestionOutcome[];
  /** True once the last question's feedback has been advanced past. */
  finished: boolean;
};

export function createQuizState(): QuizState {
  return { index: 0, correct: 0, answer: null, outcomes: [], finished: false };
}

/** Locks in a tapped option. Ignored while feedback is showing (rapid double-tap guard). */
export function answerQuestion(state: QuizState, choice: number, correctIndex: number): QuizState {
  if (state.finished || state.answer !== null) {
    return state;
  }
  const isCorrect = choice === correctIndex;
  return {
    ...state,
    answer: { choice, isCorrect },
    correct: state.correct + (isCorrect ? 1 : 0),
    outcomes: [...state.outcomes, isCorrect ? 'correct' : 'wrong'],
  };
}

/** Timer expiry counts as a wrong answer. Ignored if already answered. */
export function timeoutQuestion(state: QuizState): QuizState {
  if (state.finished || state.answer !== null) {
    return state;
  }
  return {
    ...state,
    answer: { choice: 'timeout', isCorrect: false },
    outcomes: [...state.outcomes, 'timeout'],
  };
}

/** Moves past the feedback to the next question, or finishes after the last one. */
export function advanceQuiz(state: QuizState, totalQuestions: number): QuizState {
  if (state.finished || state.answer === null) {
    return state;
  }
  const nextIndex = state.index + 1;
  if (nextIndex >= totalQuestions) {
    return { ...state, answer: null, finished: true };
  }
  return { ...state, index: nextIndex, answer: null };
}

/**
 * idle: awaiting the child's tap. After an answer locks in:
 * correct = the tapped right answer, wrongChoice = the tapped wrong answer,
 * revealCorrect = the right answer shown after a wrong tap or timeout,
 * lockedOut = the remaining options (dimmed, unpressable).
 */
export type AnswerFeedback = 'idle' | 'correct' | 'wrongChoice' | 'revealCorrect' | 'lockedOut';

/** Projects the state onto one option's visual feedback. */
export function feedbackForOption(
  state: QuizState,
  index: number,
  correctIndex: number,
): AnswerFeedback {
  if (state.answer === null) {
    return 'idle';
  }
  if (state.answer.choice === index) {
    return state.answer.isCorrect ? 'correct' : 'wrongChoice';
  }
  if (index === correctIndex) {
    return 'revealCorrect';
  }
  return 'lockedOut';
}
