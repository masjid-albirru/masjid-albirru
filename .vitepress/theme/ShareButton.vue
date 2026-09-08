<script setup>
import { computed, ref } from 'vue'
import { useData, useRoute } from 'vitepress'
import { Link, Check } from 'lucide-vue-next'

const { site, page } = useData()
const route = useRoute()

const copied = ref(false)

const pageUrl = computed(() => {
  const base = site.value.base.replace(/\/$/, '') // '/masjid-albirru'
  const path = route.path.replace(base, '')        // hapus prefix base dari path
  return `https://masjid-albirru.github.io${base}${path}`
})

const pageTitle = computed(() => page.value.title || 'Masjid Al-Birru')

const shareLinks = computed(() => [
  {
    nama: 'WhatsApp',
    warna: '#25d366',
    ikon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    url: `https://wa.me/?text=${encodeURIComponent(pageTitle.value + '\n' + pageUrl.value)}`,
  },
  {
    nama: 'Facebook',
    warna: '#1877f2',
    ikon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
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
    <div class="share-label">Bagikan artikel ini</div>
    <div class="share-buttons">
      <button
        v-for="s in shareLinks"
        :key="s.nama"
        class="share-btn"
        :style="{ '--btn-color': s.warna }"
        :title="'Bagikan ke ' + s.nama"
        @click="openShare(s.url)"
      >
        <span class="share-ikon" v-html="s.ikon"></span>
        <span class="share-nama">{{ s.nama }}</span>
      </button>

      <button class="share-btn share-btn--copy" @click="copyLink" title="Salin link">
        <Check v-if="copied" :size="15" />
        <Link v-else :size="15" />
        <span class="share-nama">{{ copied ? 'Tersalin' : 'Salin Link' }}</span>
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

.share-ikon {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.share-btn svg { flex-shrink: 0; }

@media (max-width: 640px) {
  .share-btn { font-size: 0.75rem; padding: 5px 10px; }
}
</style>