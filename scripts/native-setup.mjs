#!/usr/bin/env node
/* =====================================================================
   Mağaza derlemesi hazırlığı (GitHub Actions'ta otomatik çalışır)
     node scripts/native-setup.mjs deps     → ayarlara göre ek eklentileri kurar (AdMob, Firebase girişi)
     node scripts/native-setup.mjs android  → "npx cap add android" SONRASI Android projesini ayarlar
     node scripts/native-setup.mjs ios      → "npx cap add ios" SONRASI iOS projesini ayarlar
   Tek ayar dosyası: uygulama-ayarlari.json
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, t) => { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), t); };
const ex = p => fs.existsSync(path.join(ROOT, p));
const say = (...a) => console.log("•", ...a);
const fail = m => { console.error("✖ " + m); process.exit(1); };

const S = JSON.parse(rd("uygulama-ayarlari.json"));
const A = S.admob || {};
const TEST = {
  androidAppId: "ca-app-pub-3940256099942544~3347511713", androidOdulluReklam: "ca-app-pub-3940256099942544/5224354917",
  iosAppId: "ca-app-pub-3940256099942544~1458002511", iosOdulluReklam: "ca-app-pub-3940256099942544/1712485313"
};
const ad = k => (A[k] || (A.testModu ? TEST[k] : "")).trim();
const adAndroid = !!(ad("androidAppId") && ad("androidOdulluReklam"));
const adIos = !!(ad("iosAppId") && ad("iosOdulluReklam"));
const fbAndroid = ex("firebase/google-services.json");
const fbIos = ex("firebase/GoogleService-Info.plist");
const G = S.giris || {};
const buildNo = (parseInt(S.surumKoduBaslangic, 10) || 1) + (parseInt(process.env.BUILD_NUMBER || "0", 10) || 0);
const version = String(S.surum || "1.0.0");
const appId = S.paketAdi || "com.esat.burgerbiz";

/* kimlik / sürüm kontrolleri: hatalı değer mağazada reddedilmeden burada yakalansın */
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(appId)) fail("paketAdi geçersiz: " + appId);
if (!/^\d+\.\d+\.\d+$/.test(version)) fail("surum 1.0.0 biçiminde olmalı: " + version);
for (const k of ["androidAppId", "iosAppId"]) if (A[k] && !/^ca-app-pub-\d{16}~\d{10}$/.test(A[k])) fail(`admob.${k} biçimi hatalı (ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY): ${A[k]}`);
for (const k of ["androidOdulluReklam", "iosOdulluReklam"]) if (A[k] && !/^ca-app-pub-\d{16}\/\d{10}$/.test(A[k])) fail(`admob.${k} biçimi hatalı (ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY): ${A[k]}`);

/* web tarafı ayarı: native.js bunu okur */
function writeNativeConfig(platform){
  const cfg = {
    admob: { testing: !!A.testModu, android: { rewarded: adAndroid ? ad("androidOdulluReklam") : "" }, ios: { rewarded: adIos ? ad("iosOdulluReklam") : "" } },
    auth: { google: G.google !== false && (platform === "ios" ? fbIos : fbAndroid), apple: G.apple !== false && platform === "ios" && fbIos }
  };
  // Firebase web anahtarı koda yazılmaz: GitHub gizli değişkeninden (FIREBASE_API_KEY) derleme anında eklenir
  const fk = (process.env.FIREBASE_API_KEY || "").trim();
  if (fk){ if (!/^AIza[0-9A-Za-z_-]{35}$/.test(fk)) fail("FIREBASE_API_KEY biçimi hatalı (AIza… ile başlayan 39 karakter olmalı)"); cfg.firebaseApiKey = fk; }
  wr("docs/native-config.js", `/* otomatik üretildi: scripts/native-setup.mjs (${platform}) */\nwindow.CBL_NATIVE_CFG = ${JSON.stringify(cfg, null, 2)};\n`);
  say("native-config.js yazıldı:", JSON.stringify(Object.assign({}, cfg, { firebaseApiKey: fk ? "*** (gizli değişkenden)" : "yok: bulut/online kapalı" })));
  const html = rd("docs/index.html");
  if (!fk && /__FIREBASE_API_KEY__/.test(html)) say("⚠️ FIREBASE_API_KEY gizli değişkeni yok: uygulamada Google girişi ve online oyun kapalı olacak (oyun misafir modda çalışır)");
}

