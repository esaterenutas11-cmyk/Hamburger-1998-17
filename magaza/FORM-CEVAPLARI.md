# Mağaza formları için hazır cevaplar

## Google Play › Uygulama içeriği

**Gizlilik politikası:** https://esaterenutas11-cmyk.github.io/Hamburger-1998-17/docs/gizlilik.html

**Reklamlar:** Evet, uygulamada reklam var (AdMob ödüllü reklam). AdMob kimliklerini girmediysen: Hayır.

**Uygulama erişimi:** Tüm işlevler kısıtlama olmadan kullanılabilir (misafir girişi var).

**Hedef kitle ve içerik:** Hedef yaş grubu **13-15, 16-17 ve 18+**. "Çocuklara hitap ediyor mu?" → Hayır. (13 yaş altını seçme: oyunda sanal kumarhane ve bar var, ayrıca Aileler politikası çok katıdır.)

**Reklam kimliği (Advertising ID):** Evet, kullanıyor → amaç: Reklam veya pazarlama. (AdMob yoksa: Hayır.)

**Hükümet uygulaması / Finansal özellikler / Sağlık:** Hayır.

**İçerik derecelendirmesi (IARC anketi), dürüst cevaplar:**
- Kategori: Oyun
- Şiddet: Hayır · Korku: Hayır · Cinsellik: Hayır (sadece romantik jest, sarılma) · Küfür: Hayır
- Uyuşturucu: Hayır · **Alkol: Evet, referans** (bar/kulüp, bira; karakter içtiği gösterilmez)
- **Sanal kumar: Evet** (oyun içi kumarhanede gerçek para olmayan blackjack / rulet; ödül sadece oyun parası)
- Gerçek parayla kumar: Hayır
- Kullanıcılar etkileşim kurabiliyor mu: Evet (online modda arkadaşınla oynama; sohbet yok)
- Konum paylaşımı: Hayır · Dijital satın alma: Evet
Beklenen sonuç: PEGI 12 / ESRB Teen civarı.

**Veri güvenliği (Data safety):**
- Veri topluyor veya paylaşıyor mu: **Evet**
- Aktarımda şifreleniyor mu: **Evet** · Kullanıcı silme isteyebiliyor mu: **Evet** (bağlantı: hesap-silme.html)
- Toplanan veriler:
  - Kişisel bilgiler › **Ad** ve **E-posta adresi**: Toplanıyor, paylaşılmıyor, isteğe bağlı (sadece Google ile giriş yaparsa) · Amaç: Hesap yönetimi, Uygulama işlevi
  - Kişisel bilgiler › **Kullanıcı kimlikleri**: Toplanıyor, isteğe bağlı · Amaç: Hesap yönetimi, Uygulama işlevi
  - Uygulama etkinliği › **Diğer kullanıcı tarafından oluşturulan içerik (oyun kaydı)**: Toplanıyor, isteğe bağlı · Amaç: Uygulama işlevi
  - Cihaz veya diğer kimlikler › **Cihaz veya diğer kimlikler** (reklam kimliği): Toplanıyor ve **paylaşılıyor** (AdMob) · Amaç: Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme · Zorunlu
  - Uygulama bilgileri ve performans › **Kilitlenme günlükleri / Tanılama**: AdMob SDK'sı topluyor → paylaşılıyor · Amaç: Analiz
  - Konum › **Yaklaşık konum**: AdMob IP'den çıkarır → paylaşılıyor · Amaç: Reklam
  (AdMob yoksa: sadece ilk üç madde kalır ve hiçbir şey paylaşılmaz.)

**Android TV:** Play Console › Gelişmiş ayarlar › Form faktörleri › Android TV'yi ekle. TV ekran görüntüleri ve afiş (`gorseller/tv-*.png`, `play-tv-afis-1280x720.png`) hazır. TV incelemesi ayrıca yapılır; reddedilirse telefon sürümü etkilenmez.

## App Store Connect › Uygulama Gizliliği

- Veri topluyor musunuz: **Evet**
- **İletişim Bilgileri › Ad, E-posta Adresi:** Uygulama İşlevselliği · Kimliğe bağlı: Evet · İzleme: Hayır
- **Tanımlayıcılar › Kullanıcı Kimliği:** Uygulama İşlevselliği · Kimliğe bağlı: Evet · İzleme: Hayır
- **Kullanıcı İçeriği › Diğer Kullanıcı İçeriği (oyun kaydı):** Uygulama İşlevselliği · Kimliğe bağlı: Evet · İzleme: Hayır
- **Tanımlayıcılar › Cihaz Kimliği:** Üçüncü Taraf Reklamcılığı · Kimliğe bağlı: Hayır · **İzleme: Evet** (AdMob; izin isteniyor)
- **Kullanım Verileri › Reklam Verileri:** Üçüncü Taraf Reklamcılığı · İzleme: Evet
- **Konum › Yaklaşık Konum:** Üçüncü Taraf Reklamcılığı · Kimliğe bağlı: Hayır
- **Tanılama › Kilitlenme Verileri, Performans Verileri:** Analiz (AdMob)

**Yaş derecelendirmesi:** Sanal Kumar: **Seyrek/Hafif** · Alkol, Tütün veya Uyuşturucu Kullanımına Atıflar: **Seyrek/Hafif** · Diğer her şey: Yok. Beklenen: 13+.
**Şifreleme (Export Compliance):** Sadece standart HTTPS → Info.plist'e zaten "şifreleme yok" yazıldı; soru sorulmaz.
**Oyun Merkezi / Kids kategorisi:** Hayır.
