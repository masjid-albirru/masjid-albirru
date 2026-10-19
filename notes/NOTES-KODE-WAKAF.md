# Catatan Kode: Fitur Wakaf Tanah

Dokumen ini menjelaskan bagian-bagian kode yang perlu diketahui untuk
memahami, merawat, dan mengembangkan fitur **Wakaf Tanah** di website
Masjid Al-Birru.

## Sekilas fitur

- Halaman publik: `/wakaf-tanah` — daftar wakif per wilayah, total luas,
  total nilai, dan rincian transaksi setoran.
- Sumber data: spreadsheet Google Sheets yang dipublish ke web, satu tab
  per wilayah + satu tab "Rincian Transaksi".
- Konversi: 1 satuan "Jumlah Wakaf" = 1 meter persegi; harga =
  Rp2.500.000 per meter persegi.
- Komponen Vue di `.vitepress/theme/`.

## Struktur file

```
docs/wakaf-tanah.md                   Halaman /wakaf-tanah (markdown)
docs/index.md                          Beranda; menyisipkan <WakafRingkas />
.vitepress/config.mts                 Nav: menu "Wakaf Tanah", Jadwal Imam di dropdown Masjid
.vitepress/theme/wakafData.js         Sumber data bersama + parser CSV
.vitepress/theme/WakafTanah.vue       Halaman utama
.vitepress/theme/WakafRingkas.vue     Ringkasan di beranda
.vitepress/theme/TombolShareWakaf.vue Tombol share (dipakai di kedua tempat)
.vitepress/theme/StatusWakaf.vue      Kartu 9:16 untuk render gambar share
.vitepress/theme/index.ts             Registrasi komponen
```

## Sumber data

Spreadsheet dipublikasikan ke web dengan format CSV. URL polanya:

```
https://docs.google.com/spreadsheets/d/e/<token>/pub?gid=<gid>&single=true&output=csv
```

GID yang dipakai:

| Sheet                | GID          |
|----------------------|--------------|
| RT 01                | 2108613077   |
| RT 02                | 49278673     |
| RT 05                | 1223491287   |
| KKS                  | 4478687      |
| KK Cura              | 119487636    |
| SMP M 29             | 2098343335   |
| Rincian Transaksi    | 1423454212   |

Daftar ini didefinisikan di `wakafData.js` pada konstanta `WILAYAH_SHEET`
dan `GID_RINCIAN`.

## Penambahan wilayah baru

Untuk menambahkan satu wilayah (mis. RT 07), cukup **satu lokasi kode**
yang perlu diubah.

### Lokasi yang diedit

`.vitepress/theme/wakafData.js`, di dalam array `WILAYAH_SHEET`:

```js
export const WILAYAH_SHEET = [
  { nama: 'RT 01',   gid: '2108613077' },
  { nama: 'RT 02',   gid: '49278673' },
  { nama: 'RT 05',   gid: '1223491287' },
  { nama: 'KKS',     gid: '4478687' },
  { nama: 'KK Cura', gid: '119487636' },
  { nama: 'SMP M 29',gid: '2098343335' },
  // tambah di sini:
  { nama: 'RT 07',   gid: '<gid-dari-publish-url>' },
]
```

Urutan di array = urutan tab di halaman `/wakaf-tanah`. Tab aktif saat
halaman pertama dibuka tetap wilayah dengan data terbesar.

### Yang otomatis berubah

| Lokasi                              | Efek                                       |
|-------------------------------------|--------------------------------------------|
| Tab wilayah di `/wakaf-tanah`       | Muncul otomatis (loop `v-for`)             |
| Tabel wakif per wilayah             | Render otomatis dari sheet                 |
| Kartu "X dari Y wilayah"            | `Y` ikut nambah                            |
| Kartu "Wilayah Peserta"             | Akurat, dihitung dari sheet `luas > 0`     |
| Kartu share 9:16                    | Muncul kalau `luas > 0`                    |
| Ringkasan beranda                   | Total m², nilai, setoran ikut nambah       |
| Rincian Transaksi                   | Tidak terpengaruh (sumber sheet terpisah)  |

### Cara mendapat `gid` untuk sheet baru

1. Di Google Sheets, klik tab sheet yang baru.
2. **File → Share → Publish to web** → pilih sheet itu → format CSV →
   klik **Publish** → salin URL.
3. URL berisi `gid=XXXXXXXXXX` — itulah nomornya.
   - Contoh: `…pub?gid=9876543210&single=true&output=csv` → `9876543210`.
4. Cara cepat: buka spreadsheet di mode HTML viewer, cari `gid="..."`
   untuk tab baru. Publish ke web tetap harus dinyalakan.

### Syarat agar sheet tampil dengan benar