function deps(){
  const want = [];
  if (adAndroid || adIos) want.push("@capacitor-community/admob@^8.0.0");
  if (fbAndroid || fbIos) want.push("@capacitor-firebase/authentication@^8.0.0", "firebase@^12.0.0");
  if (!want.length){ say("Ek eklenti yok (AdMob ve Firebase ayarları boş)."); return; }
  say("Ek eklentiler kuruluyor:", want.join(" "));
  execSync(`npm install --no-audit --no-fund --save ${want.join(" ")}`, { cwd: ROOT, stdio: "inherit" });
}

/* ---------------------------- ANDROID ---------------------------- */
function android(){
  if (!ex("android/app/build.gradle")) fail("Önce: npx cap add android");
  writeNativeConfig("android");
  // 1) sürüm ve imza
  let g = rd("android/app/build.gradle");
  g = g.replace(/versionCode\s+\d+/, `versionCode ${buildNo}`).replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
  if (!g.includes("signingConfigs {")){
    g = g.replace(/(\n\s*)buildTypes\s*\{/, `$1signingConfigs {
        release {
            if (System.getenv("CBL_KEYSTORE")) {
                storeFile file(System.getenv("CBL_KEYSTORE"))
                storePassword System.getenv("CBL_KEYSTORE_PASSWORD")
                keyAlias System.getenv("CBL_KEY_ALIAS")
                keyPassword System.getenv("CBL_KEY_PASSWORD")
            }
        }
    }$1buildTypes {`);
    g = g.replace(/buildTypes\s*\{\s*release\s*\{/, m => m + `\n            if (System.getenv("CBL_KEYSTORE")) signingConfig signingConfigs.release`);
  }
  if (!/versionCode\s+\d+/.test(g) || !g.includes("signingConfig signingConfigs.release")) fail("app/build.gradle beklenen biçimde değil");
  wr("android/app/build.gradle", g);
  say(`Android sürüm ${version} (kod ${buildNo}), imza ayarı eklendi`);

  // 2) değişkenler: hedef API 36 (Google Play 2026 şartı), Firebase Google girişi
  let v = rd("android/variables.gradle");
  v = v.replace(/compileSdkVersion\s*=\s*\d+/, "compileSdkVersion = 36").replace(/targetSdkVersion\s*=\s*\d+/, "targetSdkVersion = 36");
  if (fbAndroid && !v.includes("rgcfaIncludeGoogle")) v = v.replace(/ext\s*\{/, "ext {\n    rgcfaIncludeGoogle = true");
  wr("android/variables.gradle", v);

  // 3) manifest: TV, oyun kolu, oyun kategorisi, AdMob
  const MP = "android/app/src/main/AndroidManifest.xml";
  let m = rd(MP);
  if (!m.includes("android:banner")) m = m.replace("<application", '<application\n        android:banner="@drawable/tv_banner"\n        android:isGame="true"\n        android:appCategory="game"');
  if (!m.includes("LEANBACK_LAUNCHER")) m = m.replace(/(<category android:name="android\.intent\.category\.LAUNCHER"\s*\/>)/, '$1\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />');
  if (adAndroid && !m.includes("com.google.android.gms.ads.APPLICATION_ID")) m = m.replace("</application>", `    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${ad("androidAppId")}" />\n    </application>`);
  if (!m.includes("android.software.leanback")) m = m.replace("</manifest>", `    <uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.hardware.gamepad" android:required="false" />
</manifest>`);
  if (!m.includes("LEANBACK_LAUNCHER") || !m.includes("android.software.leanback")) fail("AndroidManifest.xml beklenen biçimde değil");
  wr(MP, m);

  // 4) uygulama adı: kesme işareti (Couple's) Android kaynaklarında kaçışlı olmalı
  const SP = "android/app/src/main/res/values/strings.xml";
  if (ex(SP)) wr(SP, rd(SP).replace(/>([^<]*)</g, (all, t) => ">" + t.replace(/\\'/g, "'").replace(/'/g, "\\'") + "<"));

  // 5) simgeler, açılış ekranı, TV afişi
  copyDir("assets/android/res", "android/app/src/main/res");
  say("Simgeler, açılış ekranı ve TV afişi kopyalandı");

  // 6) Firebase
  if (fbAndroid){ fs.copyFileSync(path.join(ROOT, "firebase/google-services.json"), path.join(ROOT, "android/app/google-services.json"));
    const pkg = JSON.parse(rd("firebase/google-services.json")).client?.map(c => c.client_info?.android_client_info?.package_name) || [];
    if (!pkg.includes(appId)) fail(`google-services.json içinde ${appId} paketi yok (Firebase'e Android uygulamasını bu paket adıyla ekle). Bulunan: ${pkg.join(", ")}`);
    say("google-services.json eklendi"); }
  say("Android hazır ✔");
}

/* ------------------------------ iOS ------------------------------ */
function ios(){
  const IP = "ios/App/App/Info.plist";
  if (!ex(IP)) fail("Önce: npx cap add ios --packagemanager CocoaPods");
  writeNativeConfig("ios");
  let p = rd(IP);
  const has = k => p.includes(`<key>${k}</key>`);
  const add = (k, xml) => { if (!has(k)) p = p.replace(/<\/dict>\s*<\/plist>\s*$/, `\t<key>${k}</key>\n\t${xml}\n</dict>\n</plist>\n`); };
  p = p.replace(/(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${version}$2`).replace(/(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${buildNo}$2`);
  add("ITSAppUsesNonExemptEncryption", "<false/>");                // ihracat şifreleme sorusu: sadece standart HTTPS
  add("GCSupportsControllerUserInteraction", "<true/>");            // oyun kolu
  add("GCSupportedGameControllers", "<array><dict><key>ProfileName</key><string>ExtendedGamepad</string></dict></array>");
  add("UIRequiresFullScreen", "<false/>");
  add("UIStatusBarHidden", "<true/>");
  add("LSApplicationCategoryType", "<string>public.app-category.simulation-games</string>");
  add("CFBundleLocalizations", "<array><string>tr</string></array>");
  p = p.replace(/(<key>CFBundleDevelopmentRegion<\/key>\s*<string>)[^<]*(<\/string>)/, "$1tr$2");
  // tüm yönler (iPad çoklu görev için şart)
  const ORI = "<array><string>UIInterfaceOrientationPortrait</string><string>UIInterfaceOrientationLandscapeLeft</string><string>UIInterfaceOrientationLandscapeRight</string><string>UIInterfaceOrientationPortraitUpsideDown</string></array>";
  p = p.replace(/<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/, `<key>UISupportedInterfaceOrientations</key>\n\t${ORI}`)
       .replace(/<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/, `<key>UISupportedInterfaceOrientations~ipad</key>\n\t${ORI}`);
  if (adIos){
    add("GADApplicationIdentifier", `<string>${ad("iosAppId")}</string>`);
    add("NSUserTrackingUsageDescription", "<string>Reklamların sana daha uygun olması için kullanılır. İzin vermesen de oyun ve ödüllü reklamlar çalışır.</string>");
    const SK = ["cstr6suwn9","4fzdc2evr5","2fnua5tdw4","ydx93a7ass","p78axxw29g","v72qych5uu","ludvb6z3bs","cp8zw746q7","3sh42y64q3","c6k4g5qg8m","s39g8k73mm","3qy4746246","hs6bdukanm","mlmmfzh3r3","v4nxqhlyqp","wzmmz9fp6w","su67r6k2v3","yclnxrl5pm","7ug5zh24hu","gta9lk7p23","vutu7akeur","y5ghdn5j9k","v9wttpbfk9","n38lu8286q","47vhws6wlr","kbd757ywx3","9t245vhmpl","a2p9lx4jpn","22mmun2rn5","44jx6755aq","k674qkevps","4468km3ulz","2u9pt9hc89","8s468mfl3y","ppxm28t8ap","uw77j35x4d","pwa73g5rt2","578prtvx9j","4dzt52r2t5","tl55sbb4fm","e5fvkxwrpn","8c4e2ghe7u","3rd42ekr43","3qcr597p9d"];
    add("SKAdNetworkItems", "<array>" + SK.map(x => `<dict><key>SKAdNetworkIdentifier</key><string>${x}.skadnetwork</string></dict>`).join("") + "</array>");
  }
  if (fbIos){
    const gs = rd("firebase/GoogleService-Info.plist");
    const val = k => (gs.match(new RegExp(`<key>${k}</key>\\s*<string>([^<]+)</string>`)) || [])[1];
    if (val("BUNDLE_ID") && val("BUNDLE_ID") !== appId) fail(`GoogleService-Info.plist paket adı ${val("BUNDLE_ID")}, beklenen ${appId}`);
    const rev = val("REVERSED_CLIENT_ID");
    if (rev && !p.includes(rev)) add("CFBundleURLTypes", `<array><dict><key>CFBundleURLSchemes</key><array><string>${rev}</string></array></dict></array>`);
    fs.copyFileSync(path.join(ROOT, "firebase/GoogleService-Info.plist"), path.join(ROOT, "ios/App/App/GoogleService-Info.plist"));
    // Google girişi için ek pod
    const PF = "ios/App/Podfile"; let pf = rd(PF);
    if (!pf.includes("CapacitorFirebaseAuthentication/Google")) pf = pf.replace(/(target 'App' do[\s\S]*?capacitor_pods)/, "$1\n  pod 'CapacitorFirebaseAuthentication/Google', :path => '../../node_modules/@capacitor-firebase/authentication'");
    wr(PF, pf);
    // Apple ile giriş yetkisi
    if (G.apple !== false) wr("ios/App/App/App.entitlements", `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>com.apple.developer.applesignin</key>\n\t<array><string>Default</string></array>\n</dict>\n</plist>\n`);
  }
  wr(IP, p);
  copyDir("assets/ios/Assets.xcassets", "ios/App/App/Assets.xcassets");
  // Xcode projesi: sürüm numaraları (dosya ekleme işini scripts/ios-project.rb yapar: macOS'ta xcodeproj gem'i ile)
  const PB = "ios/App/App.xcodeproj/project.pbxproj"; let pb = rd(PB);
  pb = pb.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`).replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${buildNo};`)
         .replace(/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/g, m => parseFloat(m.split("=")[1]) < 15 ? "IPHONEOS_DEPLOYMENT_TARGET = 15.0;" : m);
  wr(PB, pb);
  say(`iOS sürüm ${version} (${buildNo}) hazır ✔`, { reklam: adIos, firebase: fbIos });
}

function copyDir(from, to){
  const src = path.join(ROOT, from); if (!fs.existsSync(src)) fail("Eksik klasör: " + from);
  for (const e of fs.readdirSync(src, { withFileTypes: true })){
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else { fs.mkdirSync(path.join(ROOT, to), { recursive: true }); fs.copyFileSync(path.join(ROOT, a), path.join(ROOT, b)); }
  }
}

const cmd = process.argv[2];
if (cmd === "deps") deps();
else if (cmd === "android") android();
else if (cmd === "ios") ios();
else if (cmd === "config") writeNativeConfig(process.argv[3] || "android");
else fail("Kullanım: node scripts/native-setup.mjs deps|android|ios");
