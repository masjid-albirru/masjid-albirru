# 🕌 Website Masjid Al-Birru

Website resmi Masjid Al-Birru berbasis **VitePress** dengan fitur blog, jadwal acara, laporan keuangan transparan, galeri, dan informasi masjid.

---

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 📰 **Blog & Berita** | Artikel kajian, kegiatan, dan pengumuman |
| 📅 **Jadwal Acara** | Acara rutin dan mendatang |
| 💰 **Laporan Keuangan** | Laporan bulanan & tahunan yang transparan |
| 🤲 **Program Donasi** | Info rekening dan program wakaf/infak |
| 🕌 **Profil Masjid** | Tentang, sejarah, pengurus, fasilitas |
| 🖼️ **Galeri** | Dokumentasi foto kegiatan |
| 🔍 **Pencarian** | Full-text search seluruh konten |
| 🌙 **Dark Mode** | Dukungan tema terang dan gelap |
| 📱 **Responsive** | Optimal di mobile dan desktop |

---

## 🚀 Cara Setup

### 1. Fork & Clone Repository

```bash
git clone https://github.com/USERNAME/masjid-al-ikhlas.git
cd masjid-al-ikhlas
npm install
```

### 2. Konfigurasi Nama Masjid

Edit file `.vitepress/config.mts` — ubah bagian berikut:

```ts
title: 'Masjid Al-Birru',          // ← Ganti nama masjid
description: '...',                   // ← Ganti deskripsi
```

Dan di bagian `editLink`:
```ts
pattern: 'https://github.com/USERNAME/nama-repo/edit/main/docs/:path'
//                            ^^^^^^^^  ^^^^^^^^^  ← Ganti dengan username & nama repo Anda
```

### 3. Jalankan Lokal

```bash
npm run docs:dev
```

Buka [http://localhost:5173](http://localhost:5173)

### 4. Setup GitHub Pages

1. Buka **Settings → Pages** di repository GitHub
2. Pilih **Source: GitHub Actions**
3. Push ke branch `main` → website otomatis ter-deploy!

---

## 📝 Cara Menambah Konten

### Via GitHub Actions (Direkomendasikan untuk Non-Teknis)

Buka tab **Actions** di GitHub → pilih workflow yang diinginkan:

#### ✍️ Tambah Artikel Blog
`Actions → ✍️ Tambah Artikel Blog Baru → Run workflow`

Isi form:
- **Judul** artikel
- **Kategori**: kajian / kegiatan / pengumuman
- **Penulis**
- **Deskripsi singkat**
- **Tag** (pisahkan dengan koma)

Setelah workflow selesai, buka file yang dibuat di GitHub dan isi kontennya.

---

#### 💰 Tambah Laporan Keuangan
`Actions → 💰 Tambah Laporan Keuangan Bulanan → Run workflow`

Isi form:
- **Bulan & Tahun**
- **Saldo awal, total pemasukan, total pengeluaran** (angka saja, tanpa titik/koma)
- **Nama bendahara & ketua**

Saldo akhir dihitung otomatis. Setelah itu, buka file dan isi rincian transaksi.

---

#### 📅 Tambah Acara
`Actions → 📅 Tambah Acara / Event Baru → Run workflow`

Isi form detail acara. File halaman acara akan dibuat otomatis.

---

#### 🗑️ Hapus Konten
`Actions → 🗑️ Hapus Konten → Run workflow`

Isi path file yang ingin dihapus, alasan, dan ketik `HAPUS` untuk konfirmasi.

---

### Via Edit Langsung di GitHub (Untuk yang Familiar Git)

1. Buka file di GitHub
2. Klik ikon pensil ✏️
3. Edit konten
4. Klik **Commit changes**

---

### Via Git Lokal

```bash
# Tambah artikel baru
cp docs/blog/_template.md docs/blog/kajian/judul-artikel-baru.md
# Edit file tersebut
git add .
git commit -m "✍️ Tambah artikel: Judul Artikel Baru"
git push
```

---

## 📁 Struktur Folder

```
masjid-al-ikhlas/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # Auto deploy ke GitHub Pages
│       ├── tambah-artikel.yml      # Tambah artikel blog
│       ├── tambah-keuangan.yml     # Tambah laporan keuangan
│       ├── tambah-acara.yml        # Tambah acara
│       └── hapus-konten.yml        # Hapus konten
├── .vitepress/
│   ├── config.mts                  # Konfigurasi utama VitePress
│   └── theme/
│       ├── index.ts                # Entry point tema
│       ├── Layout.vue              # Layout wrapper (banner arab)
│       └── custom.css              # CSS kustom desain islami
├── docs/
│   ├── index.md                    # 🏠 Halaman beranda
│   ├── blog/
│   │   ├── index.md               # Daftar semua blog
│   │   ├── kajian/                # Artikel kajian Islam
│   │   ├── kegiatan/              # Laporan kegiatan
│   │   └── pengumuman/            # Pengumuman resmi
│   ├── acara/
│   │   └── index.md               # Jadwal acara & kegiatan
│   ├── keuangan/
│   │   ├── index.md               # Ringkasan keuangan
│   │   ├── donasi.md              # Program donasi
│   │   ├── tahunan.md             # Laporan tahunan
│   │   └── 2025/
│   │       ├── januari.md
│   │       ├── februari.md
│   │       └── ...
│   ├── tentang/
│   │   ├── index.md               # Profil masjid
│   │   ├── sejarah.md
│   │   ├── pengurus.md
│   │   ├── fasilitas.md
│   │   └── kontak.md
│   └── galeri/
│       └── index.md
├── public/
│   ├── images/                    # Gambar konten
│   └── icons/                     # Logo & favicon
└── package.json
```

---

## 🎨 Kustomisasi Tampilan

Edit `.vitepress/theme/custom.css` untuk mengubah:

```css
:root {
  --vp-c-brand-1: #1a6b3a;   /* Warna hijau utama */
  --gold: #c9a84c;            /* Warna emas aksen */
}
```

---

## 🏷️ Format Frontmatter Artikel

```yaml
---
title: Judul Artikel
description: Deskripsi singkat untuk SEO
date: 2025-05-01
author: Nama Penulis
category: kajian
tags: [sholat, ibadah, fiqh]
---
```

---

## 📞 Bantuan

Jika ada pertanyaan teknis, hubungi admin website:
- WhatsApp: **0812-3456-7890**
- Email: **admin@masjid-albirru.id**

---

*جَزَاكُمُ اللَّهُ خَيْرًا — Semoga Allah membalas kebaikan Anda*