- **Publish ke web aktif** untuk sheet tersebut. Kalau lupa, sheet
  tampil sebagai "Belum ada wakif terdaftar", bukan error.
- **Header baris pertama** harus persis: `No, Wakif, Jumlah Wakaf,
  Tenor, Setoran Angsuran, …, Jumlah`. Kolom `Jumlah` harus di akhir.
- **Baris label bulan** tepat di bawah header, dengan nama bulan di
  kolom 4 dst.
- **Baris rekap** (`Jumlah, , <total luas>, , Rp<total setoran>, …`)
  di akhir baris data. Parser memakainya untuk total per wilayah;
  kalau tidak ada, total dihitung ulang dari baris wakif.
- **Nama wakif tidak boleh mengandung baris baru**. Koma boleh
  (parser CSV sudah quote-aware).

### Penambahan baris wakif (sheet yang sudah ada)

Tidak ada kode yang perlu diubah. Cukup tambahkan baris wakif di sheet
yang sudah dipublikasikan, lalu:

1. `npm run docs:build` (cek tidak ada error).
2. Deploy.

Parser membaca ulang semua baris setiap kali halaman dimuat.

## Konvensi nilai

- **Jumlah Wakaf** dibaca sebagai meter persegi. Nilai pecahan "2,5"
  didukung (koma sebagai pemisah desimal).
- **Setoran Angsuran** dibaca sebagai rupiah. Format sumber: `Rp1.234.000`
  atau `Rp0`. Titik adalah pemisah ribuan.
- **Harga per m²** didefinisikan sebagai konstanta `HARGA_PER_M2` di
  `wakafData.js`. Saat ini Rp2.500.000. Mengubahnya = mengubah semua
  tampilan "Target" di halaman, beranda, dan kartu share.

## Target wakaf

Target adalah target tetap (bukan nilai dari totalM2 saat ini), supaya
progres bermakna walau wakif masih sedikit. Dua konstanta di
`wakafData.js`:

- `LUAS_TARGET_M2` — target dalam meter persegi (saat ini `1000`).
- `NILAI_TARGET` — `LUAS_TARGET_M2 * HARGA_PER_M2` (saat ini
  `2.500.000.000`).

`ringkasan.totalNilai` menggunakan `NILAI_TARGET`. Efeknya:

- Kartu "Target" di `/wakaf-tanah` menampilkan target rupiah + sub-teks
  "Target · 1.000 m² wakaf".
- Kartu ringkasan beranda menampilkan hal serupa.
- Baris progres: "Rp X terkumpul dari target Rp Y (Z%)".
- Kartu share 9:16 menampilkan "dari target Rp Y" di baris kedua.

Untuk mengubah target cukup ganti `LUAS_TARGET_M2` di `wakafData.js` —
semua tampilan ikut otomatis.

## Format angka

- `rupiah(n)` — `"Rp " + n.toLocaleString('id-ID')`, contoh `Rp 7.100.000`.
- `rupiahRingkas(n)` — versi ringkas untuk kartu: `"Rp 655 juta"` atau
  `"Rp 1,2 miliar"`. Dipakai di kartu ringkasan supaya muat satu baris.
- `luasM2(n)` — meter persegi. Bulat tanpa desimal; pecahan dengan satu
  angka di belakang koma dan pemisah koma (mis. `2,5 m²`).

## Kartu share "Ajakan Wakaf"

- Dihasilkan oleh `StatusWakaf.vue` (off-screen, `position: fixed;
  left: -10000px`) lalu di-capture oleh `TombolShareWakaf.vue` dengan
  `html-to-image` (skala 2×, jadi 1080×1920).
- Hasil di-share via Web Share API (HP) atau diunduh (desktop).
- Konten: brand, label "Wakaf Tanah", judul "Pembebasan Tanah H. Basir",
  angka luas (fokus utama), progress bar, total setoran & nilai, daftar
  wilayah yang sudah ada wakifnya, QRIS + rekening + situs.
- Style pakai token yang sama dengan `StatusDonasi.vue` agar kartu
  masjid terbaca satu keluarga.

## Cache data

`muatDataWakaf()` di `wakafData.js` menyimpan hasilnya dalam satu
`Promise` per sesi modul. Halaman `/wakaf-tanah` dan ringkasan beranda
memakai sumber yang sama, jadi angkanya tidak pernah berbeda di dua
tempat. Cache dibuang saat halaman di-reload; tidak ada strategi SWR /
localStorage.

## Checklist deploy

```
☐ Tambah baris wakif / wilayah baru di sheet
☐ Publish sheet baru ke web (CSV)
☐ Tambah 1 baris di WILAYAH_SHEET (wakafData.js)
☐ Ubah HARGA_PER_M2 bila perlu
☐ npm run docs:build
☐ Deploy
```
