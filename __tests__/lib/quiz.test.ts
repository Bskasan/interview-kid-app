import {
  advanceQuiz,
  answerQuestion,
  createQuizState,
  feedbackForOption,
  timeoutQuestion,
} from '../../src/lib/quiz';

const TOTAL = 3;

describe('quiz state machine — answering', () => {
  it.each([
    ['correct', 2, 2, true, 1],
    ['wrong', 0, 2, false, 0],
  ])('locks in a %s answer and scores it', (_kind, choice, correctIndex, isCorrect, score) => {
    const state = answerQuestion(createQuizState(), choice, correctIndex);
    expect(state.answer).toEqual({ choice, isCorrect });
    expect(state.correct).toBe(score);
  });

  it('ignores a second tap while feedback is showing (double-tap guard)', () => {
    const afterFirst = answerQuestion(createQuizState(), 0, 0);
    const afterSecond = answerQuestion(afterFirst, 1, 0);
    expect(afterSecond).toBe(afterFirst);
  });
});

describe('quiz state machine — timeout', () => {
  it('records an expired timer as a wrong timeout answer', () => {
    const state = timeoutQuestion(createQuizState());
    expect(state.answer).toEqual({ choice: 'timeout', isCorrect: false });
    expect(state.correct).toBe(0);
  });

  it('ignores a timeout that races an already locked answer', () => {
    const answered = answerQuestion(createQuizState(), 1, 1);
    expect(timeoutQuestion(answered)).toBe(answered);
  });
});

describe('quiz state machine — advancing', () => {
  it('moves to the next question and clears the feedback', () => {
    const answered = answerQuestion(createQuizState(), 1, 1);
    const next = advanceQuiz(answered, TOTAL);
    expect(next.index).toBe(1);
    expect(next.answer).toBeNull();
    expect(next.finished).toBe(false);
  });

  it('does nothing while no answer is locked in', () => {
    const state = createQuizState();
    expect(advanceQuiz(state, TOTAL)).toBe(state);
  });

  it('finishes after advancing past the last question with the score kept', () => {
    let state = createQuizState();
    for (let i = 0; i < TOTAL; i += 1) {
      state = advanceQuiz(answerQuestion(state, 0, 0), TOTAL);
    }
    expect(state.finished).toBe(true);
    expect(state.correct).toBe(3);
    expect(state.answer).toBeNull();
  });

  it('stays finished if advanced again after the end', () => {
    let state = createQuizState();
    for (let i = 0; i < TOTAL; i += 1) {
      state = advanceQuiz(answerQuestion(state, 0, 1), TOTAL);
    }
    expect(advanceQuiz(state, TOTAL)).toBe(state);
  });
});

describe('feedbackForOption — per-option feedback projection', () => {
  const CORRECT = 2;

  it('shows every option as idle while no answer is locked in', () => {
    const state = createQuizState();
    for (const index of [0, 1, 2, 3]) {
      expect(feedbackForOption(state, index, CORRECT)).toBe('idle');
    }
  });

  it('marks a correct tap and dims the rest without revealing anything', () => {
    const state = answerQuestion(createQuizState(), CORRECT, CORRECT);
    expect(feedbackForOption(state, CORRECT, CORRECT)).toBe('correct');
    expect(feedbackForOption(state, 0, CORRECT)).toBe('lockedOut');
    expect(feedbackForOption(state, 1, CORRECT)).toBe('lockedOut');
    expect(feedbackForOption(state, 3, CORRECT)).toBe('lockedOut');
  });

  it('marks a wrong tap and reveals the correct option', () => {
    const state = answerQuestion(createQuizState(), 0, CORRECT);
    expect(feedbackForOption(state, 0, CORRECT)).toBe('wrongChoice');
    expect(feedbackForOption(state, CORRECT, CORRECT)).toBe('revealCorrect');
    expect(feedbackForOption(state, 1, CORRECT)).toBe('lockedOut');
    expect(feedbackForOption(state, 3, CORRECT)).toBe('lockedOut');
  });

  it('reveals the correct option after a timeout without marking any tap', () => {
    const state = timeoutQuestion(createQuizState());
    expect(feedbackForOption(state, CORRECT, CORRECT)).toBe('revealCorrect');
    expect(feedbackForOption(state, 0, CORRECT)).toBe('lockedOut');
    expect(feedbackForOption(state, 1, CORRECT)).toBe('lockedOut');
    expect(feedbackForOption(state, 3, CORRECT)).toBe('lockedOut');
  });
});
