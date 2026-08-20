import { fireEvent, render, screen } from '@testing-library/react-native';
import ExercisesScreen from '../../app/(tabs)/exercises';
import i18n from '../../src/i18n';
import type { Lesson } from '../../src/types/lesson';

const t = i18n.getFixedT(null, 'home');

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: () => {},
}));

const mockUseLessons = jest.fn();
jest.mock('@/hooks/useLessons', () => ({
  useLessons: () => mockUseLessons(),
}));

const mockUseNetworkStatus = jest.fn();
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

const lessons: Lesson[] = [
  { id: '1', lessonNumber: 1, author: 'Ada', thumbnailUrl: 'https://picsum.photos/id/1/200/200' },
  { id: '2', lessonNumber: 2, author: 'Grace', thumbnailUrl: 'https://picsum.photos/id/2/200/200' },
];

const fetchNextPage = jest.fn();

const lessonsResult = (overrides: Record<string, unknown> = {}) => ({
  data: lessons,
  isPending: false,
  isError: false,
  refetch: jest.fn(),
  isRefetching: false,
  fetchNextPage,
  hasNextPage: true,
  isFetchingNextPage: false,
  ...overrides,
});

// Scroll metrics that put the viewport past the list end, inside the
// onEndReachedThreshold window, so VirtualizedList fires onEndReached.
// VirtualizedList tracks content length from onContentSizeChange (not from
// scroll events) and fires onEndReached once per content length, so the
// content size must be reported before scrolling.
const scrollToBottom = async () => {
  const list = screen.getByTestId('lesson-list');
  await fireEvent(list, 'contentSizeChange', 360, 700);
  await fireEvent.scroll(list, {
    nativeEvent: {
      contentOffset: { x: 0, y: 500 },
      contentSize: { width: 360, height: 700 },
      layoutMeasurement: { width: 360, height: 400 },
    },
  });
};

const setup = async (queryOverrides: Record<string, unknown> = {}, isOffline = false) => {
  mockUseLessons.mockReturnValue(lessonsResult(queryOverrides));
  mockUseNetworkStatus.mockReturnValue({ isOffline });
  await render(<ExercisesScreen />);
};

describe('Exercises screen — incremental loading guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the next page when scrolled to the bottom, once per content length', async () => {
    await setup();

    await scrollToBottom();
    await scrollToBottom();
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    // Restarting an in-flight page request on a duplicate fire is the bug the
    // option guards against; assert the option travels with every call.
    expect(fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false });
  });

  it('does not fetch while a page is already in flight, and shows the footer instead', async () => {
    await setup({ isFetchingNextPage: true, isRefetching: true });

    await scrollToBottom();
    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(screen.getByText(t('loadingMore'))).toBeTruthy();
    // The page-append fetch must not spin the pull-to-refresh control.
    expect(screen.getByTestId('lesson-list').props.refreshControl.props.refreshing).toBe(false);
  });

  it('does not fetch or show a footer while offline', async () => {
    await setup({}, true);

    await scrollToBottom();
    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(screen.queryByText(t('loadingMore'))).toBeNull();
  });

  it('stays quiet at the true end of the list', async () => {
    await setup({ hasNextPage: false });

    await scrollToBottom();
    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(screen.queryByText(t('loadingMore'))).toBeNull();
  });
});
