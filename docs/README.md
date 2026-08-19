# Docs index

Decision records (ADRs) and feature docs for the Kids Learning App take-home.
Every non-obvious choice has a decision record; every screen/feature has a feature doc.

## Decisions

- [0001 — Expo managed workflow + Expo Go](decisions/0001-expo-managed-expo-go.md) — why managed Expo instead of bare RN or a custom dev client.
- [0002 — Expo Router](decisions/0002-expo-router.md) — file-based routing under root `app/` instead of using React Navigation directly.
- [0003 — expo-video](decisions/0003-expo-video.md) — current SDK video module; expo-av is deprecated/banned, react-native-video breaks Expo Go.
- [0004 — TanStack Query + persistence](decisions/0004-tanstack-query-persist.md) — declarative server state with AsyncStorage cache for the offline Home list.
- [0005 — zustand + persist](decisions/0005-zustand-persist.md) — tiny persisted progress/badge store; MMKV rejected (not Expo Go compatible).
- [0006 — Design language implementation](decisions/0006-design-language.md) — hand-rolled tokens + ChunkyButton + emoji mascot; UI kits, Lottie and Nunito rejected; contrast policy.
- [0007 — FlatList](decisions/0007-flatlist.md) — built-in FlatList with getItemLayout over FlashList for 20 fixed-height cards.
- [0008 — Offline policy](decisions/0008-offline-policy.md) — persisted query cache + NetInfo-driven banner/refetch; honest offline detection.
- [0009 — Defensive API parsing](decisions/0009-defensive-api-parsing.md) — hand-rolled unknown-narrowing mapper; skip bad items, never crash.
- [0010 — Progress indicator semantics](decisions/0010-progress-indicator.md) — stars = best score, status pill with icon+text, derived "attempted".
- [0011 — Web output "single"](decisions/0011-web-output-single.md) — no Node static rendering; fixes the window-is-not-defined SSR crash, web stays incidental.
- [0012 — Event-driven video stage](decisions/0012-expo-video-events.md) — playToEnd/statusChange unlock the quiz CTA; no polling, error never blocks the flow.
- [0013 — Timer policy](decisions/0013-timer-policy.md) — timestamp-based countdown, AppState pause/resume, single-fire expiry.
- [0014 — Quiz back guard](decisions/0014-back-guard.md) — usePreventRemove + native Alert; finish disables the guard before replacing to Result.
- [0015 — Question assignment](decisions/0015-question-assignment.md) — deterministic set per lesson id, pure quiz state machine, double-tap guard.
- [0016 — Badge animation](decisions/0016-badge-animation.md) — hand-rolled Reanimated celebration over Lottie/confetti libs; reduced-motion fallback.
- [0017 — Idempotent result recording](decisions/0017-idempotent-result-recording.md) — single writer + once-per-mount guard + idempotent best-merge.
- [0018 — Interaction & display hardening](decisions/0018-interaction-hardening.md) — contrast fixes, font-scale caps, navigation double-tap locks, app-active default.
- [0019 — Visual answer grid](decisions/0019-visual-answer-grid.md) — 2×2 visual tiles for pre-readers: emoji/SVG-shape/image option model, compile-time a11y labels, pure tile sizing with a 120dp floor.
- [0020 — Test strategy](decisions/0020-test-strategy.md) — pure logic exhaustively, screens at decision points via mocked boundaries, components for locking/a11y; no snapshots, no library re-testing; jest infra for Reanimated 4 + RNTL 14.
- [0021 — Cleanup pass and lint setup](decisions/0021-cleanup-and-lint.md) — verified dead-code removals (assets, deps, tokens, props), depcheck cross-checked by hand, working ESLint flat config with targeted Reanimated rule disables.
- [0022 — Prettier and ESLint hardening](decisions/0022-prettier-eslint-hardening.md) — Prettier as sole formatting owner + no-console/no-any/exhaustive-deps as errors; LF pinned via .gitattributes for Windows.
- [0023 — Typed-routes generation for typecheck](decisions/0023-typed-routes-typegen.md) — `expo customize tsconfig.json` as a one-shot typegen so `tsc` works on fresh clones and CI without Metro.
- [0024 — Husky + lint-staged + commitlint](decisions/0024-husky-lint-staged-commitlint.md) — POSIX-sh hooks: fast checks per commit, commitlint on messages, full `check` on push; lefthook/simple-git-hooks rejected.
- [0025 — GitHub Actions CI pipeline](decisions/0025-github-actions-pipeline.md) — one fail-fast job (typecheck→lint→format→test→export) on PRs and main pushes; export artifact as post-merge proof; EAS deferred.
- [0026 — Branch ruleset, enforcement deferred](decisions/0026-branch-ruleset-deferred.md) — import-ready `main.json` ruleset committed; GitHub Free private repos can't enforce, pre-push hook is the gate until then.
- [0027 — i18next with typed, synchronous init](decisions/0027-i18next-typed-sync-init.md) — tr/en JSON resources as namespaces, sync init (no Suspense), CustomTypeOptions key checking, parity test; custom context and react-intl rejected.
- [0028 — Plural policy + Hermes polyfill](decisions/0028-plural-policy-hermes.md) — plural keys for timeLeft only; runtime-guarded intl-pluralrules (Hermes lacks Intl.PluralRules, i18next v24+ has no fallback).
- [0029 — Locale-safe cached lessons](decisions/0029-locale-safe-cached-lessons.md) — Lesson model went language-neutral (lessonNumber/author), titles compose at render time, buster bumped to lessons-v2.
- [0030 — Question content model](decisions/0030-question-content-model.md) — set/question ids + typed labelKey/a11yKey into the questions namespace; shape labels derived via per-language template (word order safe).
- [0031 — Language detection & persisted override](decisions/0031-language-detection-persistence.md) — device locale → tr|en (fallback tr); explicit choice in persisted settingsStore wins on relaunch; header pill toggle with radio semantics.

## Features

- [Home](features/home.md) — lesson list: data flow, offline behavior, progress indicators, edge cases, manual tests.
- [Exercise](features/exercise.md) — video stage + timed quiz with a 2×2 visual answer grid: events, timer, back guard, feedback states, edge cases, manual tests.
- [Result](features/result.md) — celebration/encouragement, badge reveal animation, idempotent recording, edge cases, manual tests.
- [i18n](features/i18n.md) — Turkish + English: detection, persisted toggle, typed keys, translated question bank, plural handling, manual tests.
