# Çocuklar İçin Öğrenme Uygulaması — Mini Akış

Bu proje, React Native + Expo (SDK 57, Expo Router, strict TypeScript) ile geliştirilmiş küçük ve oyunlaştırılmış bir öğrenme uygulamasıdır. Uygulama yaklaşık 5–8 yaş aralığındaki çocukları hedefler.

Uygulama önce kısa bir **Karşılama** ekranı gösterir. Ardından kullanıcı üç sekmeli ana yapıya geçer:

- **Ana Sayfa:** Gün serisini ve toplam yıldız sayısını gösteren pano.
- **Alıştırmalar:** Açık bir API'den alınan ders kataloğunu, ilerleme haritası şeklinde gösterir. Dersler yıldız kazanıldıkça sırayla açılır.
- **Ayarlar:** Dil ve uygulama sürümünü gösterir.

Açık bir harita düğmesine dokunulduğunda tam ekran **Alıştırma** akışı başlar. Önce kısa bir video oynatılır, ardından büyük görsel cevap kartlarıyla 3 soruluk süreli bir quiz gelir. Akış **Sonuç** ekranında tamamlanır; burada yıldızlar ve animasyonlu rozet gösterilir.

Uygulama tamamen iki dillidir: **Türkçe / English**. Kullanıcı dili uygulama içindeki dil düğmesinden değiştirebilir.

Sunucu verileri TanStack Query ile alınır ve AsyncStorage'a kalıcı olarak kaydedilir. İlerleme, seri ve ayarlar kalıcı Zustand store'larında tutulur. Animasyonlar Reanimated ile yapılır. Çalışma zamanı hataları tek bir merkezî ve çocuk dostu hata akışından işlenir.

> ⚠️ Bilinen eksikler, teknik borç ve bilinçli takaslar ayrı bir dosyada:
> **[KNOWN-LIMITATIONS-TRADE-OFFS.md](KNOWN-LIMITATIONS-TRADE-OFFS.md)**

## Nasıl çalıştırılır

Geliştirme ve doğrulamanın tamamını **Windows + fiziksel Android telefon (Expo Go)** üzerinde yaptım. Diğer seçenekler standart Expo akışını kullanıyor. Kod yalnızca platformlar arası Expo SDK API'lerini kullanıyor ve CI her push'ta iOS paketini de derliyor. Ancak bu seçenekleri kendim test etmedim; aşağıdaki tabloda durumlarını buna göre belirttim.

Her ortam için **Node LTS (20+)** gerekir. Kurulumdan sonra bir kez `npm install` çalıştırılmalıdır.

Fiziksel telefon kullanıyorsanız güncel **Expo Go** gerekir (Play Store / App Store). Expo Go yalnızca en yeni SDK'yı çalıştırır; bu proje SDK 57 kullanıyor.

| Geliştirme makinesi | Hedef                      | Adımlar                                                                                                                                                                         | Doğrulandı mı?                   |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Windows             | Android telefon (Expo Go)  | `npx expo start` çalıştırın ve QR kodu Expo Go ile okutun. Telefon ve PC aynı Wi-Fi'da olmalı. Ağ veya güvenlik duvarı sorunu varsa `npx expo start --tunnel` kullanın.         | ✅ Bizzat test edildi            |
| Windows             | Android emülatörü          | Android Studio ve bir AVD kurun. `npx expo start` çalıştırın ve `a` tuşuna basın.                                                                                               | ✅ Bizzat test edildi            |
| Windows             | iPhone (Expo Go)           | `npx expo start` çalıştırın. QR kodu iPhone kamerasıyla okutun ve Expo Go'da açın. Aynı ağ kullanılmalı; gerekirse `--tunnel` kullanılabilir. Windows'ta iOS simülatörü yoktur. | ⚪ Standart akış, test edilemedi |
| macOS               | iOS Simülatörü             | Xcode + iOS Simulator kurulu olmalı. `npx expo start` çalıştırın ve `i` tuşuna basın.                                                                                           | ⚪ Standart akış, test edilemedi |
| macOS               | Android (emülatör/telefon) | Android Studio + AVD ile `npx expo start` çalıştırın ve `a` tuşuna basın. Fiziksel telefonda ise Expo Go + QR kod kullanabilirsiniz.                                            | ⚪ Standart akış, test edilemedi |

