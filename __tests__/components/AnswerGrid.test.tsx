import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { AnswerGrid, computeTileSize, MIN_TILE_HEIGHT } from '../../src/components/AnswerGrid';
import { type Question } from '../../src/data/questions';
import i18n from '../../src/i18n';
import { answerQuestion, createQuizState, feedbackForOption } from '../../src/lib/quiz';

// One option per visual kind, so the a11y expectations cover every renderer.
// Text comes from the questions namespace, exactly like the real question bank.
const OPTIONS: Question['options'] = [
  { visual: { kind: 'shape', shape: 'triangle', color: 'coral' } },
  { visual: { kind: 'emoji', value: '🐱' }, labelKey: 'animals.q1.options.o2' },
  {
    visual: { kind: 'image', uri: 'https://example.com/dog.jpg', fallbackEmoji: '🐶' },
    a11yKey: 'objects.q3.options.o3',
  },
  { labelKey: 'counting.q1.options.o2' },
];

// Resolved once via the tr-initialized instance from the jest setup, so the
// assertions track the copy instead of hardcoding it.
const tq = i18n.getFixedT(null, 'questions');
const LABELS = {
  shape: tq('shapeOption', { color: tq('color.coral'), shape: tq('shape.triangle') }),
  cat: tq('animals.q1.options.o2'),
  dogPhoto: tq('objects.q3.options.o3'),
  three: tq('counting.q1.options.o2'),
};

/** Mirrors the exercise screen's wiring: pure quiz state drives the grid. */
function Harness({ correctIndex }: { correctIndex: 0 | 1 | 2 | 3 }) {
  const [quiz, setQuiz] = useState(createQuizState());
  return (
    <AnswerGrid
      options={OPTIONS}
      feedbackFor={(index) => feedbackForOption(quiz, index, correctIndex)}
      onSelect={(index) => setQuiz((state) => answerQuestion(state, index, correctIndex))}
    />
  );
}

describe('computeTileSize — 2×2 grid sizing from the window', () => {
  it('fills a 360×640 screen with square tiles and no scrolling', () => {
    expect(computeTileSize({ width: 360, height: 640 })).toEqual({ width: 158, height: 158 });
  });

  it('never squeezes tiles below the touch floor on short screens', () => {
    const tile = computeTileSize({ width: 360, height: 500 });
    expect(tile.height).toBe(MIN_TILE_HEIGHT);
    expect(tile.width).toBe(158);
  });

  it('caps tile height at the width so tall screens keep square-ish tiles', () => {
    const tile = computeTileSize({ width: 360, height: 900 });
    expect(tile.height).toBe(tile.width);
  });
});

describe('AnswerGrid — accessibility', () => {
  it('exposes every visual kind as a button with a descriptive label', async () => {
    await render(<AnswerGrid options={OPTIONS} feedbackFor={() => 'idle'} onSelect={jest.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(4);
    for (const label of [LABELS.shape, LABELS.cat, LABELS.dogPhoto, LABELS.three]) {
      const tile = screen.getByLabelText(label);
      expect(tile.props.accessibilityState).toMatchObject({ disabled: false, selected: false });
    }
  });
});

describe('AnswerGrid — selection locking', () => {
  it('locks all tiles after the first tap and ignores a rapid second tap', async () => {
    await render(<Harness correctIndex={1} />);

    await fireEvent.press(screen.getByLabelText(LABELS.shape)); // wrong answer

    const wrongTile = screen.getByLabelText(`✗ ${LABELS.shape}`);
    expect(wrongTile.props.accessibilityState).toMatchObject({ disabled: true, selected: true });

    const revealedTile = screen.getByLabelText(`✓ ${LABELS.cat}`);
    expect(revealedTile.props.accessibilityState).toMatchObject({
      disabled: true,
      selected: false,
    });

    // A rapid tap on another tile must not re-answer or steal the selection.
    await fireEvent.press(revealedTile);
    expect(screen.getByLabelText(`✗ ${LABELS.shape}`)).toBeTruthy();
    expect(screen.queryByLabelText(`✓ ${LABELS.dogPhoto}`)).toBeNull();
    expect(screen.getByLabelText(LABELS.dogPhoto).props.accessibilityState).toMatchObject({
      disabled: true,
      selected: false,
    });
  });

  it('marks a correct tap without revealing anything else', async () => {
    await render(<Harness correctIndex={1} />);

    await fireEvent.press(screen.getByLabelText(LABELS.cat));

    expect(screen.getByLabelText(`✓ ${LABELS.cat}`).props.accessibilityState).toMatchObject({
      disabled: true,
      selected: true,
    });
    // No other tile carries a mark; they are only dimmed out.
    expect(screen.queryByLabelText(/✗/)).toBeNull();
    expect(screen.getByLabelText(LABELS.shape).props.accessibilityState).toMatchObject({
      disabled: true,
      selected: false,
    });
  });
});

describe('AnswerGrid — image options', () => {
  it('swaps a failing image for its emoji fallback so the question stays answerable', async () => {
    await render(<AnswerGrid options={OPTIONS} feedbackFor={() => 'idle'} onSelect={jest.fn()} />);

    expect(screen.queryByText('🐶')).toBeNull();
    await fireEvent(screen.getByTestId('expo-image'), 'error');

    expect(screen.getByText('🐶')).toBeTruthy();
    expect(screen.getByLabelText(LABELS.dogPhoto)).toBeTruthy();
  });
});
