# Çocuklar İçin Eğitim Uygulaması — Mini Akış

## Bağlam

Bu ödev, çocuklara yönelik oyunlaştırılmış bir eğitim uygulaması senaryosuna dayanmaktadır (React Native). Hedef kitle küçük yaşta çocuklardır; bu nedenle akışta canlı, oyunlaştırılmış bir his ve animasyonlar/hareketler bekliyoruz. Senaryoya göre uygulama, video/ses içerikli dersler, alıştırmalar ve rozet ödülleri gibi öğeler içeren bir yapıya sahiptir. Buna dayanarak, aşağıda tarif edilen akışı kapsayan küçük ve kendi içinde bütünlüklü bir bölüm geliştirmenizi rica ediyoruz.

Bu çalışmanın odaklanılmış olarak yaklaşık **1–2 gün** sürmesi bekleniyor. Cilalanmış, production-ready bir uygulama beklemiyoruz — görsel tasarım bizim için öncelik değil; nasıl düşündüğünüzü, işlevselliğe nasıl yaklaştığınızı ve süreç boyunca aldığınız kararları görmek istiyoruz. Ekranların görünümünü, bileşen seçimlerini ve stilini kendi zevkinize ve pratik kararlarınıza göre şekillendirebilirsiniz — hazır bir tasarım dosyası paylaşmıyoruz.

## Ne geliştirilecek

Aşağıdaki akışı karşılayan, birbirine bağlı üç ekran:

### 1. Ana Ekran (Home)

- Kaydırılabilir bir ders/alıştırma listesi (lütfen **15–20 öğe** ekleyin). Veriler herhangi bir açık/ücretsiz API'den (örn. görseller için picsum.photos, ya da herhangi bir mock/placeholder data API'si) **internet üzerinden çekilmeli** — yerel/statik veri kullanılmamalı. İçeriklerin konumuzla alakalı olmasına gerek yok, olursa iyi olur ama şart değil.
- Her öğede bir küçük görsel (thumbnail), başlık ve bir ilerleme/rozet göstergesi bulunmalı.
- Bir öğeye dokunulduğunda Alıştırma ekranı açılmalı.

### 2. Alıştırma Ekranı (Exercise)

- Kısa bir video veya ses klibi oynatılmalı (herhangi bir örnek URL kullanılabilir — gerçek ders içeriği olması gerekmiyor).
- Medyanın ardından basit bir alıştırma (çoktan seçmeli yeterli) sunulmalı.
- Alıştırma için görünür bir zamanlayıcı veya ilerleme göstergesi bulunmalı.

### 3. Sonuç Ekranı (Result)

- Alıştırma sonucuna göre başarılı/başarısız durumu gösterilmeli.
- Kazanılan rozet, bir tür animasyon/hareket ile gösterilmeli (kütüphane/yaklaşım seçimi size ait).

## Teknik beklentiler

- React Native ile geliştirilmeli.
- Ana ekran verileri için herhangi bir açık/ücretsiz API kullanılabilir (kendi backend'inizi kurmanıza gerek yok); alıştırma ve sonuç ekranları için yerel/mock veri yeterli.
- Çalışmanızı bir **Git sistemi** üzerinde paylaşın ve repo linkini iletin.
- Kısa bir README ekleyin: uygulamanın nasıl çalıştırılacağı, daha fazla zamanınız olsaydı neyi farklı yapardınız, ve spesifikasyonun belirsiz olduğu noktalarda hangi varsayımları yaptığınız.

## Araçlar

Yapay zeka destekli kod asistanları dahil, istediğiniz aracı kullanabilirsiniz. Ancak kodun sahibi sizsiniz — kodda yer alan tüm kararlardan ve olası hatalardan siz sorumlusunuz, ve bu değerlendirmede kullanılabilir. Bizim için önemli olan, uygulamadaki nihai kararlar ve bu kararları açıklayıp savunabilmeniz — kodun nasıl yazıldığı değil.

## Neyi değerlendiriyoruz

Sadece "çalışıyor mu" değil, brief'te bilinçli olarak açık bırakılan noktaları kendi değerlendirmenizle nasıl ele aldığınızı da değerlendiriyoruz. Takip görüşmesinde kararlarınızı anlatmaya hazır gelin.

## Teslim edilecekler

- Git repo linki
- Yukarıda tarif edilen README
- Production-ready olmadığını düşündüğünüz noktalar veya trade-off notları

Not: Görsel tasarım konusunda serbestsiniz — burada bizim için önemli olan akışın doğru çalışması, kenar durumlarını (edge case) nasıl ele aldığınız ve genel yaklaşımınız.

Ne geliştirdiğinizi görmek için sabırsızlanıyoruz. Brief'te anlaşılmayan bir nokta olursa bize ulaşmaktan çekinmeyin.
