# AGENTS.md — Aturan Main Project Swap-Smart

> Kontrak kerja. WAJIB dibaca setiap sesi AI/developer sebelum menulis satu baris kode.
> Pelanggaran aturan di sini = pekerjaan gagal meskipun kodenya jalan.

## 1. Identitas

- **Nama:** Swap-Smart
- **Satu kalimat:** Item dark store habis saat picking → picker dapat pengganti terbaik dalam
  satu tap — explainable, dijaga hard rules, dibuktikan angka reproducible.
- **Tujuan:** Portfolio engineering keempat untuk melamar **Delivery Hero (Berlin)** — sisi
  **vendor ops / q-commerce (dark store)**, melengkapi: `lastmile-lab` (rider/dispatch),
  `hungry` (customer), `prep-truth` (resto).
- **Lokasi:** `/home/rico/portfolio/swap-smart`
- **Charter:** `docs/PROJECT_CHARTER.md` — WHAT/WHY + asumsi model yang terkunci.

## 2. Urutan membaca (setiap sesi baru)

1. `AGENTS.md` (file ini)
2. `docs/PROJECT_CHARTER.md`
3. `README.md` (angka referensi seed 2026)

## 3. Ritual per fase

1. Kerjakan scope fase aktif saja.
2. Verifikasi wajib: `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e`.
3. Commit konvensional: `feat|fix|docs|chore|refactor|test(scope): pesan`.
4. Angka di README/Story harus direproduksi sendiri dari engine (seed 2026, 1000 orders)
   sebelum dipublikasi. Tidak pernah melaporkan angka yang tidak direproduksi.

## 4. Aturan keras

### Engine
- Semua stokastik wajib lewat `Rng` (mulberry32, seeded). **Dilarang `Math.random`.**
- Same seed ⇒ KPI identik byte-per-byte. Test determinism adalah pemblokir.
- Hard rules substitusi tidak boleh dilanggar siapa pun, termasuk lapisan AI:
  in-stock, allergen, diet, price guardrail ±25%, same category.
- LLM hanya memilih kata-kata (pesan customer). Tanpa API key aplikasi tetap hidup penuh
  (template replay). Tidak ada secret di git; `.env` di-ignore.

### Frontend
- UI produk 100% English. Docs repo: Indonesia.
- Semua warna via design tokens (`src/styles/tokens.css`). Channel `-rgb` untuk Tailwind
  (wajib: modifier `/opacity` butuh format channel, bukan hex).
- Dual theme light/dark di-desain bersamaan; pilihan persist di localStorage, awal ikut OS.
- Grafik = SVG tulis tangan, tanpa chart library.
- Label angka harus jelas unitnya: "per 1,000 orders" ≠ "per month at 350 orders/day".
  `impactSummary()` = per-bulan; delta per-1k dihitung dari KPI mentah. Jangan dicampur.

### Android (Capacitor)
- Shell mobile di `src/mobile/` (Picker fullscreen + About); web tidak berubah — gate lewat
  `Capacitor.isNativePlatform()` di `App.tsx`. Konten handheld bersumber dari
  `src/views/PickerSession.tsx` + `PickerHandheld.tsx` yang juga dipakai halaman web.
- Build: `npm run cap:sync` (build web + sync) lalu `npm run apk` → APK tersalin ke
  `swap-smart-debug.apk` di root. Verifikasi wajib sama (typecheck, test, build, e2e).
- Toolchain tanpa root: `JAVA_HOME=~/tools/jdk-21*`, `ANDROID_HOME=~/tools/android-sdk`
  (platform 36). Tidak ada keystore release di repo; APK debug hanya untuk demo.
- Halaman download `/apk` (`src/views/ApkPage.tsx`) menyajikan `public/swap-smart.apk`;
  setelah rebuild APK jalankan `npm run apk:copy` agar yang di-download = binary terbaru.
  QR code di `public/apk-qr.svg` menunjuk ke URL produksi — regenerasi hanya jika domain berubah.

### Data & kejujuran
- Data demo synthetic Berlin; tidak ada merek nyata, tidak ada data produksi.
- Asumsi model (OOS 8%, cancel 20%, refund €2.50, 350 order/hari) tercatat di charter;
  mengubahnya = ubah charter di commit yang sama.
