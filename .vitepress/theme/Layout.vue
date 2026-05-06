<script setup>
import DefaultTheme from 'vitepress/theme'
import PengumumanBanner from './PengumumanBanner.vue'
const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <!-- Banner Bismillah -->
      <div class="mosque-top-banner">
        <span class="arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</span>
      </div>
      <!-- Banner Pengumuman -->
      <PengumumanBanner />
    </template>
  </Layout>
</template>

<style scoped>
.mosque-top-banner {
  background: linear-gradient(135deg, #072d33, #0f6b78);
  text-align: center;
  padding: 6px 1rem;
  font-family: 'Amiri', serif;
  font-size: 1rem;
  color: #e8c97a;
  letter-spacing: 2px;
}
</style>