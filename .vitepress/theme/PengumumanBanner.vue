<script setup>
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'
const { site } = useData()

// Fungsi helper buat link dengan base otomatis
function url(path) {
  return site.value.base + path.replace(/^\//, '')
}
// ============================================================
// DATA PENGUMUMAN — kelola dari sini atau via Decap CMS
// Set aktif: false untuk menyembunyikan banner
// ============================================================
const PENGUMUMAN = [
  {
    aktif: true,
    tipe: 'info',   // info | penting | darurat
    ikon: '📢',
    pesan: 'Kajian Rutin Malam Rabu bersama Ust. Ahmad Fauzi — setiap Rabu ba\'da Maghrib di Masjid Al-Birru.',
    link: '/blog/kajian/keutamaan-sholat-berjamaah',
    link_label: 'Selengkapnya',
  },
  {
    aktif: true,
    tipe: 'penting',
    ikon: '🏗️',
    pesan: 'Program donasi Renovasi Tempat Wudhu masih berjalan — bantu kami capai target Rp 75 juta!',
    link: '/keuangan/donasi',
    link_label: 'Donasi Sekarang',
  },
]
// ============================================================

const aktifList = PENGUMUMAN.filter(p => p.aktif)
const current = ref(0)
const dismissed = ref(false)

// Auto-rotate jika lebih dari 1 pengumuman
let timer
onMounted(() => {
  if (aktifList.length > 1) {
    timer = setInterval(() => {
      current.value = (current.value + 1) % aktifList.length
    }, 5000)
  }
})

function next() {
  current.value = (current.value + 1) % aktifList.length
}

function prev() {
  current.value = (current.value - 1 + aktifList.length) % aktifList.length
}

const warna = {
  info:    { bg: '#0f6b78', text: '#fff' },
  penting: { bg: '#92400e', text: '#fef3c7' },
  darurat: { bg: '#991b1b', text: '#fee2e2' },
}
</script>

<template>
  <div v-if="!dismissed && aktifList.length > 0" class="pengumuman-banner"
    :style="{ background: warna[aktifList[current].tipe].bg, color: warna[aktifList[current].tipe].text }">

    <div class="pb-inner">
      <!-- Nav kiri -->
      <button v-if="aktifList.length > 1" class="pb-nav" @click="prev">‹</button>

      <!-- Konten -->
      <div class="pb-content">
        <span class="pb-ikon">{{ aktifList[current].ikon }}</span>
        <span class="pb-pesan">{{ aktifList[current].pesan }}</span>
        <a v-if="aktifList[current].link" :href="url(aktifList[current].link)" class="pb-link">
          {{ aktifList[current].link_label }} →
        </a>
      </div>

      <!-- Nav kanan + dots + close -->
      <div class="pb-right">
        <button v-if="aktifList.length > 1" class="pb-nav" @click="next">›</button>

        <!-- Dots -->
        <div v-if="aktifList.length > 1" class="pb-dots">
          <span
            v-for="(_, i) in aktifList" :key="i"
            class="pb-dot"
            :class="{ active: i === current }"
            @click="current = i"
          ></span>
        </div>

        <button class="pb-close" @click="dismissed = true" title="Tutup">✕</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.pengumuman-banner {
  width: 100%;
  transition: background 0.4s;
}

.pb-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 8px 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pb-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.82rem;
  text-align: center;
}

.pb-ikon { font-size: 1rem; flex-shrink: 0; }

.pb-pesan { line-height: 1.4; }

.pb-link {
  font-weight: 700;
  text-decoration: underline;
  opacity: 0.9;
  white-space: nowrap;
  color: inherit;
  transition: opacity 0.2s;
}
.pb-link:hover { opacity: 1; }

.pb-nav {
  background: rgba(255,255,255,0.2);
  border: none;
  color: inherit;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
  transition: background 0.2s;
}
.pb-nav:hover { background: rgba(255,255,255,0.35); }

.pb-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.pb-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.pb-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  cursor: pointer;
  transition: background 0.2s;
}
.pb-dot.active { background: rgba(255,255,255,0.95); }

.pb-close {
  background: rgba(255,255,255,0.15);
  border: none;
  color: inherit;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.65rem;
  line-height: 1;
  flex-shrink: 0;
  transition: background 0.2s;
}
.pb-close:hover { background: rgba(255,255,255,0.3); }

@media (max-width: 640px) {
  .pb-content { font-size: 0.75rem; }
  .pb-pesan { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
}
</style>