`npm test` ve `npm run check` Windows ve macOS'ta aynı şekilde çalışır. npm script'leri ve git hook'ları POSIX `sh` kullanır. Windows'ta Git Bash, macOS'ta ise zsh/bash kullanılabilir. Platforma özel bir sözdizimi veya yol ayracı yoktur.

### Kontroller

`npm run check` bütün kalite kontrollerini sırayla çalıştırır:

1. Typecheck — önce Expo Router'ın gitignore'lanmış tipli rotalarını yeniden üretir. Bu nedenle temiz bir klonda da çalışır.
2. ESLint.
3. Prettier kontrolü.
4. Jest — 175 test.
5. Android, iOS ve web paketlerinin dışa aktarılması.

Tek tek çalıştırılabilen script'ler:

- `npm run typecheck`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`
- `npm test`
- `npm run build`

Ortam sağlığını kontrol etmek için:

```bash
npx expo-doctor
```

### Git hook'ları

Git hook'ları `npm install` sırasında Husky ile otomatik kurulur:

- **pre-commit:** staged dosyalarda ESLint + Prettier çalıştırır ve tam typecheck yapar.
- **commit-msg:** Conventional Commits formatını zorunlu kılar.
- **pre-push:** `npm run check` zincirinin tamamını çalıştırır.

Bir değişiklik tüm kalite kontrollerinden geçmeden makineden push edilemez.

## Kalite kapıları & CI

GitHub Actions (`.github/workflows/ci.yml`), `npm run check` ile aynı zinciri her `main` pull request'inde ve her `main` push'unda tek bir fail-fast job olarak çalıştırır:

- kurulum
- typecheck
- lint
- format kontrolü
- testler
- Android + iOS + web paket dışa aktarımı

Devam eden diğer koşular otomatik olarak iptal edilir. `main` push'larında oluşturulan paketler artifact olarak yüklenir. Böylece `main` branch'inin iki mobil platform için de her zaman derlendiği görülebilir.

Depo GitHub Free planında özel olduğu için branch ruleset'leri şu anda sunucu tarafında zorlanamıyor. Ancak içe aktarmaya hazır ruleset `.github/rulesets/main.json` içinde bulunuyor. Bu ruleset şunları zorunlu kılacak:

- PR zorunluluğu
- yeşil `ci` kontrolünün zorunlu olması
- doğrusal geçmiş
- force push ve branch silmenin yasak olması

Bu özellik sunucu tarafında kullanılabilir hale gelene kadar zorlayıcı kapı `pre-push` hook'udur.

## Diller

Uygulama **Türkçe ve İngilizce** destekler. Uygulama ilk açılışta cihazın dilini kullanır. Cihaz dili desteklenmiyorsa Türkçe kullanılır.

Ayarlar sekmesinde tek bir dil düğmesi bulunur. Düğme sabit TR/EN etiketli bir pill ray ve aktif dilin bayrağını (🇹🇷/🇬🇧) gösteren hareketli bir top kullanır. Bu sayede okuma bilmeyen bir çocuk bile hangi dilin aktif olduğunu tek bakışta anlayabilir.

Düğmeye dokunulduğunda top hareket eder ve bayrak hareket sırasında değişir. Ardından yaklaşık **0,85 saniyelik** tam ekran bir geçiş oynatılır. Maskot zıplarken tüm uygulama değişir; buna soru içerikleri ve ekran okuyucu etiketleri de dahildir.

Seçilen dil, uygulama yeniden başlatıldığında da korunur. Hareket azaltma açıksa geçiş oynatılmaz ve dil anında değişir.

Tüm metinler:

- `src/locales/tr.json`
- `src/locales/en.json`

dosyalarında bulunur.

Çeviri anahtarları derleme zamanında kontrol edilir; bilinmeyen bir anahtar `tsc`'yi düşürür. `i18next/no-literal-string` ESLint kuralı, UI metinlerinin doğrudan koda yazılmasını engeller.

Ayrıca testler iki dil dosyasının:

- aynı anahtarlara sahip olmasını,
- boş olmayan değerlere sahip olmasını,
- aynı yer tutucuları kullanmasını

zorunlu kılar.

Soru verileri dil-nötrdür. Görseller ve doğru cevaplar ortaktır; metinler dile göre değişir.

Çoğula duyarlı tek metin `Intl.PluralRules` kullanır. Bunu desteklemeyen motorlarda (Hermes) gerekli polyfill çalışma zamanında eklenir.

## Mimari genel bakış

`app/` altındaki rotalar ince ekranlardır ve gerekli yapıların tamamını `src/` altından birleştirir.

Ana veri akışı şu şekildedir:

1. Picsum sayfaları → React Query sonsuz sorgu → AsyncStorage ile kalıcı önbellek.
2. Önbelleğe alınan dersler → alıştırma haritası.
3. Haritadaki kilit durumları, ilerleme store'undan saf şekilde türetilir.
4. Yerel soru bankası + i18n kaynakları → Alıştırma ekranı.
5. Alıştırma ekranında saf quiz durum makinesi + geri sayım hook'u kullanılır.
6. Quiz sonucu → Zustand → harita yıldızları, pano toplamı ve seri kartı.
7. Seri takibi AppState'ten beslenen kendi store'u ile yapılır.

Ağ, medya, depolama ve uygulama çökmesi gibi çalışma zamanı hataları `handleError` üzerinden işlenir.

Hata sistemi aşağıdaki şekilde çalışmaktadır:

- Hatalar her zaman loglanır.
- Logger yalnızca geliştirme ortamında çıktı üretir.
- Production crash reporter için bir bağlantı noktası bulunur.
- Çocuğa yalnızca sakin ve çevrilmiş bir bant veya tam ekran bir geri dönüş gösterilir.
- Kod veya stack trace hiçbir zaman kullanıcıya gösterilmez.

Uygulamanın saf mantığı `src/lib`, `src/api` ve `src/utils` altında bulunur. Bu kodların birim testleri vardır. Buna puanlama, quiz geçişleri, geri bildirim eşlemesi, savunmacı API ayrıştırma, kart boyutlama ve genel yardımcılar dahildir.

Arayüz, doğrudan tasarım token'ları kullanılarak oluşturulmuştur. Herhangi bir UI kit kullanılmaz.

```text
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

