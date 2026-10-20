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

GID yang dipakai (nama tab mengikuti spreadsheet):

| Sheet                  | GID          |
|------------------------|--------------|
| RT 01/08               | 2108613077   |
| RT 02/08               | 49278673     |
| RT 05/08               | 1223491287   |
| Kp. Kebon Selatan      | 4478687      |
| Kp. Kebon Cura         | 119487636    |
| SMP Muhammadiyah 29   | 2098343335   |
| TPA Aisyiyah Cinangka  | 885998276    |
| Rincian Transaksi      | 1423454212   |

Tab "Kompilasi" (gid 0) adalah rekap manual, bukan sumber wilayah, jadi
tidak dipakai di kode.

Daftar ini didefinisikan di `wakafData.js` pada konstanta `WILAYAH_SHEET`
dan `GID_RINCIAN`.

## Penambahan wilayah baru

Untuk menambahkan satu wilayah (mis. RT 07), cukup **satu lokasi kode**
yang perlu diubah.

### Lokasi yang diedit

`.vitepress/theme/wakafData.js`, di dalam array `WILAYAH_SHEET`:

```js
export const WILAYAH_SHEET = [
  { nama: 'RT 01/08',              gid: '2108613077' },
  { nama: 'RT 02/08',              gid: '49278673' },
  { nama: 'RT 05/08',              gid: '1223491287' },
  { nama: 'Kp. Kebon Selatan',     gid: '4478687' },
  { nama: 'Kp. Kebon Cura',        gid: '119487636' },
  { nama: 'SMP Muhammadiyah 29',   gid: '2098343335' },
  { nama: 'TPA Aisyiyah Cinangka', gid: '885998276' },
  // tambah di sini:
  { nama: 'RT 07/08', gid: '<gid-dari-publish-url>' },
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
  left: -12000px`) lalu diekspor oleh `TombolShareWakaf.vue` dengan
  `html-to-image` pada `pixelRatio: 1`, sehingga PNG keluar tepat
  **900x1600** (9:16, Story/Status).
- Hasil di-share via Web Share API (HP) atau diunduh (desktop).
- Referensi visual: `notes/wakaf-share/` (sebelum, sesudah, data
  ekstrem, data kosong, dan perbandingan berdampingan).

### Kanvas dan zona aman

| Hal | Nilai |
| --- | --- |
| Kanvas | 900 x 1600 px |
| Margin kiri/kanan | 80 px |
| Konten atas | y 224 (header mulai di sini) |
| Konten bawah | y 1280 (320 px dari dasar) |

Latar gradien boleh memenuhi seluruh kanvas; hanya konten yang dibatasi
zona di atas.

Kartu memakai `display: grid` dengan `grid-template-rows: auto 1fr auto`
(header / body / footer) dan tinggi tetap 1600 px. Grid dipilih, bukan
flex, karena flex `1fr` bisa melampaui tinggi tetap dan membuat isi
melimpah keluar kanvas.

Padding kartu `224px 80px 320px`. Jarak tabel rincian ke footer minimal
40 px; bila tidak cukup, kurangi jarak antar blok di body, jangan
kecilkan hero di bawah 140 px.

### Header

- Kiri: mark `albirru-emblem.png` setinggi 84 px (tanpa plate putih),
  lalu teks "Masjid / Al-Birru" 34 px bold (dua baris), dan garis
  vertikal 1 x 60 `rgba(255,255,255,.28)` sebagai pemisah.
- Kanan: teks "Pimpinan Ranting / Muhammadiyah Cinangka" 25 px rata
  kanan, jarak 16 px ke logo Muhammadiyah 76 x 76 dalam lingkaran putih.
  Logo Muhammadiyah tidak diubah proporsi maupun warnanya.
- Logo Muhammadiyah berwarna hijau `#035f0f` hanya terbaca di atas putih,
  jadi tetap dalam lingkaran putih. Mark Al-Birru memakai varian gelap
  `albirru-emblem.png` tanpa plate sesuai keputusan pengelola.

### Hero dan dana

- Eyebrow "WAKAF TANAH" 26 px bold, letter-spacing .16em, emas `#ebcb86`,
  margin-top 40 dari header.
- Judul "Pembebasan Tanah" 58 px bold, margin-top 4.
- Hero "{luas} m²" 148 px bold, line-height 1, letter-spacing -0.04em,
  "²" sebagai `<sup>` sekitar 0.46em. Angka luas diambil dari
  `ringkasan.totalM2` lewat `angkaLuas`.
- Caption "Luas wakaf yang diperoleh saat ini" 28 px, margin-top 6.
- Progress bar tinggi 16 px, radius 8, track `rgba(255,255,255,.2)` tanpa
  outline, fill emas. Lebar fill = persen sebenarnya, minimal 1,2%.
- Baris dana: kiri "Rp {dana}" 46 px bold, kanan "dari target Rp {target}"
  26 px rata kanan.
- Baris meta: kiri "Dana terkumpul · {persen}%" (persen emas bold),
  kanan "Diperbarui {tanggal}" 26 px rata kanan. Label "Dana terkumpul"
  `rgba(255,255,255,.72)`.

### Tabel rincian per lokasi

- Judul "Rincian per lokasi" 24 px bold uppercase, letter-spacing .12em,
  `rgba(255,255,255,.72)`.
- Grid 2 kolom `1fr 1fr`, column-gap 48 px.
- Setiap baris = satu elemen `.sw-sel` (flex, space-between, baseline),
  tinggi 54 px, padding-top 10, `border-bottom: 1px solid rgba(255,255,255,.28)`,
  font 30 px. Nama lokasi bobot 500, nilai bold menempel di kanan.
