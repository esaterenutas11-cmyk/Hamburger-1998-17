/* =====================================================================
   Couple's Burger Life · uygulama (Android / iOS) köprüsü
   Sadece mağaza uygulamasında (Capacitor) çalışır; web sürümünde hiçbir şey yapmaz.
   - window.CBL_ADS  : AdMob ödüllü reklam (izin formu + iOS izleme izni dahil)
   - window.CBL_IAP  : Google Play / App Store satın alma (elmas paketleri, reklamları kaldır, geri yükleme)
   - window.CBL_AUTH : yerel Google / Apple girişi (WebView içinde açılır pencere çalışmadığı için)
   Ayarlar: native-config.js (scripts/native-setup.mjs, uygulama-ayarlari.json'dan üretir)
   ===================================================================== */
(function () {
  "use strict";
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  var P = C.Plugins || {};
  var CFG = window.CBL_NATIVE_CFG || {};
  var platform = C.getPlatform();                       // "android" | "ios"
  var log = function () { try { console.log.apply(console, ["[CBL]"].concat([].slice.call(arguments))); } catch (e) {} };
  document.documentElement.classList.add("native", "native-" + platform);

  /* ---------- ekran: tam ekran, açılış ekranını kapat ---------- */
  try { if (P.StatusBar) { P.StatusBar.setOverlaysWebView && P.StatusBar.setOverlaysWebView({ overlay: true }).catch(function () {}); P.StatusBar.hide && P.StatusBar.hide().catch(function () {}); } } catch (e) {}
  var hideSplash = function () { try { P.SplashScreen && P.SplashScreen.hide({ fadeOutDuration: 250 }).catch(function () {}); } catch (e) {} };
  if (document.readyState === "complete") setTimeout(hideSplash, 300); else window.addEventListener("load", function () { setTimeout(hideSplash, 300); });
  setTimeout(hideSplash, 6000);                         // ne olursa olsun takılı kalmasın

  /* ---------- ödüllü reklam (AdMob) ---------- */
  var adUnit = (CFG.admob && CFG.admob[platform] && CFG.admob[platform].rewarded) || "";
  var adTesting = !!(CFG.admob && CFG.admob.testing);
  var adReady = null;
  function adsInit() {
    if (!P.AdMob || !adUnit) return Promise.resolve(false);
    if (adReady) return adReady;
    adReady = (async function () {
      try {
        if (platform === "ios" && P.AdMob.trackingAuthorizationStatus) {
          var st = await P.AdMob.trackingAuthorizationStatus().catch(function () { return {}; });
          if (st && st.status === "notDetermined" && P.AdMob.requestTrackingAuthorization) await P.AdMob.requestTrackingAuthorization().catch(function () {});
        }
        await P.AdMob.initialize({ initializeForTesting: adTesting });
        if (P.AdMob.requestConsentInfo) {
          var info = await P.AdMob.requestConsentInfo().catch(function () { return null; });
          if (info && info.isConsentFormAvailable && info.status === "REQUIRED" && P.AdMob.showConsentForm) await P.AdMob.showConsentForm().catch(function () {});
        }
        return true;
      } catch (e) { log("admob init", e); adReady = null; return false; }
    })();
    return adReady;
  }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("zaman aşımı")); }, ms); })]); }
  window.CBL_ADS = {
    available: function () { return !!(P.AdMob && adUnit); },
    rewarded: async function () {
      if (!P.AdMob || !adUnit) throw new Error("reklam yok");
      var ok = await adsInit(); if (!ok) throw new Error("reklam başlatılamadı");
      var got = false, subs = [];
      try {
        subs.push(await P.AdMob.addListener("onRewardedVideoAdReward", function () { got = true; }));
        await withTimeout(P.AdMob.prepareRewardVideoAd({ adId: adUnit, isTesting: adTesting }), 20000);
        var r = await P.AdMob.showRewardVideoAd();
        if (r && (r.amount != null || r.type)) got = true;
      } finally { subs.forEach(function (s) { try { s && s.remove && s.remove(); } catch (e) {} }); }
      return got;
    }
  };
  setTimeout(function () { if (adUnit) adsInit(); }, 4000);   // uygulama açılınca arka planda hazırla

  /* ---------- satın alma (Google Play Faturalandırma / App Store) ---------- */
  var PRODUCTS = [
    { id: "remove_ads", consumable: false },
    { id: "diamonds_80", consumable: true }, { id: "diamonds_220", consumable: true },
    { id: "diamonds_500", consumable: true }, { id: "diamonds_1200", consumable: true }
  ];
  var pending = {}, delivered = {}, store = null, storeReady = false;
  try { delivered = JSON.parse(localStorage.getItem("cbl_iap_done") || "{}"); } catch (e) {}
  function markDelivered(tid) { if (!tid) return; delivered[tid] = Date.now(); try { localStorage.setItem("cbl_iap_done", JSON.stringify(delivered)); } catch (e) {} }
  function grant(pid, viaPending) {
    if (pid === "remove_ads") { try { window.__cblNoAds && window.__cblNoAds(true); } catch (e) {} }
    var pend = pending[pid];
    if (pend) { delete pending[pid]; pend.resolve(true); return; }
    if (!viaPending && /^diamonds_/.test(pid)) { try { window.__cblGrant && window.__cblGrant(pid); } catch (e) {} }   // yarım kalan (önceki açılıştan) satın alma
  }
  function loadCordova() {
    return new Promise(function (res) {
      if (window.CdvPurchase) return res();
      if (!window.cordova) { var s = document.createElement("script"); s.src = "cordova.js"; s.onerror = function () { res(); }; document.head.appendChild(s); }
      document.addEventListener("deviceready", function () { res(); }, { once: true });
      setTimeout(res, 8000);
    });
  }
  async function iapInit() {
    await loadCordova();
    if (!window.CdvPurchase) { log("satın alma eklentisi yok"); return; }
    var CP = window.CdvPurchase; store = CP.store;
    var plat = platform === "ios" ? CP.Platform.APPLE_APPSTORE : CP.Platform.GOOGLE_PLAY;
    store.register(PRODUCTS.map(function (p) { return { id: p.id, type: p.consumable ? CP.ProductType.CONSUMABLE : CP.ProductType.NON_CONSUMABLE, platform: plat }; }));
    store.when()
      .approved(function (t) { return t.verify(); })
      .verified(function (r) { return r.finish(); })
      .finished(function (t) {
        var tid = t.transactionId;
        (t.products || []).forEach(function (pr) {
          if (pr.id === "remove_ads") { grant("remove_ads"); return; }
          if (delivered[tid + ":" + pr.id]) return;
          markDelivered(tid + ":" + pr.id); grant(pr.id);
        });
      })
      .productUpdated(function () { try { window.__cblPricesChanged && window.__cblPricesChanged(); } catch (e) {} });
    store.error(function (e) { log("mağaza hatası", e && e.message); });
    await store.initialize([plat]);
    storeReady = true;
    try { if (store.owned("remove_ads")) grant("remove_ads", true); } catch (e) {}
  }
  var iapStarted = iapInit().catch(function (e) { log("iap", e); });
  window.CBL_IAP = {
    available: function () { return storeReady; },
    price: function (pid) { try { var p = store && store.get(pid); return p && p.pricing && p.pricing.price || null; } catch (e) { return null; } },
    buy: async function (pid) {
      await iapStarted;
      if (!store || !storeReady) throw new Error("Mağaza hazır değil");
      var p = store.get(pid), offer = p && p.getOffer && p.getOffer();
      if (!offer) throw new Error("Ürün bulunamadı: " + pid);
      return new Promise(function (resolve, reject) {
        pending[pid] = { resolve: resolve, reject: reject };
        Promise.resolve(offer.order()).then(function (err) {
          if (err) { delete pending[pid]; if (err.code === window.CdvPurchase.ErrorCode.PAYMENT_CANCELLED) resolve(false); else reject(err); }
        }).catch(function (e) { delete pending[pid]; reject(e); });
        setTimeout(function () { if (pending[pid]) { delete pending[pid]; resolve(false); } }, 10 * 60 * 1000);
      });
    },
    restore: async function () {
      await iapStarted;
      if (!store) return false;
      try { await store.restorePurchases(); } catch (e) { log("geri yükleme", e); }
      var own = false; try { own = store.owned("remove_ads"); } catch (e) {}
      if (own) grant("remove_ads", true);
      return own;
    }
  };

  /* ---------- yerel giriş: Google (Android + iOS), Apple (iOS) ---------- */
  var FA = P.FirebaseAuthentication;
  window.CBL_AUTH = {
    google: !!(FA && CFG.auth && CFG.auth.google),
    apple: !!(FA && platform === "ios" && CFG.auth && CFG.auth.apple),
    /* Firebase JS SDK ile oturum açmak için kimlik bilgisini döndürür */
    signIn: async function (provider, fb) {
      if (!FA) throw new Error("giriş eklentisi yok");
      if (provider === "apple") {
        var ra = await FA.signInWithApple({ skipNativeAuth: true });
        var c = ra && ra.credential; if (!c || !c.idToken) throw new Error("Apple girişi iptal");
        var prov = new fb.auth.OAuthProvider("apple.com");
        return fb.auth().signInWithCredential(prov.credential({ idToken: c.idToken, rawNonce: c.nonce }));
      }
      var rg = await FA.signInWithGoogle({ skipNativeAuth: true });
      var g = rg && rg.credential; if (!g || !g.idToken) throw new Error("Google girişi iptal");
      return fb.auth().signInWithCredential(fb.auth.GoogleAuthProvider.credential(g.idToken, g.accessToken || null));
    },
    signOut: function () { try { return FA ? FA.signOut().catch(function () {}) : Promise.resolve(); } catch (e) { return Promise.resolve(); } }
  };
  log("yerel köprü hazır", platform, { ads: !!adUnit, google: window.CBL_AUTH.google, apple: window.CBL_AUTH.apple });
})();
