<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { withBase } from 'vitepress'
import PengumumanBanner from './PengumumanBanner.vue'
import ShareButton from './ShareButton.vue'
import TombolDonasi from './TombolDonasi.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

const showShare = computed(() =>
  frontmatter.value.layout !== 'home'
)

const tautan = [
  { text: 'Beranda', href: '/' },
  { text: 'Donasi', href: '/donasi' },
  { text: 'Qurban', href: '/qurban' },
  { text: 'Kontak', href: '/tentang/kontak' },
]

const tahun = new Date().getFullYear()
</script>

<template>
  <Layout>
    <template #layout-top>
      <PengumumanBanner />
    </template>

    <!-- Tombol CTA Donasi di navbar (desktop & menu mobile) -->
    <template #nav-bar-content-after>
      <TombolDonasi />
    </template>
    <template #nav-screen-content-after>
      <TombolDonasi />
    </template>

    <!-- Footer utuh: tautan cepat + alamat + copyright, konsisten di semua halaman -->
    <template #layout-bottom>
      <footer class="site-footer">
        <nav class="sf-nav" aria-label="Tautan cepat">
          <template v-for="(t, i) in tautan" :key="t.href">
            <span v-if="i > 0" class="sf-pemisah" aria-hidden="true"></span>
            <a :href="withBase(t.href)" class="sf-link">{{ t.text }}</a>
          </template>
        </nav>
        <p class="sf-alamat">Jl. Sirnagalih No.21, Cinangka, Kec. Sawangan, Kota Depok, Jawa Barat 16516</p>
        <p class="sf-copy">&copy; {{ tahun }} Masjid Al-Birru. Semua hak dilindungi.</p>
      </footer>
    </template>

    <template #doc-after>
      <ShareButton v-if="showShare" />
    </template>
  </Layout>
</template>

<style>
/* ===== FOOTER SITUS =====
   Satu footer untuk semua halaman (slot layout-bottom berada di luar
   scoping komponen, jadi gaya global). Footer default VitePress
   disembunyikan di custom.css karena perilakunya tidak konsisten
   (hilang di halaman bersidebar). */
.site-footer {
  background: var(--teal-900);
  color: rgba(255, 255, 255, 0.75);
  padding: 2rem 1.5rem;
  text-align: center;
}

.sf-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px 4px;
  margin-bottom: 0.9rem;
}

.sf-link {
  padding: 6px 10px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.sf-link:hover {
  color: var(--gold-light);
}

.sf-pemisah {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.25);
}

.sf-alamat {
  margin: 0 0 0.3rem;
  font-size: 0.78rem;
  line-height: 1.6;
}

.sf-copy {
  margin: 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.45);
}

@media (max-width: 719px) {
  .site-footer { padding: 1.5rem 1.25rem; }
  .sf-nav { flex-direction: column; gap: 2px; }
  .sf-pemisah { display: none; }
}
</style>