- Garis dimiliki baris, bukan sel. Tidak ada elemen kosong untuk
  melengkapi grid; data ganjil membiarkan kolom kanan baris terakhir
  kosong tanpa garis.
- Urutan: mengikuti urutan `wilayahTerisi` (terbesar lebih dulu), mengalir
  kiri-atas ke kanan lalu ke bawah.
- Jumlah lokasi yang tampil dihitung dari **jarak nyata** isi ke footer,
  bukan dari tebakan panjang nama, karena nama panjang membungkus ke dua
  baris sehingga tinggi baris tidak bisa diprediksi. `hitungBatas()`
  memindai dari jumlah terbanyak ke paling sedikit dan mengambil yang
  **pertama muat** (jarak ke footer minimal 40 px). Urutan ini penting:
  saat semua lokasi tampil, baris "+N lokasi lain" tidak dirender,
  sehingga ruang melompat naik. Berhenti di kegagalan pertama justru
  membuang baris yang masih muat.
  Lokasi yang tidak kebagian dirangkum "+N lokasi lain {luas}".
  Nilai diukur ulang lewat `watch` pada props dan `document.fonts.ready`,
  sehingga data yang telat masuk atau font web tidak meninggalkan nilai
  basi.

### Footer

- Kiri (blok rekening, rapat):
  - "Bank Syariah Indonesia" 28 px, `rgba(255,255,255,.86)`.
  - Nomor rekening 50 px bold (800), font yang sama dengan teks lain
    (bukan monospace), `tabular-nums`, line-height 1.02.
  - "a.n. Pimpinan Ranting / Muhammadiyah Cinangka" 26 px, dua baris
    (`<br>`), `text-wrap: balance`.
  - URL "masjid-albirru.id/wakaf-tanah" 28 px bold emas, margin-top 10.
    Diturunkan dari `URL_WAKAF` lewat `urlTampil` (tanpa skema).
- **Tidak ada QR di kartu.** Sebelumnya ada QR 176 px di kanan footer;
  dihapus atas permintaan pengelola. Impor `qrcode` di `StatusWakaf.vue`
  ikut dibuang. Paket `qrcode` tetap dipakai `StatusDonasi.vue` (QRIS),
  jadi tidak dihapus dari `package.json`.
- Tidak ada logo Al-Birru di footer. Logo hanya di header.

### Data dan label

Semua angka dinamis dari `wakafData.js`:

| Elemen | Sumber |
| --- | --- |
| Luas terwakafkan | `ringkasan.totalM2` |
| Dana terkumpul | `ringkasan.totalSetoran` |
| Target dana | `ringkasan.totalNilai` |
| Persentase | `totalSetoran / totalNilai`, via `formatPersen()` |
| Diperbarui | `ringkasan.diperbarui` = tanggal transaksi terakhir di sheet Rincian |
| Rincian per lokasi | `wilayah` (hanya `luas > 0`, urut terbesar) |
| Nomor rekening | `REKENING[1]` di `donasiData.js` |

`formatPersen()` di `wakafData.js`: di bawah 1% dua desimal ("0,28"),
1-10% satu desimal ("4,5"), di atasnya bilangan bulat. Tidak ada angka
persentase yang di-hardcode.

`tanggalTerbaru()` membaca sheet Rincian, mencocokkan nama bulan
(termasuk singkatan "Agsts") lalu mengambil tanggal terbesar. Bila belum
ada transaksi, label "Diperbarui" tidak ditampilkan.

### Warna dan tipografi

- Font: `Lato`, `Segoe UI`, sans-serif (font yang sudah dipakai).
- Satu aksen: emas `#ebcb86`, hanya untuk eyebrow, angka persentase,
  dan URL.
- Teks utama putih; teks sekunder `rgba(255,255,255,.86)`; label
  `rgba(255,255,255,.72)`.
- Gradien `#0d3d45` (atas) ke `#0b4f5a` (bawah).
- Garis pemisah `rgba(255,255,255,.28)`.
- Teks terkecil 24 px pada kanvas 900 px.

### Verifikasi yang sudah dilakukan

- Render 900 x 1600 dengan data spreadsheet asli (366 m², Rp 7.100.000,
  7 wilayah / 6 aktif). Hasil di
  `notes/wakaf-share/sesudah-data-asli-900x1600.png`: **semua 6 lokasi
  tampil**, tanpa baris "+N lokasi lain", jarak isi ke footer 42 px.
- Lima kasus data ekstrem, semua lolos (tidak ada overflow, tidak ada
  teks keluar zona y 224-1280 / x 80-820, tidak ada teks terpotong,
  teks terkecil 24 px, kartu tetap 900 x 1600):

  | Kasus | Baris tampil | Jarak isi ke footer |
  | --- | --- | --- |
  | 0 m² | 0 (tabel tidak dirender) | - |
  | Dana Rp 9.999.999.999 (10 digit) | 2 | 220 px |
  | 9 lokasi | 4 + "+5 lokasi lain" | 87 px |
  | Nama "SMP Muhammadiyah 29 Cinangka" | 4 | 97 px |
  | 5 lokasi (ganjil) | 5 | 111 px |

- Garis tabel selalu lurus antar kolom (mis. 881/881, 935/935).
- Build `npm run docs:build` berhasil.
- Tidak dilakukan: pemindaian QR (sudah tidak relevan, QR dihapus).

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
