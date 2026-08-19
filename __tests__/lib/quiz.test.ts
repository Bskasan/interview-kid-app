import { advanceQuiz, answerQuestion, createQuizState, timeoutQuestion } from '../../src/lib/quiz';

const TOTAL = 3;

describe('quiz state machine — answering', () => {
  it('locks in a correct answer and increments the score', () => {
    const state = answerQuestion(createQuizState(), 2, 2);
    expect(state.answer).toEqual({ choice: 2, isCorrect: true });
    expect(state.correct).toBe(1);
  });

  it('locks in a wrong answer without changing the score', () => {
    const state = answerQuestion(createQuizState(), 0, 2);
    expect(state.answer).toEqual({ choice: 0, isCorrect: false });
    expect(state.correct).toBe(0);
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
