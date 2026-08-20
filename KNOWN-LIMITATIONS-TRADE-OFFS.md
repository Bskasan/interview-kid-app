# Production-ready olmadığını düşündüğüm noktalar veya trade-off notları

Bu bir take-home projesi. Aşağıdaki maddelerin tamamı bilinçli olarak kabul edilmiş eksikler veya takaslardır. Her maddede iki konu açıklanır: mevcut durum ve bunun neden böyle bırakıldığı / üretimde neye ihtiyaç duyulacağı.

- **Ders verisi için `picsum.photos` kullanılıyor. Tüm dersler aynı örnek videoyu kullanıyor ve quiz içeriği yerel bir mock bankasından geliyor** (20 ders, 5 soru setini paylaşıyor).
  Proje tanımı açık API kullanımına ve yerel mock verilere izin veriyor. Ancak üretim ortamında, her ders için video içeriklerini ve yazılı soru bankalarını yönetecek gerçek bir içerik modeline ihtiyaç duyulacaktır.

- **Backend, kimlik doğrulama ve analitik bulunmuyor.** İlerleme yalnızca cihazda, AsyncStorage kullanılarak tutuluyor.
  Profesyonel Üretim ortamında hesap yönetimi, cihazlar arası senkronizasyon ve ürün metrikleri için bir servis katmanı gerekir.

- **Çökme raporlayıcısı bağlı değil.** Tüm hatalar tek bir logger üzerinden işleniyor ve production için açık bir bağlantı noktası bulunuyor. Merkezi bir raporlama ve loglama sisteminin kurulması, uygulamanın izlenebilirliği ve hata takibi açısından daha iyi bir çözüm olacaktır.

- **Sesli okuma henüz yalnızca arayüz olarak mevcut.** 🔊 Butonlar görsel olarak yeterli bir basma geri bildirimi sağlıyor, ancak herhangi bir sesli geri bildirim bulunmuyor. Profesyonel bir geliştirme ortamında ses efektlerinin aktif olarak kullanılması, özellikle henüz okuma bilmeyen çocukların da uygulamayı etkin bir şekilde kullanabilmesi açısından önemli olacaktır.

- **iOS gerçek cihazda test edilmedi.** Her kalite kapısı iOS paketini derliyor; bu nedenle iOS paketinin derlenebildiği doğrulanmış durumda. Kod yalnızca platformlar arası Expo SDK modüllerini kullanıyor.
  Ancak geliştirme Windows üzerinde yapıldığı ve Apple donanımı bulunmadığı için gerçek iOS cihazında görüntü, haptics, video ve VoiceOver davranışları doğrulanmadı.

- **Dil düğmesinde bayraklar dili temsil ediyor.** Bu kullanım anlamsal olarak kusurlu; çünkü bayraklar ülkeyi temsil eder. İngilizce için 🇬🇧 kullanılması da keyfî bir seçimdir.
  Buna rağmen okuma öncesi bir çocuk bayrağı yazıdan daha hızlı tanıyabileceği için bu yaklaşım iki dilli bir çocuk uygulaması için kabul edildi. Sabit TR/EN etiketleri ve sesli açıklama, daha ayrıntılı durumu okuyabilen kullanıcılara sağlar.

- **İlerleme haritası, şartnamenin gerektirdiğinden daha fazla mekanizma içeriyor.** Düz ve dokunulabilir bir liste, aynı gereksinimi çok daha az kodla karşılayabilirdi. Mevcut çözüm geometri, kilit kuralları, balon ve store migration'ı gibi ek parçalar içeriyor.
  Bu yapı, oyunlaştırılmış bir his vermek için bilinçli olarak seçildi. Bunun karşılığında, eklenen karmaşıklığın satır satır savunulması gerekiyor.

- **Seri (streak) yalnızca yerel ve değiştirilebilir.** Sistem cihaz saatini kullanıyor. Tarihi ileri almak seriyi artırabilir; tarihi geri almak ise bilinçli olarak seriyi sıfırlamaz.
  Backend olmadan cihaz üzerinde çalışan bir ödül sistemi için bu kabul edilebilir. Gerçek bir üründe aktivitenin sunucu tarafında doğrulanması gerekir.

- **Dil değişimi tasarım gereği yaklaşık 0,85 saniye sürüyor.** Bu geçiş bilinçli olarak bir tören şeklinde tasarlandı; amaç gecikme oluşturmak değil. Hareket azaltma kullanan kullanıcılar için geçiş anında tamamlanır.
  Süre `LANGUAGE_TRANSITION` sabitlerinde merkezi olarak tutuluyor. Yavaş cihazlarda geçişin süresi sorun yaratırsa tek bir yerden değiştirilebilir.

- **Branch koruması ertelendi.** Geliştirme sürecinde kalite kapısı olarak `pre-push` hook'u kullanılmaktadır. İçe aktarmaya hazır GitHub ruleset repoda bulunmakta olup, gerektiğinde repository ayarlarından aktif hale getirilebilir.

- **Dil düğmesi ebeveyn kapısının arkasında değil.** Çocuk dili değiştirebilir. Bu işlem zararsızdır ve tek dokunuşla geri alınabilir.
  Gerçek bir üründe dil değiştirme özelliği ebeveyn kapısının arkasına alınabilir.

- **JavaScript zamanlayıcıları kullanılıyor.** Geri sayım zaman damgası temelli çalışıyor ve bu sayede kaymaya karşı dayanıklı. Gösterge çözünürlüğü yaklaşık 100 ms.
  Bu hassasiyet bir çocuk quiz'i için yeterli. Hassasiyetin kritik olduğu işler için uygun değildir.

- **E2E testi ve görsel/layout kapsaması yok.** 175 birim/bileşen testi temel mantığı ve önemli ekran karar noktalarını kapsıyor. Ancak mevcut test ortamı gerçek iOS/Android runtime'ı üzerinde çalışmadığından responsive davranış, görsel taşmalar ve platforma özgü layout problemleri doğrulanamıyor. Üretim ortamında kritik kullanıcı akışları için örneğin Detox tabanlı E2E testleri ve farklı cihaz/viewport konfigürasyonlarında screenshot tabanlı visual regression testleri eklenmelidir.

- **Büyük yazı tipleri yaklaşık 1,4× büyüklüğe kadar destekleniyor, ancak tamamen değil.** Bir kontrolle aynı satırı paylaşan metin sınırlandırılıyor ve gerektiğinde doğru şekilde daralıyor.
  Ancak ekranların sabit yükseklikleri ve kaydırmanın olmaması nedeniyle sistem yazı boyutu en yüksek seviyelere çıktığında içerik yeniden akmak yerine sıkışabilir.

- **Ebeveyn kapısı yok.** Gerçek bir çocuk ürünü, mağazaların aile politikaları nedeniyle böyle bir özellik gerektirir.
  Bu proje kapsamında ebeveyn kapısı bilinçli olarak kapsam dışında bırakıldı.

- **Halka açık bir örnek video kullanılıyor.** Google'ın klasik örnek bucket'ı projenin ortasında 403 döndürmeye başlayınca video kaynağı `test-videos.co.uk` ile değiştirildi.
  Bu kaynak da çalışmazsa çocuk bozuk bir ekran yerine seçim kartını görür: **tekrar dene** veya **videosuz devam et**.

- **Web desteği tesadüfi.** Uygulama yalnızca istemci tarafında çalışıyor. Tarayıcılar sesli otomatik oynatmayı engelliyor ve web bu proje için desteklenen bir hedef değil.
