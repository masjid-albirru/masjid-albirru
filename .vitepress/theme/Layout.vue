<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import PengumumanBanner from './PengumumanBanner.vue'
import ShareButton from './ShareButton.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

// Hanya tampil di halaman artikel (bukan homepage/landing)
const showShare = computed(() => frontmatter.value.layout !== 'home')
</script>

<script>
import { computed } from 'vue'
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

    <!-- Share button di bawah setiap artikel -->
    <template #doc-after>
      <ShareButton v-if="showShare" />
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