Verilen ödevde açık bırakılan noktalarla ilgili aldığım ve uyguladığım kararlar aşağıdaki şekildedir:

1. **Quiz, video bitince açılır.** Video oynatılamazsa bir kart gösterilir. Bunun nedeni oynatıcı hatası, videonun 12 saniye içinde oynatılabilir hale gelmemesi veya cihazın çevrimdışı olması olabilir. Kart, soruların bu videoyla ilgili olduğunu açıklar ve **çocuğa iki seçenek sunar:** tekrar dene veya videosuz devam et. Medya akışı uygulamayı kilitlemez. Ancak video da sessizce atlanmaz.

2. **Ders başına 3 soru, soru başına 15 saniye.** Görünür ve daralan bir süre çubuğu bulunur. Süre dolarsa cevap yanlış sayılır ve otomatik olarak ilerlenir. Uygulama arka plana alındığında sayaç durur. Böylece telefon araması veya ana ekran tuşu çocuğun süresini tüketmez. Uygulama tekrar aktif olduğunda sayaç kaldığı yerden devam eder.

3. **Geçme = en az 2/3.** 3/3 doğru cevap **"mükemmel"** rozeti, 2/3 normal rozet kazandırır. Daha düşük sonuçta cesaretlendirme mesajı ve belirgin bir tekrar dene butonu gösterilir. Tekrar denemelerde en iyi sonuç korunur. Bu yaklaşım adildir çünkü bir ders her zaman aynı soru setini kullanır. Soru seti ders kimliğinden deterministik olarak türetilir.

