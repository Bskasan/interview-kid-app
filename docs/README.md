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
- [0032 — Central error handling](decisions/0032-central-error-handling.md) — AppError as plain discriminated object, normalizeError + handleError funnel with notify/silent severities, dev-only logger as the single console site, reportingStorage wrapper.
- [0033 — Error surfacing](decisions/0033-error-surfacing.md) — single-slot replace-on-new banner (no queue, no blocking modal), silent policy where screens own their failure UI, root ErrorBoundary with kid-friendly fallback.
- [0034 — Exit confirm sheet](decisions/0034-exit-confirm-sheet.md) — 🏠 button + one Modal sheet for every exit path on both stages (supersedes 0014's quiz-only Alert); pause-while-open semantics; stay is the safe default.
- [0035 — Video failure: the child decides](decisions/0035-video-failure-child-decides.md) — explicit loading/ready/ended/error machine, 12 s watchdog + offline-on-entry, retry-by-remount, continue-without-video (supersedes 0012's unlock-on-error).
- [0036 — Shared utils layout](decisions/0036-shared-utils-layout.md) — React-free helpers in src/utils (clamp, hashString, routeParams), useNavigationLock hook, haptics wrapper; no barrel exports; what was deliberately not extracted.
- [0037 — Categorized constants](decisions/0037-constants-extraction.md) — src/constants (timing/layout/api/media/quiz), no barrel; constants = cross-cutting config vs theme = visual tokens; pass ratio and derived values deliberately stay beside their logic.
- [0038 — File header summaries + comment policy](decisions/0038-file-header-summaries.md) — every app/src file opens with a 2–4 line what/role summary (the one sanctioned "what" comment); all other comments stay why-only; config/JSON exempt.
- [0039 — Visual language switch](decisions/0039-visual-language-switch.md) — flag tiles with endonyms (superseded by 0043's single toggle; the overlay ceremony, flag-emoji stance and eslint-plugin-i18next enforcement decided here stand).
- [0040 — Cross-platform dev + iOS gate](decisions/0040-cross-platform-ios-gate.md) — `expo export --platform all` in every gate proves the iOS bundle builds without a Mac; EAS/macOS runners rejected; explicit casing enforcement; what stays hardware-untested.
- [0041 — Infinite lesson paging](decisions/0041-infinite-lesson-paging.md) — useInfiniteQuery over picsum pages (2 × 10, hard-capped at the fixed 20-lesson catalog): raw-length end detection, page-anchored "Ders N" numbering, cross-page dedupe, offline gate, cancelRefetch:false multi-fire guard, buster lessons-v3.
- [0042 — Tint feedback + white visual chip](decisions/0042-tint-feedback-white-chip.md) — answer feedback becomes light tint + 4dp full-strength border + ✓/✗ badge around a constant white chip, so feedback color can never swallow same-colored artwork; 18% tint tokens, ink-only-on-tints rule.
- [0043 — Single-toggle language switch](decisions/0043-single-toggle-language-switch.md) — one pill track + sliding flag knob replaces the two tiles (supersedes 0039's tile design): knob shows the current language with fixed TR/EN end labels, worklet mid-slide flag crossfade, button role over switch, flat styling over the reference's neumorphism.
- [0044 — Tab shell](decisions/0044-tab-shell.md) — bottom tabs (Ana Sayfa / Alıştırmalar / Ayarlar) with exercise/result kept outside the group so no tab bar can interrupt a quiz; re-pointed navigation targets; principle #1 amended.
- [0045 — Welcome every launch](decisions/0045-welcome-every-launch.md) — welcome owns `/`, dashboard lives at `(tabs)/home` (route collision), replace-into-tabs so back exits; <2s to dismiss, button live from first frame; translated app name.
- [0046 — Local streak rules](decisions/0046-streak-day-rules.md) — local calendar days, DST-proof diff, same-day identity no-op, clock-rollback keeps the streak, root-level AppState trigger; local-only and cheatable by design.
- [0047 — Progress map + unlocking](decisions/0047-progress-map-unlocking.md) — winding node path replaces the flat list (supersedes 0007's presentation): stars = best correct (thresholds unchanged), unlock at PASS_RATIO stars, per-row SVG connectors (virtualization-safe), computed bubble anchors, bubble-instead-of-direct-open deviation.
- [0048 — Versioned progress persistence](decisions/0048-progress-persist-migration.md) — zustand version+migrate on the kept `progress-v1` key (renaming would delete earned progress); legacy records normalized once; stars derived, never stored.
- [0049 — Quiz outcome history](decisions/0049-quiz-outcome-history.md) — QuizState records each question's outcome at lock-in time; the segmented bar shows ✓/✗ per segment (timeout renders as wrong but is announced distinctly); pushed-at-lock-in vs at-advance vs screen-side state.

## Features

- [Exercises map](features/exercises-map.md) — the Alıştırmalar tab's winding progress path (replaces the flat list doc): star-gated unlocking, node bubbles, incremental loading, offline behavior, edge cases, manual tests.
- [App shell](features/shell.md) — welcome-every-launch, bottom tabs, dashboard (streak + total stars), settings; streak rules and manual tests.
- [Exercise](features/exercise.md) — video stage + timed quiz with a 2×2 visual answer grid: events, timer, back guard, feedback states, edge cases, manual tests.
- [Result](features/result.md) — celebration/encouragement, badge reveal animation, idempotent recording, edge cases, manual tests.
- [i18n](features/i18n.md) — Turkish + English: detection, persisted flag-tile switch with animated transition, typed keys, translated question bank, plural handling, lint enforcement, manual tests.
- [Error handling](features/error-handling.md) — the central funnel, banner/boundary surfaces, silent policy, storage wrapper, edge cases, manual tests.
- [Platforms](features/platforms.md) — Windows/macOS dev with Android/iOS targets: portability guarantees, the all-platform bundle gate, what stays hardware-untested, borrowed-Mac checklist.
