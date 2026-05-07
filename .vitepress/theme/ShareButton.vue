<script setup>
import { computed, ref } from 'vue'
import { useData, useRoute } from 'vitepress'

const { site, page } = useData()
const route = useRoute()

const copied = ref(false)

const pageUrl = computed(() => {
  const base = 'https://masjid-albirru.github.io/masjid-albirru'
  const path = route.path.replace(/\.html$/, '')
  return base + path
})

const pageTitle = computed(() => page.value.title || 'Masjid Al-Birru')

const shareLinks = computed(() => [
  {
    nama: 'WhatsApp',
    ikon: '💬',
    warna: '#25d366',
    url: `https://wa.me/?text=${encodeURIComponent(pageTitle.value + '\n' + pageUrl.value)}`,
  },
  {
    nama: 'Facebook',
    ikon: '📘',
    warna: '#1877f2',
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl.value)}`,
  },
])

async function copyLink() {
  await navigator.clipboard.writeText(pageUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function openShare(url) {
  window.open(url, '_blank', 'width=600,height=400')
}
</script>

<template>
  <div class="share-box">
    <div class="share-label">🤝 Bagikan artikel ini</div>
    <div class="share-buttons">
      <button
        v-for="s in shareLinks"
        :key="s.nama"
        class="share-btn"
        :style="{ '--btn-color': s.warna }"
        :title="'Bagikan ke ' + s.nama"
        @click="openShare(s.url)"
      >
        <span class="share-ikon">{{ s.ikon }}</span>
        <span class="share-nama">{{ s.nama }}</span>
      </button>

      <button class="share-btn share-btn--copy" @click="copyLink" title="Salin link">
        <span class="share-ikon">{{ copied ? '✅' : '🔗' }}</span>
        <span class="share-nama">{{ copied ? 'Tersalin!' : 'Salin Link' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.share-box {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.share-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 0.75rem;
}

.share-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1.5px solid var(--btn-color, var(--vp-c-divider));
  background: transparent;
  color: var(--btn-color, var(--vp-c-text-1));
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:hover {
  background: var(--btn-color, var(--vp-c-brand));
  color: #fff;
}

.share-btn--copy {
  --btn-color: var(--vp-c-brand);
}

.share-ikon { font-size: 0.9rem; }

@media (max-width: 640px) {
  .share-btn { font-size: 0.75rem; padding: 5px 10px; }
}
</style>