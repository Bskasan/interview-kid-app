[Türkçe](#turkce) | [English](#english)

<a id="turkce"></a>

# Bilinen Sınırlamalar / Takaslar

Bu bir take-home projesi: aşağıdakilerin hepsi bilinçli kabul edilmiş eksikler ya da
takaslardır. Her madde iki satırdır — ne olduğu ve neden böyle bırakıldığı / üretimde ne
gerekeceği.

- **picsum.photos "ders" olarak kullanılıyor; tüm dersler tek örnek videoyu paylaşıyor ve
  quiz içeriği yerel bir mock bankası** (20 dersin paylaştığı 5 set).
  Şartname açık API + yerel mock'a izin veriyor; üretim, ders başına video ve yazılmış soru
  bankaları taşıyan gerçek bir içerik modeli ister.
- **Backend, kimlik doğrulama ve analitik yok** — ilerleme yalnızca cihazda (AsyncStorage).
  Üretim; hesaplar, cihazlar arası senkron ve ürün metrikleri için bir servis katmanı ister.
- **Çökme raporlayıcı bağlı değil.** Her hata tek bir logger'dan geçiyor ve üretim için
  açık bir bağlantı noktası var; Sentry (veya benzeri) tek dosyalık bir ekleme — o güne dek
  hatalar kullanıcıya gösteriliyor ama toplanmıyor.
- **Sesli okuma henüz görsel bir "yer".** 🔊 butonları dürüst basma geri bildirimi veriyor
  ama ses çalmıyor; üretimde bir TTS motoru (expo-speech) mevcut `speak(text, language)`
  arayüzüne oturur.
- **iOS gerçek cihazda test edilmedi.** Her kapı iOS paketini derliyor (yani derlenirliği
  kanıtlı) ve kod yalnızca platformlar arası Expo SDK modülleri kullanıyor; ancak Windows'ta
  geliştiriyorum ve Apple donanımım yoktu — iOS'ta gerçek cihaz görüntüsü, haptics, video ve
  VoiceOver doğrulanmadı.
- **Dil düğmesinde bayraklar dili temsil ediyor** — anlamsal olarak kusurlu (bayrak ülke
  gösterir; İngilizce için 🇬🇧 keyfî bir seçim). Okuma öncesi bir çocuk bayrağı yazıdan
  hızlı tanıdığı için iki dilli bir çocuk uygulamasında kabul edildi; sabit TR/EN etiketleri
  ve sesli açıklama tam durumu okuyanlara taşır.
- **İlerleme haritası, şartnamenin istediğinden fazla mekanizma içeriyor** — düz,
  dokunulabilir bir liste gereksinimi çok daha az kodla karşılardı (geometri, kilit
  kuralları, balon, store migration'ı). Oyunlaştırılmış-his hedefi için bilinçli seçildi;
  bedeli, satır satır savunulması gereken karmaşıklık.
- **Seri (streak) yalnızca yerel ve hile edilebilir** — cihaz saatini okur; tarihi ileri
  almak seriyi şişirir (geri almak bilinçli olarak sıfırlamaz). Backend'siz, cihaz-içi bir
  ödül için kabul edilebilir; gerçek ürün aktiviteyi sunucu tarafında doğrular.
- **Dil değişimi tasarım gereği ~0,85 sn sürüyor** — geçiş bilinçli bir tören, gecikme
  değil; hareket azaltan kullanıcılar anında geçiş alır. Süre bir ayar düğmesi
  (`LANGUAGE_TRANSITION` sabitleri) — yavaş cihazlarda yanlış hissettirirse tek yerden
  değişir.
- **Branch koruması ertelendi** — GitHub Free planında özel depoda ruleset'ler sunucu
  tarafında zorlanamıyor; içe aktarmaya hazır ruleset depoda hazır, o güne dek pre-push
  hook'u zorlayıcı kapı.
- **Dil düğmesi ebeveyn kapısının arkasında değil** — çocuk dili değiştirebilir (zararsız,
  tek dokunuşla geri alınır); gerçek ürün bunu ebeveyn kapısının arkasına taşır.
- **JS zamanlayıcıları** — geri sayım zaman damgası temelli (kaymaya dirençli) ama gösterge
  çözünürlüğü ~100 ms; bir çocuk quiz'i için yeterli, hassasiyet-kritik işler için değil.
- **E2E testi yok ve yerleşim (layout) kapsaması hiç yok** — 175 birim/bileşen testi mantık
  ve ekran karar noktalarını kapsıyor, ama test renderer'ında yerleşim motoru yok: ekran
  dışına taşan bir öğe "orada mı?" denetiminden yine geçer. Yaşanmış bir hata (satırından
  dışarı itilen bir buton) bu boşluğu kanıtladı; dar-ekran kontrolleri manuel tura eklendi
  ve her satır-içi kontrol tek bir yazılı yerleşim kuralına uyuyor. CI'da yakalanması
  cihaz temelli bir koşucu (Maestro/Detox) ister.
- **Büyük yazı tipleri ~1,4×'e kadar sağlamlaştırıldı, sonuna kadar değil** — bir kontrolle
  satır paylaşan metin sınırlandı ve doğru daralıyor; ama sabit yükseklikli ekranlar
  kaydırmadığından en büyük sistem yazı boylarında içerik yeniden akmak yerine sıkışır.
- **Ebeveyn kapısı yok** — gerçek bir çocuk ürünü ister (mağaza aile politikaları); burada
  bilinçli olarak kapsam dışı.
- **Halka açık örnek video** — Google'ın klasik örnek bucket'ı proje ortasında 403 dönmeye
  başlayınca test-videos.co.uk ile değiştirildi; o da ölürse çocuk bozuk bir ekran yerine
  seçim kartını görür (tekrar dene / videosuz devam et).
- **Web tesadüfî** — yalnızca istemci tarafında çalışıyor; tarayıcılar sesli otomatik
  oynatmayı engelliyor ve web desteklenen bir hedef değil.

---

<a id="english"></a>

# Known Limitations / Trade-offs

This is a take-home project: everything below is a consciously accepted gap or trade-off.
Each item is two lines — what it is, and why it was left this way / what production would
need.

- **picsum.photos stands in for "lessons"; every lesson shares one sample video, and quiz
  content is a local mock bank** (5 sets shared by 20 lessons).
  The brief allows an open API + local mock; production wants a real content model with
  per-lesson videos and authored question banks.
- **No backend, no auth, no analytics** — progress lives only on-device (AsyncStorage).
  Production needs a service layer for accounts, cross-device sync and product metrics.
- **No crash reporter wired.** Every failure already funnels through one logger with an
  explicit production hook point, so wiring Sentry (or similar) is a one-file change —
  until then failures are surfaced to the user but not collected.
- **Read-aloud is a visual affordance pending TTS.** The 🔊 buttons give honest press
  feedback but play no audio yet; in production a text-to-speech engine (expo-speech) drops
  into the existing `speak(text, language)` interface.
- **iOS is device-untested.** Every gate builds the iOS bundle (so it provably compiles)
  and the code uses only cross-platform Expo SDK modules, but I develop on Windows and had
  no Apple hardware — real-device rendering, haptics, video playback and VoiceOver on iOS
  are unverified.
- **Flags stand for languages** on the switch — semantically imprecise (flags denote
  countries; 🇬🇧 for English is an arbitrary pick). Accepted for a two-language kids' app
  because a pre-reader recognizes a flag faster than a word; the fixed TR/EN labels and the
  spoken description carry the exact state for readers.
- **The progress map is more machinery than the brief asked for** — a flat tappable list
  would have met the requirement with a fraction of the code (geometry, unlock rules,
  bubble, store migration). Chosen deliberately for the gamified-feel goal; the cost is
  complexity that must be defensible line by line.
- **The streak is local-only and cheatable** — it reads the device clock, so setting the
  date forward inflates it (backwards deliberately does not reset it). Acceptable for an
  on-device reward with no backend; a real product validates activity server-side.
- **Changing language takes ~0.85 s by design** — the transition is deliberate ceremony,
  not lag; reduced-motion users get an instant swap. The duration is a knob
  (`LANGUAGE_TRANSITION` constants) if it ever feels wrong on slower devices.
- **Branch protection is deferred** — private repo on the GitHub Free plan, where rulesets
  cannot be enforced server-side; the import-ready ruleset is committed and the pre-push
  hook is the enforced gate until then.
- **The language toggle is not parent-gated** — a child can flip languages (harmless,
  reversible in one tap); a real product would move it behind the parental gate.
- **JS timers** — the countdown is timestamp-based (drift-resistant) but display
  granularity is ~100 ms; fine for a kids' quiz, not for precision-critical use.
- **No E2E tests, and no layout coverage at all** — 175 unit/component tests cover logic
  and screen decision points, but the test renderer has no layout engine: an element pushed
  off-screen still passes an "is it there?" assertion. One shipped bug (a button pushed
  outside its row) proved that gap; narrow-screen checks joined the manual pass and every
  inline control follows one written layout rule. Catching it in CI needs a device-based
  runner (Maestro/Detox).
- **Large fonts are hardened to ~1.4×, not to the maximum** — text sharing a row with a
  control is capped and yields correctly, but the fixed-height screens do not scroll, so at
  the very largest system font sizes content gets tight rather than reflowing.
- **No parental gate** — a real kids' product needs one (app-store family policies);
  deliberately out of scope here.
- **Public sample video** — Google's classic sample bucket started returning 403
  mid-project and was replaced with test-videos.co.uk; if that dies too, the child gets the
  choice card (retry / continue without the video) instead of a broken screen.
- **Web is incidental** — it runs client-side only, but browsers block autoplay-with-sound
  and it is not a supported target.
