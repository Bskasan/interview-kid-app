import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { AnswerGrid, computeTileSize, MIN_TILE_HEIGHT } from '../../src/components/AnswerGrid';
import { type Question } from '../../src/data/questions';
import { answerQuestion, createQuizState, feedbackForOption } from '../../src/lib/quiz';

// One option per visual kind, so the a11y expectations cover every renderer.
const OPTIONS: Question['options'] = [
  { visual: { kind: 'shape', shape: 'triangle', color: 'coral' }, a11yLabel: 'Kırmızı üçgen' },
  { visual: { kind: 'emoji', value: '🐱' }, label: 'Kedi' },
  {
    visual: { kind: 'image', uri: 'https://example.com/dog.jpg', fallbackEmoji: '🐶' },
    a11yLabel: 'Köpek fotoğrafı',
  },
  { label: '3' },
];

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
  it('exposes every visual kind as a button with a descriptive Turkish label', async () => {
    await render(<AnswerGrid options={OPTIONS} feedbackFor={() => 'idle'} onSelect={jest.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(4);
    for (const label of ['Kırmızı üçgen', 'Kedi', 'Köpek fotoğrafı', '3']) {
      const tile = screen.getByLabelText(label);
      expect(tile.props.accessibilityState).toMatchObject({ disabled: false, selected: false });
    }
  });
});

describe('AnswerGrid — selection locking', () => {
  it('locks all tiles after the first tap and ignores a rapid second tap', async () => {
    await render(<Harness correctIndex={1} />);

    await fireEvent.press(screen.getByLabelText('Kırmızı üçgen')); // wrong answer

    const wrongTile = screen.getByLabelText('✗ Kırmızı üçgen');
    expect(wrongTile.props.accessibilityState).toMatchObject({ disabled: true, selected: true });

    const revealedTile = screen.getByLabelText('✓ Kedi');
    expect(revealedTile.props.accessibilityState).toMatchObject({
      disabled: true,
      selected: false,
    });

    // A rapid tap on another tile must not re-answer or steal the selection.
    await fireEvent.press(revealedTile);
    expect(screen.getByLabelText('✗ Kırmızı üçgen')).toBeTruthy();
    expect(screen.queryByLabelText('✓ Köpek fotoğrafı')).toBeNull();
    expect(screen.getByLabelText('Köpek fotoğrafı').props.accessibilityState).toMatchObject({
      disabled: true,
      selected: false,
    });
  });

  it('marks a correct tap without revealing anything else', async () => {
    await render(<Harness correctIndex={1} />);

    await fireEvent.press(screen.getByLabelText('Kedi'));

    expect(screen.getByLabelText('✓ Kedi').props.accessibilityState).toMatchObject({
      disabled: true,
      selected: true,
    });
    // No other tile carries a mark; they are only dimmed out.
    expect(screen.queryByLabelText(/✗/)).toBeNull();
    expect(screen.getByLabelText('Kırmızı üçgen').props.accessibilityState).toMatchObject({
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
    expect(screen.getByLabelText('Köpek fotoğrafı')).toBeTruthy();
  });
});
