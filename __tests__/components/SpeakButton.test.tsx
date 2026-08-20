import { fireEvent, render, screen } from '@testing-library/react-native';
import { SpeakButton } from '../../src/components/SpeakButton';
import { speak } from '@/lib/speech';
import i18n from '../../src/i18n';

jest.mock('@/lib/speech', () => ({ speak: jest.fn() }));

const t = i18n.getFixedT(null, 'common');

describe('SpeakButton — read-aloud affordance', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('tr');
  });

  it('is a button labelled "read aloud" without duplicating the sentence', async () => {
    await render(<SpeakButton text="Merhaba dünya" />);

    const button = screen.getByLabelText(t('speakA11y'));
    expect(button.props.accessibilityLabel).not.toContain('Merhaba');
  });

  it('hands the sentence and the active language to the speech interface', async () => {
    await render(<SpeakButton text="Merhaba dünya" />);

    await fireEvent.press(screen.getByLabelText(t('speakA11y')));

    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledWith('Merhaba dünya', 'tr');
  });
});
