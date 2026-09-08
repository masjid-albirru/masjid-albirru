<script setup>
import { useData } from 'vitepress'
import { HandCoins } from 'lucide-vue-next'

const { site } = useData()
const href = site.value.base.replace(/\/$/, '') + '/donasi'
</script>

<template>
  <a :href="href" class="tombol-donasi">
    <HandCoins :size="15" />
    Donasi
  </a>
</template>

<style scoped>
.tombol-donasi {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 6px 14px;
  border-radius: 8px;
  background: var(--teal-700);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.tombol-donasi:hover {
  background: var(--teal-600);
  color: #fff;
}

/* Ikon selalu putih (VitePress memberi warna brand pada svg di navbar) */
.tombol-donasi svg {
  color: #fff;
}

@media (max-width: 719px) {
  /* Di menu mobile, tombol tampil lebih lebar dan mudah disentuh */
  .tombol-donasi {
    margin: 0.75rem 1.5rem 0.5rem;
    padding: 12px 20px;
    justify-content: center;
    font-size: 0.95rem;
  }
}
</style>