4. **Alıştırmadan çıkmak onay ister.** Her iki aşamada da görünen 🏠 butonu ile geri tuşu/jesti aynı onay sayfasını açar. Bu sayfada ders görseli, maskot ve güvenli seçenek olarak **"devam et"** bulunur. Onay ekranı açıkken video ve soru sayacı durur. Çıkışı onaylamak o denemeyi siler. Sonuç ekranına kadar hiçbir ilerleme kaydedilmez. Sonuç ekranı ise sonucu tam olarak bir kez kaydeder.

5. **"İlerleme/rozet göstergesi" = yıldızlar.** Tamamlanmış en iyi denemedeki her doğru cevap için bir ⭐ kazanılır; toplam 3 yıldız üzerinden gösterilir (ör. ⭐⭐☆). Yıldızlar her harita düğümünün altında gösterilir ve panoda toplanır. Rozetler Sonuç ekranındaki kutlama olarak kalır. Yalnızca tamamlanmış denemeler hesaba katılır.

6. **Çevrimdışı politikası.** Ders listesi önbelleğe alınır. Önbellek varsa çevrimdışı durumda ders listesi ve bir çevrimdışı bandı gösterilir. Önbellek yoksa tekrar dene seçeneği bulunan bir hata durumu gösterilir. Quiz tamamen çevrimdışı çalışabilir çünkü yerel veri kullanır. Fotoğraflı tek soru, çevrimdışı durumda emojiye düşer.

7. **Cevaplar görsel-öncelikli kartlardır.** Cevaplar çizili şekiller, emoji, rakamlar ve bir fotoğraftan oluşan 2×2 ızgara şeklindedir. Bunun nedeni hedef yaş aralığının okuma öncesi çocukları da kapsamasıdır. Buna rağmen her kart açıklayıcı bir erişilebilirlik etiketi taşır. Kartlar küçük bir **360×640** ekrana kaydırma gerektirmeden sığacak şekilde boyutlandırılır.

8. **Tasarım dili sıcak ve sakindir.** Krem arka plan, tombul 3B kenarlı butonlar ve konuşma balonlu özgün bir tilki-emoji maskot kullanılır. Başarıda kutlama, başarısızlıkta nazik cesaretlendirme vardır. Sert kırmızı veya cezalandırıcı ses kullanılmaz. Tasarım dili popüler çocuk uygulamalarından ruhen ilham alır ancak üçüncü taraf görsel, isim veya marka rengi kullanılmaz.

9. **Dil düğmesi görsel ve bilinçli olarak törenseldir.** Tek düğmede sabit TR/EN etiketleri bulunur. Aktif dil, okuma öncesi bir çocuğun tanıyabileceği şekilde bayrakla gösterilir. Dil değişimi anlık bir yeniden boyama yerine kısa bir maskot geçişi oynatır. Böylece çocuk bir "an" yaşandığını görür ve değişim ekran kapalıyken gerçekleşir; yarı çevrilmiş bir ekran karesi görünmez. Hareket azaltma açıksa bu geçiş tamamen atlanır.

