<script setup>
import { ref, computed } from 'vue'
import { data as albums } from '../../docs/galeri/album.data.ts'
import { withBase } from 'vitepress'
import { Images, Calendar, ChevronDown, X } from 'lucide-vue-next'

const albumTerbuka = ref(null)
const fotoAktif = ref(null)

const albumAda = computed(() => (albums ?? []).length > 0)

function formatTanggal(str) {
  return new Date(str).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function jumlahFoto(album) {
  return (album.foto ?? []).length + 1
}

function bukaAlbum(i) {
  albumTerbuka.value = albumTerbuka.value === i ? null : i
}

function bukaFoto(album, i) {
  fotoAktif.value = { album, index: i }
}

function tutupFoto() {
  fotoAktif.value = null
}

function fotoSebelum() {
  if (!fotoAktif.value) return
  const total = jumlahFoto(fotoAktif.value.album)
  fotoAktif.value.index = (fotoAktif.value.index - 1 + total) % total
}

function fotoBerikut() {
  if (!fotoAktif.value) return
  const total = jumlahFoto(fotoAktif.value.album)
  fotoAktif.value.index = (fotoAktif.value.index + 1) % total
}

function gambarAktif() {
  if (!fotoAktif.value) return null
  const { album, index } = fotoAktif.value
  if (index === 0) return { gambar: album.sampul, keterangan: `Sampul — ${album.title}` }
  return album.foto[index - 1]
}
</script>

<template>
  <div class="galeri-list">

    <!-- Kosong: jujur, tanpa contoh karangan -->
    <div v-if="!albumAda" class="empty-state">
      <Images :size="36" class="empty-icon" />
      <p><strong>Belum ada album galeri.</strong></p>
      <!-- <p>Buka <strong>/admin → 🖼️ Galeri → New Album</strong> untuk menambah album pertama: isi judul, tanggal, foto sampul, lalu tambah daftar foto.</p> -->
    </div>

    <template v-else>
      <div class="album-grid">
        <article v-for="(album, i) in albums" :key="album.title + album.tanggal" class="album-card">
          <button
            class="album-toggle"
            :aria-expanded="albumTerbuka === i"
            @click="bukaAlbum(i)"
          >
            <span class="album-cover">
              <img
                :src="withBase(album.sampul)"
                :alt="`Sampul — ${album.title}`"
                loading="lazy"
              />
              <span class="album-count">
                <Images :size="13" />
                {{ jumlahFoto(album) }} foto
              </span>
            </span>
            <span class="album-meta">
              <span class="album-title">{{ album.title }}</span>
              <span class="album-date">
                <Calendar :size="13" />
                {{ formatTanggal(album.tanggal) }}
              </span>
              <span v-if="album.description" class="album-desc">{{ album.description }}</span>
            </span>
            <ChevronDown
              :size="20"
              class="album-chevron"
              :class="{ putar: albumTerbuka === i }"
            />
          </button>

          <div v-if="albumTerbuka === i" class="album-photos">
            <button
              class="photo-thumb"
              @click="bukaFoto(album, 0)"
              :aria-label="`Lihat foto sampul ${album.title}`"
            >
              <img :src="withBase(album.sampul)" :alt="`Sampul — ${album.title}`" loading="lazy" />
            </button>
            <button
              v-for="(f, j) in album.foto"
              :key="f.gambar + j"
              class="photo-thumb"
              @click="bukaFoto(album, j + 1)"
              :aria-label="`Lihat ${f.keterangan}`"
            >
              <img :src="withBase(f.gambar)" :alt="f.keterangan" loading="lazy" />
            </button>
          </div>
        </article>
      </div>

      <!-- Penampil foto: dialog native agar fokus & keyboard benar -->
      <dialog
        v-if="fotoAktif"
        open
        class="foto-dialog"
        aria-label="Penampil foto galeri"
        @click.self="tutupFoto"
        @keydown.esc="tutupFoto"
      >
        <div class="foto-frame">
          <img
            :src="withBase(gambarAktif().gambar)"
            :alt="gambarAktif().keterangan"
          />
          <p class="foto-caption">{{ gambarAktif().keterangan }}</p>
          <div class="foto-actions">
            <button class="foto-btn" @click="fotoSebelum" aria-label="Foto sebelumnya">‹</button>
            <button class="foto-btn" @click="tutupFoto" aria-label="Tutup penampil">
              <X :size="16" />
            </button>
            <button class="foto-btn" @click="fotoBerikut" aria-label="Foto berikutnya">›</button>
          </div>
        </div>
      </dialog>
    </template>

  </div>
</template>

<style scoped>
.galeri-list { margin: 1.5rem 0; }

.empty-state {
  text-align: center;
  padding: 2.5rem 1.5rem;
  border: 1px dashed var(--warm-border);
  border-radius: 12px;
  background: var(--warm-bg);
  color: var(--vp-c-text-2);
}
.empty-state p { margin: 0.4rem 0; }
.empty-icon { color: var(--teal-600); margin-bottom: 0.5rem; }

.album-grid {
  display: grid;
  gap: 1rem;
}

.album-card {
  border: 1px solid var(--warm-border);
  border-radius: 12px;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.album-toggle {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 1rem;
  align-items: center;
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
}
.album-toggle:focus-visible {
  outline: 2px solid var(--teal-600);
  outline-offset: 2px;
}

.album-cover {
  position: relative;
  display: block;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
}
.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.album-count {
  position: absolute;
  left: 6px;
  bottom: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(13, 61, 69, 0.88);
  color: #fff;
}

.album-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.album-title { font-weight: 700; font-size: 1.02rem; }
.album-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}
.album-date svg { color: var(--teal-600); flex-shrink: 0; }
.album-desc {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.album-chevron { color: var(--teal-600); flex-shrink: 0; transition: transform 0.2s; }
.album-chevron.putar { transform: rotate(180deg); }

.album-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
  padding: 0 0.75rem 0.75rem;
}
.photo-thumb {
  padding: 0;
  border: 1px solid var(--warm-border);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: var(--warm-bg);
  aspect-ratio: 4 / 3;
}
.photo-thumb:focus-visible {
  outline: 2px solid var(--teal-600);
  outline-offset: 2px;
}
.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.foto-dialog {
  border: none;
  border-radius: 12px;
  padding: 0;
  max-width: min(880px, 92vw);
  background: var(--vp-c-bg);
  color: inherit;
}
.foto-dialog::backdrop { background: rgba(0, 0, 0, 0.72); }
.foto-frame { padding: 1rem; }
.foto-frame img {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  display: block;
  background: #000;
}
.foto-caption { text-align: center; font-size: 0.85rem; color: var(--vp-c-text-2); margin: 0.6rem 0; }
.foto-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
.foto-btn {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--warm-border);
  background: var(--warm-bg);
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
}
.foto-btn:focus-visible {
  outline: 2px solid var(--teal-600);
  outline-offset: 2px;
}

@media (max-width: 560px) {
  .album-toggle {
    grid-template-columns: 96px 1fr auto;
    gap: 0.75rem;
  }
  .album-title { font-size: 0.95rem; }
}
</style>
