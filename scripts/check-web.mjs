#!/usr/bin/env node
/* Oyun dosyalarının hızlı kontrolü (derlemeden önce): eksik dosya, JavaScript sözdizimi, sürüm uyumu */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const W = f => path.join(ROOT, "docs", f);
let bad = 0; const ok = m => console.log("✔", m), err = m => { bad++; console.error("✖", m); };
for (const f of ["index.html", "three.min.js", "native.js", "native-config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "gizlilik.html", "hesap-silme.html"])
  fs.existsSync(W(f)) ? ok("var: " + f) : err("eksik: docs/" + f);
const html = fs.readFileSync(W("index.html"), "utf8");
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach((s, i) => { try { new vm.Script(s, { filename: `index.html#script${i}` }); ok(`index.html betik ${i + 1} sözdizimi (${(s.length / 1024 | 0)} KB)`); } catch (e) { err(`index.html betik ${i + 1}: ${e.message}`); } });
for (const f of ["native.js", "native-config.js"]) { try { new vm.Script(fs.readFileSync(W(f), "utf8"), { filename: f }); ok(f + " sözdizimi"); } catch (e) { err(f + ": " + e.message); } }
if (fs.statSync(W("three.min.js")).size < 400000) err("three.min.js eksik/bozuk görünüyor");
for (const need of ["native-config.js", "native.js"]) if (!html.includes(`src="${need}"`)) err(`index.html ${need} dosyasını yüklemiyor`);
const S = JSON.parse(fs.readFileSync(path.join(ROOT, "uygulama-ayarlari.json"), "utf8"));
const C = JSON.parse(fs.readFileSync(path.join(ROOT, "capacitor.config.json"), "utf8"));
C.appId === S.paketAdi ? ok("paket adı uyumlu: " + C.appId) : err(`capacitor.config.json appId (${C.appId}) ≠ uygulama-ayarlari.json paketAdi (${S.paketAdi})`);
if (bad){ console.error(`\n${bad} sorun bulundu`); process.exit(1); }
console.log("\nWeb oyun kontrolü tamam ✔");
