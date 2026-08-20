/**
 * i18next module augmentation for compile-time key safety: every t() call is
 * checked against the Turkish resource file, so an unknown or misspelled key
 * fails `tsc`, not the child.
 */
import 'i18next';
import type tr from '@/locales/tr.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof tr;
  }
}
