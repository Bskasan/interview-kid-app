/**
 * i18next setup: bundled tr/en resources, synchronous init with the device
 * language (Turkish fallback), plus the supported-language vocabulary and
 * guards. Imported for its side effect once, at the app root.
 */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { handleError } from '@/lib/errors/handleError';
import en from '@/locales/en.json';
import tr from '@/locales/tr.json';

// Hermes ships without Intl.PluralRules on some platform/SDK combinations, and
// i18next's v4 JSON format resolves plural suffixes (_one/_other) through it.
// Runtime-guarded require (a static import cannot be conditional): devices with
// native support never execute the polyfill.
if (typeof Intl === 'undefined' || typeof Intl.PluralRules === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('intl-pluralrules');
}

export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'tr' || value === 'en';
}

/** Device locale mapped to a supported language; Turkish is the product default. */
export function resolveDeviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  return isAppLanguage(code) ? code : 'tr';
}

// Resources are bundled, so with initAsync: false the init completes
// synchronously — screens never see a missing-translation frame and tests need
// no async setup. The persisted user choice (settingsStore) is applied on
// rehydrate and overrides the device language. A failed init is close to
// impossible (no backend, bundled JSON) but still reported: the banner falls
// back to its hardcoded line when i18n is down.
try {
  // eslint-disable-next-line import/no-named-as-default-member -- i18n.use() is the documented i18next API; the named `use` export is unrelated (React 19's hook re-export).
  void i18n
    .use(initReactI18next)
    .init({
      resources: { tr, en },
      lng: resolveDeviceLanguage(),
      fallbackLng: 'tr',
      supportedLngs: SUPPORTED_LANGUAGES,
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      initAsync: false,
      react: { useSuspense: false },
    })
    .catch((cause: unknown) => {
      handleError(cause, { context: 'i18n.init' });
    });
} catch (cause) {
  handleError(cause, { context: 'i18n.init' });
}

export default i18n;
