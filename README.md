[Türkçe](#turkce) | [English](#english)

<a id="turkce"></a>

# Çocuklar İçin Öğrenme Uygulaması — Mini Akış

React Native + Expo (SDK 57, Expo Router, strict TypeScript) ile geliştirilmiş, ~5–8 yaş
çocuklara yönelik küçük, oyunlaştırılmış bir öğrenme uygulaması. Kısa bir **karşılama**
ekranı üç sekmeli kabuğa açılır: **Ana Sayfa** (gün serisi ve toplam yıldız sayısını
gösteren pano), **Alıştırmalar** (açık bir API'den çekilen ders kataloğu üzerinde kıvrılan
bir ilerleme haritası — dersler yıldız kazandıkça sırayla açılır) ve **Ayarlar** (dil +
sürüm). Açık bir harita düğümüne dokunmak tam ekran **Alıştırma** akışını başlatır (kısa
video, ardından büyük görsel yanıt kartları üzerinde süreli 3 soruluk bir quiz) ve akış
**Sonuç** ekranında biter (yıldız gösterimi + animasyonlu rozet). Uygulama içi dil
düğmesiyle tamamen iki dilli (Türkçe/English). Sunucu verisi, AsyncStorage'a
kalıcılaştırılan TanStack Query üzerinden gelir; ilerleme, seri ve ayarlar kalıcı zustand
store'larında tutulur; animasyonlar Reanimated ile yapılır; çalışma zamanı hataları tek bir
merkezî, çocuk dostu hata yolundan geçer.

> ⚠️ Bilinen eksikler, teknik borç ve bilinçli takaslar ayrı bir dosyada:
> **[KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md#turkce)**

## Nasıl çalıştırılır

Her şeyi **Windows + fiziksel Android telefon (Expo Go)** üzerinde geliştirip bizzat
doğruladım. Diğer satırlar standart Expo akışlarıdır — kod yalnızca platformlar arası Expo
SDK API'leri kullanır ve CI her push'ta iOS paketini de derler — ama bunları kendim
çalıştıramadım; tabloda dürüstçe işaretli.

Her yerde ön koşul: Node LTS (20+), ardından bir kez `npm install`. Fiziksel telefon için
güncel **Expo Go** (Play Store / App Store — Expo Go yalnızca en yeni SDK'yı çalıştırır; bu
proje SDK 57'de).

| Geliştirme makinesi | Hedef                      | Adımlar                                                                                                                              | Doğrulandı mı?                  |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Windows             | Android telefon (Expo Go)  | `npx expo start`, QR'ı Expo Go ile okut (telefon ve PC aynı Wi-Fi'da). Ağ sorunlarında (güvenlik duvarı): `npx expo start --tunnel`. | ✅ bizzat test edildi           |
| Windows             | Android emülatörü          | Android Studio + bir AVD, `npx expo start`, `a` tuşu.                                                                                | ✅ bizzat test edildi           |
| Windows             | iPhone (Expo Go)           | `npx expo start`, QR'ı iPhone kamerasıyla okut → Expo Go'da açılır (aynı ağ, ya da `--tunnel`). Windows'ta iOS simülatörü yoktur.    | ⚪ standart akış, test edilmedi |
| macOS               | iOS Simülatörü             | Xcode + iOS Simulator kurulu olmalı, `npx expo start`, `i` tuşu.                                                                     | ⚪ standart akış, test edilmedi |
| macOS               | Android (emülatör/telefon) | Android Studio + AVD, `npx expo start`, `a` — ya da fiziksel telefonda Expo Go + QR.                                                 | ⚪ standart akış, test edilmedi |

`npm test` ve `npm run check` Windows ve macOS'ta birebir aynı davranır: npm script'leri ve
git hook'ları düz POSIX sh'tır (Windows'ta Git Bash, macOS'ta zsh/bash); platforma özgü
sözdizimi veya yol ayracı yoktur.

Kontroller: `npm run check` tüm kapı zincirini sırayla çalıştırır — typecheck (önce Expo
Router'ın gitignore'lanmış tipli rotalarını yeniden üretir, yani temiz bir klonda da
çalışır), ESLint, Prettier kontrolü, Jest (175 test) ve tek seferde **Android, iOS ve web**
paket dışa aktarımı. Tekil script'ler: `npm run typecheck` · `npm run lint` / `lint:fix` ·
`npm run format` / `format:check` · `npm test` · `npm run build`. Ortam sağlığı için
`npx expo-doctor`.

Git hook'ları `npm install` ile otomatik kurulur (husky): **pre-commit** lint-staged
(staged dosyalara ESLint + Prettier) ve tam typecheck çalıştırır, **commit-msg**
Conventional Commits'i zorunlu kılar, **pre-push** `npm run check`'in tamamını koşar — bir
kapıdan geçemeyen hiçbir şey makineden çıkmaz.

## Kalite kapıları & CI

GitHub Actions (`.github/workflows/ci.yml`), `npm run check` ile aynı zinciri — kurulum,
typecheck, lint, format kontrolü, testler ve Android + iOS + web paket dışa aktarımı — her
`main` pull request'inde ve her `main` push'unda tek bir hızlı-başarısız (fail-fast) iş
olarak çalıştırır; geride kalan koşular otomatik iptal edilir ve `main` push'ları dışa
aktarılan paketleri artifact olarak yükler (main'in iki mobil platform için de her zaman
derlendiğinin kanıtı). Depo, GitHub Free planında özel olduğundan branch ruleset'leri henüz
sunucu tarafında zorlanamıyor; içe aktarmaya hazır bir ruleset (PR zorunlu, yeşil `ci`
kontrolü zorunlu, doğrusal geçmiş, force push/silme yasak) `.github/rulesets/main.json`
içinde hazır bekliyor — o güne dek zorlayıcı kapı pre-push hook'udur.

## Diller

Türkçe ve İngilizce. İlk açılış cihaz dilini izler (diğer tüm diller Türkçe'ye düşer).
Ayarlar sekmesinde tek bir düğme vardır: sabit TR/EN etiketli bir hap (pill) ray ve aktif
dilin bayrağını (🇹🇷/🇬🇧) gösteren kayar bir top — okuma bilmeyen bir çocuk hangisinin açık
olduğunu bir bakışta görür. Dokununca top kayar (bayrak kayma sırasında değişir) ve kısa
(~0,85 sn) tam ekran bir geçiş oynar: maskot zıplarken tüm uygulama — soru içerikleri ve
ekran okuyucu etiketleri dahil — altta değişir; seçim yeniden başlatmalarda korunur.
Hareket azaltma açıksa geçiş yok, anında değişir. Tüm metinler
`src/locales/tr.json` / `en.json` içindedir; çeviri anahtarları derleme zamanında denetlenir
(bilinmeyen anahtar `tsc`'yi düşürür), bir ESLint kuralı (`i18next/no-literal-string`) koda
gömülü UI metnini engeller ve bir test paketi iki dosyanın aynı anahtarlara, boş olmayan
değerlere ve eşleşen yer tutuculara sahip olduğunu zorlar. Soru verisi dil-nötrdür
(görseller ve doğru cevaplar ortak, metin dile göre). Çoğula duyarlı tek metin
`Intl.PluralRules` kullanır; desteklemeyen motorlarda (Hermes) çalışma zamanında polyfill
edilir.

## Mimari genel bakış

`app/` altındaki rotalar, her şeyi `src/`'den birleştiren ince ekranlardır. Ana veri
akışları: picsum sayfaları → React Query sonsuz sorgu (çevrimdışı için AsyncStorage'a
kalıcı) → alıştırma haritası (kilit durumları saf biçimde ilerleme store'undan türer);
yerel soru bankası + i18n kaynakları → Alıştırma (saf quiz durum makinesi + geri sayım
hook'u); quiz sonucu → zustand (kalıcı, migration'lı sürümleme) → harita yıldızları, pano
toplamı ve seri kartı (AppState'ten beslenen kendi store'u). Çalışma zamanı hataları — ağ,
medya, depolama, çökme — tek bir huniden (`handleError`) geçer: her zaman loglanır (yalnızca
geliştirmede yazan, crash-reporter bağlantı noktalı logger), çocuğa yalnızca sakin ve
çevrilmiş bir bant ya da tam ekran bir geri düşüş olarak gösterilir; asla kod veya stack
trace görünmez. Tüm saf mantık (puanlama, quiz geçişleri, geri bildirim eşlemesi, savunmacı
API ayrıştırma, kart boyutlama, genel yardımcılar) `src/lib`/`src/api`/`src/utils` içinde
durur ve birim testlidir; arayüz tasarım token'larından elle yazılmıştır, UI kit yoktur.

```
app/                 # rotalar: _layout (sağlayıcılar, hata sınırı, seri takibi),
                     # index (karşılama), (tabs)/{home,exercises,settings}, exercise/[id], result
src/
  api/               # picsum sayfalı fetcher + savunmacı mapper + sayfalama yardımcıları → Lesson[]
  components/        # AnswerGrid/AnswerTile, MapNodeRow, LessonBubble, StarRow, StarReveal,
                     # ChunkyButton, Mascot, SpeakButton, ExerciseVideo, ExitConfirmSheet,
                     # VideoUnavailableCard, GlobalErrorBanner, LanguageSwitch,
                     # LanguageTransitionOverlay, TimerBar, SegmentedProgress, BadgeReveal…
  constants/         # kesişen yapılandırma: zamanlama, dokunma hedefleri, api değerleri,
                     # medya url'i, quiz şekli, harita yerleşimi
  data/              # soru bankası (5 görsel set; metinler i18n üzerinden)
  hooks/             # useLessons, useNetworkStatus, useCountdown, useAppActive, useCountUp,
                     # usePressFeedback, usePulse, useNavigationLock, useStreakTracker
  i18n/              # i18next tekili (senkron init, tipli anahtarlar)
  lib/               # puanlama, quiz durum makinesi, kilit kuralları, harita geometrisi,
                     # seri kuralları, yıldız sözlüğü, konuşma stub'ı, hata hunisi + logger,
                     # haptics, depolama
  locales/           # tr.json / en.json kaynakları (ekran başına namespace)
  store/             # zustand store'ları: progress (sürümlü) + settings + streak (kalıcı),
                     # hata bandı + dil geçişi (bellekte)
  theme/             # tasarım token'ları: renkler, boşluk, köşe, tipografi, hareket
  utils/             # React'sız yardımcılar: clamp, hashString, routeParams
__tests__/           # src/ ve app/ yapısını aynalar
```

## Varsayımlar

Şartnamenin açık bıraktığı yerlerde şöyle karar verip uyguladım:

1. **Quiz, video bitince açılır.** Video oynatılamazsa — oynatıcı hatası, 12 sn içinde
   oynatılabilir hale gelmemesi ya da cihazın çevrimdışı olması — bir kart, soruların bu
   videoyla ilgili olduğunu anlatır ve **çocuk seçer**: tekrar dene ya da videosuz devam et.
   Medya akışı asla kilitlemez, ama sessizce de atlanmaz.
2. **Ders başına 3 soru, soru başına 15 sn.** Görünür, daralan bir süre çubuğu; süre dolması
   yanlış sayılır ve otomatik ilerler. Sayaç **uygulama arka plana alınınca durur** (bir
   telefon araması ya da ana ekran tuşu çocuğun süresini yememeli) ve kaldığı yerden sürer.
3. **Geçme = en az 2/3.** 3/3 "mükemmel" rozeti, 2/3 normal rozet kazandırır; daha azı
   cesaretlendirme ve bariz bir tekrar dene butonu alır. **Tekrarlar en iyi sonucu korur** —
   adildir, çünkü bir ders her zaman aynı soru setini alır (ders kimliğinden deterministik
   türetilir).
4. **Alıştırmadan çıkmak onay ister.** Her iki aşamada da görünür duran 🏠 butonu ile geri
   tuşu/jesti aynı onay sayfasını açar — ders görseli, maskot, güvenli seçenek olarak "devam
   et" — bu sırada video ve soru sayacı altta durur. Onaylamak o denemeyi siler; Sonuç
   ekranına kadar hiçbir şey kaydedilmez, Sonuç da tam bir kez kaydeder.
5. **"İlerleme/rozet göstergesi" = yıldızlar.** Tamamlanmış en iyi denemenin her doğru
   cevabı için bir ⭐ (3 üzerinden ⭐⭐☆), her harita düğümünün altında gösterilir ve panoda
   toplanır; rozetler Sonuç ekranının kutlaması olarak kalır. Yalnızca tamamlanmış denemeler
   sayılır.
6. **Çevrimdışı politikası**: ders listesi önbelleğe alınır; önbellek varken çevrimdışı,
   listeyi + bir çevrimdışı bandını gösterir; önbelleksiz çevrimdışı, tekrar dene'li bir
   hata durumu gösterir. Quiz'in kendisi tamamen çevrimdışı çalışır (yerel veri; tek
   fotoğraflı soru emojiye düşer).
7. **Cevaplar görsel-öncelikli kartlardır** (çizili şekiller, emoji, rakamlar ve bir
   fotoğraftan oluşan 2×2 ızgara) çünkü hedef yaş okuma öncesini de kapsar; yine de her kart
   betimleyici bir erişilebilirlik etiketi taşır ve küçük bir 360×640 ekrana kaydırmasız
   sığacak şekilde boyutlanır.
8. **Tasarım dili**: sıcak ve sakin — krem arka plan, tombul 3B-kenarlı butonlar, konuşma
   balonlu özgün bir tilki-emoji maskot, başarıda kutlama, başarısızlıkta nazik
   cesaretlendirme (sert kırmızı yok, cezalandıran ses yok). Popüler çocuk uygulamalarından
   ruhen ilham alır; üçüncü taraf görsel, isim veya marka rengi yoktur. Ekran başına tek ana
   eylem, ≥56dp dokunma hedefleri, her zaman ikonla eşleşen ≥18sp metin, ≥4.5:1 kontrast,
   her yerde hareket azaltmaya saygı.
9. **Dil düğmesi görsel ve bilinçli olarak törenseldir.** Tek düğme (sabit TR/EN etiketleri,
   aktif dilin bayrağını gösteren kayar top — okuma öncesi bir çocuğun tanıyacağı biçimde)
   ve dil değişimi anlık bir yeniden boyama yerine kısa bir maskot geçişi oynatır — çocuk
   bir "an"ın yaşandığını görür ve değişim ekran kapalıyken gerçekleşir, yani yarı çevrilmiş
   bir kare asla görünmez. Hareket azaltma töreni tamamen atlar.
10. **Şartnameden bilinçli sapma: dersler sırayla açılır ve bir derse dokunmak alıştırmayı
    değil bir balonu açar.** Şartname, listedeki öğeye dokununca Alıştırma ekranının
    açılmasını söyler; alıştırmalar sekmesi bunun yerine, N. ders ≥2⭐ olunca N+1'in
    açıldığı bir ilerleme patikasıdır ve düğüme dokunmak küçük bir balon açar (ders görseli,
    başlık, yıldızlar, "Başla"). Bunun bir alt sonucu: **küçük görsel ve başlık, düğümün
    üstünde değil bu balonda yaşar** — düğüm yüzü okunaklı kalsın diye ders numarası/kilit +
    yıldızları taşır; şartnamenin öğe başına istediği üçlü, bilinçli olarak tek dokunuş
    derinliktedir. Gerekçe: oyunlaştırılmış patika görünür bir ilerleme ve dersi hakkıyla
    bitirme nedeni verir, kilitli bir haritanın "bu neden açılmıyor?"u anlatacak bir yere
    ihtiyacı vardır ve onay adımı bu yaşta kazara dokunuşlara karşı korur. Açık yol iki
    dokunuş olarak kalır (düğüm → Başla).
11. **Karşılama ekranı her açılışta görünür** — bilinçli bir ritüel (maskot, uygulama adı,
    tek satır, Başla); ilk-kurulum tanıtımı değildir. Dönen kullanıcıyı hafifçe yorabilir;
    tek ve anında bir dokunuşla kapanarak dengelenir (<2 sn, buton ilk kareden canlıdır).
12. **Sesli okuma önce bir "yer" olarak gemide.** Çocuğun tek başına anlaması gereken her
    cümlenin yanında 🔊 butonu vardır; dürüst basma geri bildirimi verirler, sesin kendisi
    ise mevcut `speak(text, language)` arayüzünün arkasında bir TTS motorunu bekler.

## Daha fazla zamanım olsaydı

Öncelik sırasıyla:

1. **Gerçek içerik modeli + backend** — picsum ve ortak mock setler yerine ders başına video
   ve yazılmış soru bankaları.
2. **Maestro ile E2E testleri** — üç akış için (mutlu yol, süre dolması, bırak-ve-tekrar-dene).
3. **Gemideki 🔊 butonlarının arkasına gerçek TTS** (expo-speech mevcut
   `speak(text, language)` arayüzüne oturur) — okuma öncesi çocuklar için dürüst çözüm;
   yalnız metin hedef yaşın bir kısmını dışarıda bırakır.
4. **Ses efektleri ve sahip olunan bir set ile gerçek çizimler/maskot** (development build
   Lottie'yi de açar).
5. **Analitik + çökme raporlama**, tam-bir-kez deneme kimlikleriyle — merkezî hata hunisinin
   üretim bağlantı noktası, raporlayıcının takılacağı yerdir.
6. **Performans geçişi** — uzun listeler için FlashList, quiz'in fotoğraflı sorusu için
   görsel ön-yükleme.
7. **iOS cihaz doğrulaması** (paket zaten her kapıda derleniyor) ve ebeveyn kapısı.

---

<a id="english"></a>

# Kids Learning App — Mini Flow

A small gamified learning app for children (~5–8) built with React Native + Expo (SDK 57,
Expo Router, TypeScript strict). A short **welcome** screen leads into a three-tab shell:
**Ana Sayfa** (dashboard with a day streak and the total star count), **Alıştırmalar** (a
winding progress map over a lesson catalog fetched from a public API — lessons unlock
sequentially by earning stars) and **Ayarlar** (language + version). Tapping an unlocked map
node opens the full-screen **Exercise** flow (short video, then a timed 3-question quiz on
big visual answer tiles) and ends on the **Result** screen (star reveal + animated badge).
Fully bilingual (Türkçe/English) with an in-app language toggle. Server data goes through
TanStack Query persisted to AsyncStorage; progress, streak and settings live in persisted
zustand stores; animations are Reanimated; runtime failures funnel through one central,
kid-friendly error path.

> ⚠️ Known gaps, technical debt and deliberate trade-offs live in a separate file:
> **[KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md#english)**

## How to run

I built and personally verified everything on **Windows + a physical Android phone (Expo
Go)**. The other cells follow standard Expo tooling — the code uses only cross-platform Expo
SDK APIs and CI builds the iOS bundle on every push — but I could not run them myself, so
they are marked honestly below.

Prerequisites everywhere: Node LTS (20+), then `npm install` once. For a physical phone, the
latest **Expo Go** (Play Store / App Store — Expo Go only runs the newest SDK; this project
is on SDK 57).

| Dev machine | Target                   | Steps                                                                                                                                  | Verified                   |
| ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Windows     | Android phone (Expo Go)  | `npx expo start`, scan the QR with Expo Go (phone and PC on the same Wi-Fi). Network problems (firewalls): `npx expo start --tunnel`.  | ✅ personally tested       |
| Windows     | Android emulator         | Android Studio with an AVD, `npx expo start`, press `a`.                                                                               | ✅ personally tested       |
| Windows     | iPhone (Expo Go)         | `npx expo start`, scan the QR with the iPhone camera → opens in Expo Go (same LAN, or `--tunnel`). No iOS simulator exists on Windows. | ⚪ standard flow, untested |
| macOS       | iOS Simulator            | Xcode with its iOS Simulator installed, `npx expo start`, press `i`.                                                                   | ⚪ standard flow, untested |
| macOS       | Android (emulator/phone) | Android Studio with an AVD, `npx expo start`, press `a` — or Expo Go + QR on a physical phone.                                         | ⚪ standard flow, untested |

`npm test` and `npm run check` behave identically on Windows and macOS: the npm scripts and
git hooks are plain POSIX sh (Git Bash on Windows, zsh/bash on macOS) with no
platform-specific syntax or paths.

Checks: `npm run check` runs the whole gate suite in order — typecheck (which first
regenerates Expo Router's gitignored typed routes, so it works on a fresh clone), ESLint,
Prettier check, Jest (175 tests) and a bundle export for **Android, iOS and web** in one
pass. Individual scripts: `npm run typecheck` · `npm run lint` / `lint:fix` ·
`npm run format` / `format:check` · `npm test` · `npm run build`. `npx expo-doctor` for
environment sanity.

Git hooks are installed automatically by `npm install` (husky): **pre-commit** runs
lint-staged (ESLint + Prettier on staged files) plus a full typecheck, **commit-msg**
enforces Conventional Commits, and **pre-push** runs the entire `npm run check` — nothing
that fails a gate leaves the machine.

## Quality gates & CI

GitHub Actions (`.github/workflows/ci.yml`) runs the same suite as `npm run check` — install,
typecheck, lint, format check, tests, and the Android + iOS + web bundle export — as a single
fail-fast job on every pull request into `main` and every push to `main`; superseded runs are
auto-cancelled, and `main` pushes upload the exported bundles as an artifact (proof that main
always builds, for both mobile platforms).
The repo is private on the GitHub Free plan, where branch rulesets cannot be enforced
server-side yet; an import-ready ruleset (require PR, require the green `ci` check, linear
history, no force pushes or deletion) is committed at `.github/rulesets/main.json` to apply
the moment the plan allows — until then the pre-push hook is the enforced gate.

## Languages

Turkish and English. First launch follows the device language (anything else falls back to
Turkish). The Settings tab holds one toggle: a pill track with fixed TR/EN labels and a
sliding knob showing the current language's flag (🇹🇷/🇬🇧) so a pre-reader can see at a
glance which is active; tapping it slides the knob (the flag swaps mid-slide) and plays a
short (~0.85 s) full-screen transition — the mascot bounces while the whole app, question
content and screen-reader labels included, switches underneath — and the choice is
persisted across restarts. Reduced motion swaps instantly with no overlay. All copy lives
in `src/locales/tr.json` / `en.json`; translation keys are compile-checked (an unknown key
fails `tsc`), an ESLint rule (`i18next/no-literal-string`) blocks hardcoded UI text, and a
test suite enforces that both files have identical keys, no empty values and matching
placeholders. Question data is language-neutral (visuals and correct answers shared, text
per language). The one plural-sensitive string uses `Intl.PluralRules`, polyfilled at
runtime on engines without it (Hermes).

## Architecture overview

Routes under `app/` are thin screens that compose everything from `src/`. The main data
flows: picsum pages → React Query infinite query (persisted to AsyncStorage for offline) →
the exercises map, whose unlock states derive purely from the progress store; local question
bank + i18n resources → Exercise (pure quiz state machine + countdown hook); quiz result →
zustand (persisted, versioned with migration) → map stars, dashboard total and the streak
card (its own store fed from AppState). Runtime failures — network, media, storage,
crashes — go through one funnel (`handleError`): always logged (dev-only logger with a
crash-reporter hook point), surfaced to the child only as a calm translated banner or a
full-screen fallback, never as codes or stack traces. All pure logic (scoring, quiz
transitions, feedback mapping, defensive API parsing, tile sizing, generic helpers) sits in
`src/lib`/`src/api`/`src/utils` and is unit-tested; UI is hand-rolled from design tokens,
no UI kit.

```
app/                 # routes: _layout (providers, error boundary, streak tracker),
                     # index (welcome), (tabs)/{home,exercises,settings}, exercise/[id], result
src/
  api/               # picsum paged fetcher + defensive mapper + pagination helpers → Lesson[]
  components/        # AnswerGrid/AnswerTile, MapNodeRow, LessonBubble, StarRow, StarReveal,
                     # ChunkyButton, Mascot, SpeakButton, ExerciseVideo, ExitConfirmSheet,
                     # VideoUnavailableCard, GlobalErrorBanner, LanguageSwitch,
                     # LanguageTransitionOverlay, TimerBar, SegmentedProgress, BadgeReveal…
  constants/         # cross-cutting config: timing, touch targets, api values, media url,
                     # quiz shape, map layout
  data/              # question bank (5 visual sets; text via i18n)
  hooks/             # useLessons, useNetworkStatus, useCountdown, useAppActive, useCountUp,
                     # usePressFeedback, usePulse, useNavigationLock, useStreakTracker
  i18n/              # i18next singleton (synchronous init, typed keys)
  lib/               # scoring, quiz state machine, unlock rules, map geometry, streak rules,
                     # star vocabulary, speech stub, error funnel + logger, haptics, storage
  locales/           # tr.json / en.json resources (namespaced per screen)
  store/             # zustand stores: progress (versioned) + settings + streak (persisted),
                     # error banner + language transition (in-memory)
  theme/             # design tokens: colors, spacing, radius, typography, motion
  utils/             # React-free helpers: clamp, hashString, routeParams
__tests__/           # mirrors src/ and app/
```

## Assumptions

Where the brief was open, I decided and implemented as follows:

1. **The quiz unlocks when the video ends.** If the video can't play — a player error, no
   playable video within 12 s, or the device is offline — a card explains that the questions
   are about this video and **the child chooses**: try again, or continue without it. Media
   never blocks the flow, but it never silently skips ahead either.
2. **3 questions per lesson, 15 s each.** A visible shrinking timer bar; timeout counts as a
   wrong answer and auto-advances. The timer **pauses while the app is backgrounded** (a call
   or home-button press must not eat the child's time) and resumes where it stopped.
3. **Pass = at least 2/3.** 3/3 earns a "perfect" badge, 2/3 a normal badge, less earns
   encouragement and an obvious retry. **Retakes keep the best result** — fair, because a
   lesson always gets the same question set (derived deterministically from the lesson id).
4. **Leaving mid-exercise asks for confirmation.** An always-visible 🏠 button (both
   stages) and the back button/gesture all open the same confirm sheet — lesson thumbnail,
   mascot, "keep going" as the safe default — while the video and the question timer pause
   underneath. Confirming discards that attempt; nothing is recorded until the Result
   screen, which records exactly once.
5. **"Progress/badge indicator" = stars.** One ⭐ per correct answer of the best completed
   attempt (⭐⭐☆ of 3), shown under each map node and summed on the dashboard; badges remain
   the Result screen's celebration. Driven by completed attempts only.
6. **Offline policy**: the lesson list is cached; offline with cache shows the list plus an
   offline banner, offline without cache shows an error state with retry. The quiz itself is
   fully offline (local data; the single photo question falls back to an emoji).
7. **Answers are visual-first tiles** (2×2 grid of drawn shapes, emoji, digits, one photo)
   because the target age includes pre-readers; every tile still carries a descriptive
   accessibility label, sized so a small 360×640 screen fits everything without scrolling.
8. **Design language**: warm and calm — cream background, chunky 3D-edge buttons, an original
   fox-emoji mascot with speech bubbles, celebration on success, gentle encouragement (no
   harsh red, no punishing sounds) on failure. Inspired by popular kids' learning apps in
   spirit, with no third-party assets, names or brand colors; one primary action per screen,
   ≥56dp touch targets, text ≥18sp always paired with an icon, contrast ≥4.5:1, reduced
   motion respected everywhere.
9. **The language switch is visual and deliberate.** One toggle (fixed TR/EN labels, a
   sliding knob showing the current language's flag — recognizable to a pre-reader), and
   changing language plays a short mascot transition instead of an instant reskin — the
   child sees a moment happen, and the swap lands while the screen is covered so no
   half-translated frame ever shows. Reduced motion skips the ceremony entirely.
10. **Deliberate deviation from the brief: lessons unlock sequentially, and tapping a lesson
    opens a bubble, not the exercise.** The brief says tapping a list item opens the Exercise
    screen; the exercises tab is instead a progress path where lesson N+1 unlocks once lesson
    N has ≥2⭐, and tapping a node opens a small bubble (thumbnail, title, stars, "Başla").
    A sub-consequence: **the thumbnail and title live in that bubble, not on the node
    face** — the node stays legible carrying the lesson number/lock plus its stars, so the
    brief's per-item trio (thumbnail + title + progress) is deliberately one tap deep.
    Rationale: the gamified path gives visible progression and a reason to master a lesson,
    a locked map needs a place to explain "why not this one", and the confirm step protects
    against accidental taps at this age. The open path stays two taps (node → Başla).
11. **The welcome screen shows on every launch** — a deliberate ritual (mascot, app name, one
    line, Başla), not first-run onboarding. It can mildly annoy returning users; mitigated by
    being one immediate tap to dismiss (<2 s, the button is live from the first frame).
12. **Read-aloud is shipped as an affordance first.** 🔊 buttons sit next to every sentence a
    child must understand alone; they give honest press feedback while the audio itself waits
    for a TTS engine behind the existing `speak(text, language)` interface.

## What I would do with more time

In priority order:

1. **Real content model + backend** — per-lesson videos and authored question banks instead
   of picsum + shared mock sets.
2. **E2E tests with Maestro** for the three flows (happy path, timeout, abandon-and-retry).
3. **Real TTS behind the shipped 🔊 buttons** (expo-speech drops into the existing
   `speak(text, language)` interface) — the honest fix for pre-readers; text alone excludes
   part of the target age.
4. **Sound effects and proper illustrations/mascot** from an owned asset set (development
   build would also unlock Lottie).
5. **Analytics + crash reporting** with exactly-once attempt ids — the central error
   funnel's production hook point is where the reporter plugs in.
6. **Performance pass** — FlashList for longer lists, image prefetch for the quiz's photo
   question.
7. **iOS device verification** (the bundle already builds in every gate) and a parental
   gate.