10. **Ödevden bilinçli sapma: dersler sırayla açılır ve bir derse dokunmak doğrudan Alıştırma'yı değil bir balonu açar.** Şartname, listedeki öğeye dokunulduğunda Alıştırma ekranının açılmasını söylüyor. Uygulamadaki Alıştırmalar sekmesi ise N. ders en az 2⭐ olduğunda N+1 dersin açıldığı bir ilerleme patikasıdır.

    Açık bir düğmeye dokunulduğunda küçük bir balon açılır. Bu balonda ders görseli, başlığı, yıldızları ve **"Başla"** butonu bulunur.

    Bu nedenle küçük görsel ve başlık düğümün üzerinde değil, balonda gösterilir. Düğümün kendisi okunaklı kalması için ders numarası/kilit ve yıldızları taşır. Şartnamenin öğe başına istediği üçlü, bilinçli olarak tek dokunuş derinliğinde tutulur.

    Gerekçe:
    - Oyunlaştırılmış patika görünür bir ilerleme sağlar.
    - Çocuğa dersi tamamlamak için bir neden verir.
    - Kilitli bir haritanın "bu neden açılmıyor?" sorusunu açıklayacak bir yere ihtiyacı vardır.
    - Onay adımı bu yaş grubunda kazara dokunuşlara karşı koruma sağlar.

    Açık yol iki dokunuş olarak kalır: **düğüm → Başla**.

11. **Karşılama ekranı her açılışta görünür.** Bu ekran ilk kurulum tanıtımı değil, bilinçli bir ritüeldir: maskot, uygulama adı, tek satır ve **Başla** butonu gösterilir.

    Ekranın her açılışta gösterilmesi dönen kullanıcıyı hafifçe yorabilir. Bu nedenle ekran tek ve anında bir dokunuşla kapanır. Süresi **2 saniyeden kısa** tutulur ve buton ilk kareden itibaren aktiftir.

12. **Sesli okuma önce bir "yer" olarak uygulamada bulunur.** Çocuğun tek başına anlaması gereken her cümlenin yanında 🔊 butonu vardır. Butonlar dürüst bir basma geri bildirimi verir. Sesin kendisi henüz uygulanmamıştır. Mevcut `speak(text, language)` arayüzünün arkasına bir TTS motoru eklenmesi planlanmaktadır.

## Daha fazla zamanım olsaydı

Öncelikler sırasıyla:

1. **Gerçek içerik modeli + backend:** Picsum ve ortak mock setler yerine ders başına video ve yazılmış soru bankaları.

2. **E2E testleri:** Uygulama içerisindeki kritik akışların güvenilirliğini sağlamak için akışlara yönelik testlerin oluşturulması faydalı olacaktır.

3. **Gerçek Ses Destegi:** Şu anki ses desteği yalnızca görsel olarak bulunmaktadır. Ses dosyalarının eklenmesi, okuma öncesi çocuklar için daha doğru bir çözüm olacaktır. Yalnızca metin kullanılması, hedef yaş grubunun bir kısmını dışarıda bırakabilir.

4. **Gerçek çizimler/maskot ve animasyonlar:** Uygulamaya özgü çizim, görsel ve animasyonların kullanılması, uygulamanın daha sıcak ve ilgi çekici bir deneyim sunmasını sağlayabilir.

5. **Analitik + çökme raporlama:** Tam-bir-kez deneme kimlikleriyle analitik ve crash reporting eklenmesi. Merkezî hata hunisi, production raporlayıcısının bağlanacağı noktadır.

6. **Performans iyileştirmesi:** Uzun listeler ve görseller söz konusu olduğunda, uygulamanın profesyonel bir ortamda daha fazla içerik barındırabileceği göz önünde bulundurulmalıdır. Bu nedenle, içerik miktarı arttıkça performans sorunlarının önüne geçmek için gerekli optimizasyonların yapılması gerekecektir.

7. **iOS cihaz doğrulaması ve ebeveyn kapısının eklenmesi:** Paket zaten her kalite kapısında derleniyor; ayrıca gerçek iOS cihazında doğrulama yapılması ve ebeveyn kapısının eklenmesi.

8. **Oyunların geliştirilmesi ve farklı modüllerin oluşturulması:** Şu anda uygulamada tek tip bir alıştırma modülü bulunmaktadır. Uygulama içerisindeki modül çeşitliliğinin artırılması, kullanıcıların uygulamayla daha fazla etkileşim kurmasını ve uygulamayı daha uzun süre kullanmasını sağlayabilir.
