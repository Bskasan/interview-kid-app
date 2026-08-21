// Remounted per question (key = quiz.index at the call site): one countdown
// instance covers exactly one question, so a fresh 15 s can never race an
// interval armed with the previous question's deadline — the same reset idiom

import { SECONDS_PER_QUESTION } from '@/constants/timing';
import { useCountdown } from '@/hooks/useCountdown';
import { TimerBar } from './TimerBar';

// as the playerKey remount of the video stage.
export function QuestionTimer({ running, onExpire }: { running: boolean; onExpire: () => void }) {
  const { remainingSeconds, progress } = useCountdown(SECONDS_PER_QUESTION, {
    running,
    onExpire,
  });
  return <TimerBar progress={progress} remainingSeconds={remainingSeconds} />;
}
