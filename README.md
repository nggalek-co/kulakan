# Kulakan

Cek dan bandingkan harga kebutuhan pokok harian di pasar-pasar Trenggalek.

Data harga diambil **secara langsung (live)** dari
[SISKAPERBAPO](https://siskaperbapo.jatimprov.go.id) — Sistem Informasi Harga
Kebutuhan Pokok Disperindag Provinsi Jawa Timur — setiap kali halaman dibuka.

## Fitur

- **Daftar Harga** — semua komoditas dengan harga rata-rata kabupaten, harga per pasar,
  status naik/turun/stabil, tampilan kartu atau tabel, serta pencarian dengan debounce.
- **Bandingkan Pasar** — perbandingan harga tiap komoditas antar pasar, menandai pasar termurah.
- **Hitung Belanja** — kalkulator keranjang belanja yang menghitung total di setiap pasar
  dan menampilkan pasar paling hemat.
- **Daftar Pasar** — informasi pasar yang tersedia beserta jumlah komoditas dan harga termurah.
- Filter kategori, pasar, status, dan pencarian tersimpan di URL sehingga bisa dibagikan.

## Sumber Data

| | |
|---|---|
| Sumber | SISKAPERBAPO Disperindag Jawa Timur |
| Wilayah | Kabupaten Trenggalek (`trenggalekkab`) |
| Daftar pasar | `GET https://siskaperbapo.jatimprov.go.id/harga/pasar.json/trenggalekkab` |
| Tabel harga | `POST https://siskaperbapo.jatimprov.go.id/harga/tabel.nodesign` |

Catatan:

- Situs sumber tidak mengirim header CORS, jadi permintaan **harus lewat server**
  (lihat `src/server/harga.ts`). Browser tidak menghubungi sumber secara langsung.
- Tanggal diambil otomatis: hari ini (zona `Asia/Jakarta`) lebih dulu; jika data hari ini
  belum diisi (kolom *harga sekarang* masih `0`), aplikasi mundur sampai 7 hari ke belakang
  dan menampilkan tanggal terakhir yang sudah ada datanya.
- Komoditas tanpa harga (ditandai `-` / `0` di sumber) tidak ditampilkan.

## Teknologi

- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) (file-based routing)
- React 19, TypeScript, Vite
- Tailwind CSS v4
- [Siteplane UI](https://ui.siteplane.io) (komponen UI, source di `src/siteplane`)
- Netlify (hosting + Netlify Functions untuk server function)

## Menjalankan

Butuh Node.js 22+ dan [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Buka http://localhost:3000.

## Build & Deploy

```bash
pnpm build      # build produksi (client -> dist/client, server function -> .netlify/v1/functions/server.mjs)
pnpm preview    # pratinjau hasil build
```

Deploy menggunakan [Netlify](https://www.netlify.com). Konfigurasi ada di `netlify.toml`:

```toml
[build]
  command = "vite build"
  publish = "dist/client"
```

Server function berjalan sebagai Netlify Function dan harus bisa mengakses
`siskaperbapo.jatimprov.go.id`. Tidak ada environment variable yang dibutuhkan.

## Struktur Proyek

```
src/
  routes/
    __root.tsx        # shell HTML, meta, provider UI
    index.tsx         # halaman utama (tab, filter, kalkulator)
  server/
    harga.ts          # scraper SISKAPERBAPO (server function)
  data/
    marketData.ts     # tipe data & konstanta yang dipakai bersama
  components/
    KulakanLogo.tsx   # logo vektor Kulakan
  siteplane/          # source komponen Siteplane UI
  styles.css          # entry Tailwind + style Siteplane
```

Alur data:

1. Halaman dirender sebagai *loading shell* di server.
2. Setelah hidrasi, komponen memanggil server function `getLiveMarketData()`.
3. Server function mengambil & mem-parse data SISKAPERBAPO, lalu mengembalikan JSON.
4. UI menampilkan data live tersebut.

## Lisensi

Komponen UI dari Siteplane UI diatur oleh `LICENSE.siteplane-ui` dan
`TRADEMARKS.siteplane-ui.md`. Sisa kode proyek ini milik nggalek.co.
