# PROJECT CHARTER — Swap-Smart

## 1. Misi

Mengubah momen paling mahal di dark store — picker menemukan rak kosong — dari "refund
otomatis" menjadi substitusi terbaik dalam satu tap: explainable, aman, terukur.

## 2. Problem (mengapa ini nyata)

- Inventory sistem ≠ rak. ~8% line hilang saat picking (rentang industri 5–10%).
- Respons default platform: refund. Basket hilang; hero item (susu, telur, roti, pisang)
  memicu cancel seluruh order; support kena tiket; customer kecewa.
- Alternatif yang ada saat ini: bot naif "ambil yang paling populer" — buta alergen, diet,
  dan harga → ditolak di pintu → waste + komplain.
- Picker tidak punya alat bantu: keputusan 5 detik di lorong.

## 3. Solusi

Decision support di handheld picker: saran pengganti ter-ranking dengan reason chips,
dijaga hard rules mutlak, dikonfirmasi manusia, disertai pesan customer jujur multilingual.

## 4. Keputusan terkunci

| # | Keputusan | Alasan |
|---|---|---|
| D1 | Hard rules non-AI: in-stock, allergen, diet, ≤25% price uplift, same category | Keselamatan tidak boleh probabilistik |
| D2 | Engine deterministik seeded (mulberry32); same seed ⇒ KPI identik | Reproducibility = bukti |
| D3 | Tiga kebijakan pembanding: auto-refund / naive-sub / swap-smart | Narasi improvement yang jujur & terukur |
| D4 | LLM hanya polishes pesan; tanpa key → template replay | Demo tidak boleh mati; engine tidak bergantung model |
| D5 | Katalog synthetic Berlin (merek fiktif) | Tanpa risiko merek/data nyata |
| D6 | Dual theme light/dark dari hari pertama, tokens dengan channel RGB | Konsisten sekaligus memperbaiki jebakan `/opacity` Tailwind |
| D7 | UI mobile-first untuk picker (phone frame di desktop) + ops deck desktop | Dua persona, dua panggung demo |
| D8 | Pesan customer EN/DE/ID | DH = 70+ negara; personalisasi bahasa = fitur nyata |
| D9 | Halaman Q&A reviewer (tab ke-4); UI produk netral platform — tanpa nama perusahaan di frontend | Plan B: project harus bisa di-apply ke platform q-commerce/dark-store mana pun; target utama tetap tercatat di AGENTS/charter, bukan di UI produk |

## 5. Asumsi model (terkunci; mengubah = ubah baris ini)

| Asumsi | Nilai | Anchor |
|---|---|---|
| OOS rate | 8% dari line, popularity-weighted (fast mover lebih sering habis), min. 1 hero per shift | industri 5–10% |
| Cancel penuh saat hero hilang | 20% basket ≤ 8 line | asumsi eksplisit, adjustable |
| Acceptance substitusi | formula: 0.46 + 0.54·(score/100)^1.05 − penalti uplift + bonus diet; naive ~50% | riset substitusi grocery online |
| Biaya proses refund | €2,50/refund | benchmark CS + payment reversal |
| Volume toko (proyeksi) | 350 order/hari, 30 hari | mid-size q-commerce hub |

## 6. Angka referensi (seed 2026, 1000 order)

Lihat README §"The numbers". Sumber kebenaran: `runSimulation({orders: 1000, seed: 2026})`.

## 7. Non-goals

- Integrasi API platform nyata, auth, database.
- Optimasi harga dinamis / promosi.
- Routing rider (sudah di lastmile-lab).
- Prediksi stok (bisa jadi lanjutan, bukan scope ini).

## 8. Definition of done

`npm run typecheck` + `npm test` + `npm run build` + `npm run e2e` hijau; angka README
direproduksi; deploy Vercel live; README menyebut seed.
