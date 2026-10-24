# Couple's Burger Life · Mağazaya yükleme rehberi

Bu klasör, oyununun Google Play (telefon + Android TV) ve App Store (iPhone + iPad) uygulamasıdır.
Derleme bilgisayarında değil, **GitHub'da otomatik** yapılır. Hiçbir program kurman gerekmez.

```
docs/                 ← oyunun kendisi (GitHub Pages da buradan yayınlanır)
  index.html            oyun
  gizlilik.html         gizlilik politikası (mağazalar ister)
  hesap-silme.html      hesap silme sayfası (mağazalar ister)
  native.js             reklam, satın alma ve giriş köprüsü (sadece uygulamada çalışır)
index.html            ← eski adresi docs/'a yönlendirir (link değişmez)
uygulama-ayarlari.json← TEK ayar dosyası (sürüm, AdMob kimlikleri)
firebase/             ← Google/Apple girişi için Firebase dosyaları buraya
assets/               ← uygulama simgesi, açılış ekranı, TV afişi
magaza/               ← mağaza metinleri, form cevapları, ekran görüntüleri
.github/workflows/    ← otomatik derleme (Android ve iOS)
scripts/              ← derleme sırasında çalışan ayar betikleri
```

---

## 1. GitHub (hazır)

Her şey `Hamburger-1998-17` reposuna yüklendi. Tarayıcı sürümü aynı adreste çalışmaya devam eder
(`https://esaterenutas11-cmyk.github.io/Hamburger-1998-17/` → otomatik `docs/`'a geçer, kayıtlar silinmez).
`imza/` klasörü repoya **yüklenmedi** (gizli anahtarın): onu sadece sen saklıyorsun.

## 2. Android imza anahtarını GitHub'a tanıt (3 dk)

`imza/IMZA-BILGILERI.txt` dosyasını aç. Repo › **Settings › Secrets and variables › Actions › New repository secret** ile 4 gizli değişken ekle:

| Ad | Değer |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `imza/upload-keystore.base64.txt` dosyasının tüm içeriği |
| `ANDROID_KEYSTORE_PASSWORD` | dosyadaki şifre |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | dosyadaki şifre |

`imza/` klasörünün yedeğini al (Drive + USB). Kaybedersen Play Console'dan sıfırlatman gerekir.

## 3. Android'i derle (otomatik, ~10 dk)

Repo › **Actions › Android derleme › Run workflow**. Bitince işe tıkla, en alttaki **Artifacts › android-N** dosyasını indir:

- `…-GooglePlay.aab` → Play Console'a yüklenecek dosya
- `…-telefona-kur.apk` → kendi telefonunda denemek için (dosyayı telefona at, aç, kur)

Bundan sonra `main`'e her yüklemede otomatik derlenir; sürüm kodu kendiliğinden artar.

## 4. Google Play'e yükle

1. https://play.google.com/console › Geliştirici hesabı (bir kerelik 25 $). Kişisel hesaplarda ilk yayından önce 12 kişiyle 14 gün **kapalı test** şartı var: önce **Test › Kapalı test**'e yükle, arkadaşlarını (Anıl, Uğurcan…) e-postayla ekle.
2. **Uygulama oluştur**: ad `Couple's Burger Life: Cooking`, dil Türkçe, Oyun, Ücretsiz.
3. **Uygulama içeriği** bölümünü `magaza/FORM-CEVAPLARI.md` ile doldur.
4. **Mağaza girişi**: metinler `magaza/MAGAZA-METINLERI.md`; görseller `magaza/gorseller/`:
   - Uygulama simgesi: `play-ikon-512.png`
   - Öne çıkan grafik: `play-one-cikan-1024x500.png`
   - Telefon: `play-telefon-*.png` · Tablet: `play-tablet-*.png` · TV: `play-tv-*.png` + `play-tv-afis-1280x720.png`
5. **Test › Kapalı test › Yeni sürüm** › AAB'yi yükle › kaydet › incelemeye gönder.
6. Satın alma ürünleri (AAB bir kez yüklendikten sonra açılır): **Para kazanma › Ürünler › Uygulama içi ürünler** › tablodaki 5 ürünü `MAGAZA-METINLERI.md`'deki kimliklerle oluştur ve **etkinleştir**.

## 5. (İsteğe bağlı) Reklam geliri: AdMob

1. https://admob.google.com › Uygulamalar › Uygulama ekle (Android ve iOS ayrı ayrı) › her biri için bir **Ödüllü** reklam birimi oluştur.
2. `uygulama-ayarlari.json` › `admob` içine 4 kimliği yapıştır › GitHub'a yükle. Bitti.
   Boş bıraktığın sürece uygulamaya reklam SDK'sı eklenmez; reklam butonları oyunun kendi sponsor ekranıyla ödül verir.
3. Play Console › Uygulama içeriği › Reklamlar = Evet, Reklam kimliği = Evet.

## 6. (İsteğe bağlı) Uygulamada Google / Apple ile giriş + bulut kaydı

Uygulamanın içinde Google penceresi web'deki gibi açılamaz; yerel giriş için Firebase dosyaları gerekir:

1. Firebase konsolu › `couple-s-burger-life` projesi › **Proje ayarları › Uygulama ekle › Android**: paket adı `com.esat.burgerbiz`. SHA-1 olarak `imza/IMZA-BILGILERI.txt`'deki SHA-1'i ve Play Console › Uygulama bütünlüğü'ndeki **uygulama imzalama anahtarı SHA-1**'ini ekle. `google-services.json`'u indir → `firebase/` klasörüne koy.
2. Aynı yerde **iOS uygulaması ekle**: paket kimliği `com.esat.burgerbiz`. `GoogleService-Info.plist`'i indir → `firebase/` klasörüne koy.
3. Firebase › Authentication › Oturum açma yöntemi › **Google** ve **Apple**'ı etkinleştir.
4. Firestore › Kurallar'da kullanıcının kendi belgesini okuyup yazıp **silebildiğinden** emin ol:
   ```
   match /users/{uid} { allow read, write, delete: if request.auth != null && request.auth.uid == uid; }
   ```
5. GitHub'a yükle. Dosya yoksa uygulamada sadece misafir girişi görünür (uygulama yine çalışır).

## 7. iOS: App Store (Apple Geliştirici hesabı gerekir: yıllık 99 $)

Mac gerekmez; derleme GitHub'ın Mac sunucusunda yapılır.

1. https://developer.apple.com › hesap aç. **Membership** sayfasındaki **Team ID**'yi not al.
2. https://appstoreconnect.apple.com › **Uygulamalar › + Yeni uygulama**: iOS, ad `Couple's Burger Life: Cooking`, dil Türkçe, paket kimliği `com.esat.burgerbiz` (listede yoksa developer.apple.com › Identifiers'tan "Sign In with Apple" işaretli oluştur), SKU `cbl001`.
3. App Store Connect › **Kullanıcılar ve Erişim › Entegrasyonlar › App Store Connect API › Anahtar oluştur** (erişim: **Admin**). `.p8` dosyasını indir (bir kez inebilir), **Key ID** ve **Issuer ID**'yi not al.
4. `.p8` dosyasını base64'e çevir: https://base64.guru/converter/encode/file (ya da PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXX.p8"))`).
5. GitHub gizli değişkenleri: `APPLE_TEAM_ID`, `APPSTORE_API_KEY_ID`, `APPSTORE_API_ISSUER_ID`, `APPSTORE_API_KEY_P8_BASE64`.
6. Actions › **iOS derleme › Run workflow**. Derleme imzalanıp **doğrudan App Store Connect'e yüklenir** (TestFlight'ta 10-30 dk sonra görünür).
7. App Store Connect'te: metinler `magaza/MAGAZA-METINLERI.md`, gizlilik `magaza/FORM-CEVAPLARI.md`, ekran görüntüleri `appstore-iphone-*.png` ve `appstore-ipad-*.png`. Satın alma ürünlerini aynı kimliklerle oluştur, sürüme ekle › **İncelemeye gönder**.

Gizli değişkenler girilmeden iOS işi sadece "hatasız derleniyor mu" kontrolü yapar.

---

## Sorun çıkarsa

Actions'taki kırmızı işin sayfasındaki hata satırlarını kopyalayıp Claude'a yapıştır.
Sürüm yükseltmek için sadece `uygulama-ayarlari.json` › `surum`'u değiştir (ör. `1.0.1`).
