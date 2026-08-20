import { render, screen } from '@testing-library/react-native';
import { SegmentedProgress } from '../../src/components/SegmentedProgress';
import i18n from '../../src/i18n';

// Reduced motion decides pulse vs static outline; everything else stays real.
let mockReduceMotion = false;
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  // Spread drops the non-enumerable ESM markers; restore them or `Animated`
  // (the default export) resolves to undefined in the components under test.
  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    useReducedMotion: () => mockReduceMotion,
  };
});

const t = i18n.getFixedT(null, 'exercise');

describe('SegmentedProgress — per-question outcomes', () => {
  beforeEach(() => {
    mockReduceMotion = false;
  });

  it('speaks the counter plus every recorded outcome, timeout announced honestly', async () => {
    await render(<SegmentedProgress current={3} total={3} outcomes={['correct', 'timeout']} />);

    const label = `${t('question', { current: 3, total: 3 })}. ${t('outcome.correct', {
      number: 1,
    })}, ${t('outcome.timeout', { number: 2 })}`;
    expect(screen.getByLabelText(label)).toBeTruthy();
  });

  it('speaks only the counter before any answer', async () => {
    await render(<SegmentedProgress current={1} total={3} outcomes={[]} />);

    expect(screen.getByLabelText(t('question', { current: 1, total: 3 }))).toBeTruthy();
    expect(screen.queryByText('✓')).toBeNull();
    expect(screen.queryByText('✗')).toBeNull();
  });

  it('renders statically under reduced motion (no pulse loop is started)', async () => {
    mockReduceMotion = true;
    await render(<SegmentedProgress current={2} total={3} outcomes={['wrong']} />);

    // The component mounts and announces normally; the pulse effect is gated
    // off, which the reanimated test-mode would otherwise keep re-rendering.
    const label = `${t('question', { current: 2, total: 3 })}. ${t('outcome.wrong', {
      number: 1,
    })}`;
    expect(screen.getByLabelText(label)).toBeTruthy();
  });
});
