// scripts/kompres-gambar.mjs
// Kompres otomatis gambar di docs/public/images/uploads agar repo & GitHub Pages tetap ramping.
// - Lebar > 1920px diturunkan ke 1920px (proporsional)
// - Re-encode sejenis (ekstensi & path dipertahankan — markdown merujuk path tersebut)
// - File ditulis ulang HANYA jika dimensi menyusut atau hemat ≥2% (idempoten,
//   tanpa churn commit di CI)
// Cara pakai: npm run images:compress

import { readdir, stat, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const FOLDER = 'docs/public/images/uploads'
const LEBAR_MAKS = 1920
const KUALITAS = 75
// Tulis ulang hanya jika hemat ≥2%: re-encode JPEG tidak pernah stabil
// byte-identik, tanpa ambang CI akan commit churn di setiap run.
const AMBANG_HEMAT = 0.02
const EKSTENSI = new Set(['.jpg', '.jpeg', '.png', '.webp'])

async function kumpulkan(dir) {
  const hasil = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    console.log(`Folder tidak ditemukan: ${dir} — lewati.`)
    return hasil
  }
  for (const e of entries) {
    const penuh = path.join(dir, e.name)
    if (e.isDirectory()) hasil.push(...(await kumpulkan(penuh)))
    else if (e.isFile() && EKSTENSI.has(path.extname(e.name).toLowerCase())) hasil.push(penuh)
  }
  return hasil
}

function formatByte(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

let diubah = 0
let hemat = 0

for (const file of await kumpulkan(FOLDER)) {
  const ext = path.extname(file).toLowerCase()
  try {
    // Baca via buffer dulu: binding native sharp di sebagian lingkungan
    // gagal memory-map file besar langsung dari path (error UNKNOWN).
    const mentah = await readFile(file)
    const gambar = sharp(mentah, { animated: false })
    const meta = await gambar.metadata()
    if (!meta.width) continue

    let pipeline = gambar
    const perluResize = meta.width > LEBAR_MAKS
    if (perluResize) pipeline = pipeline.resize({ width: LEBAR_MAKS, withoutEnlargement: true })

    if (ext === '.jpg' || ext === '.jpeg') pipeline = pipeline.jpeg({ quality: KUALITAS, progressive: true })
    else if (ext === '.png') pipeline = pipeline.png({ compressionLevel: 9, palette: true })
    else if (ext === '.webp') pipeline = pipeline.webp({ quality: KUALITAS })

    const hasil = await pipeline.toBuffer()
    const awal = (await stat(file)).size
    const rasioHemat = awal > 0 ? (awal - hasil.length) / awal : 0

    if (perluResize || rasioHemat >= AMBANG_HEMAT) {
      await writeFile(file, hasil)
      diubah++
      hemat += Math.max(awal - hasil.length, 0)
      console.log(`✅ ${file}: ${formatByte(awal)} → ${formatByte(hasil.length)}`)
    } else {
      console.log(`➖ ${file}: sudah optimal (${formatByte(awal)})`)
    }
  } catch (err) {
    console.log(`⚠️ ${file}: gagal diproses (${err.message}) — dibiarkan apa adanya.`)
  }
}

console.log(`\nSelesai: ${diubah} file dikompres, hemat ${formatByte(hemat)}.`)
