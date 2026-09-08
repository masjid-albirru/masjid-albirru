<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed } from 'vue'
import PengumumanBanner from './PengumumanBanner.vue'
import ShareButton from './ShareButton.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

const showShare = computed(() =>
  frontmatter.value.layout !== 'home'
)
</script>

<template>
  <Layout>
    <template #layout-top>
      <PengumumanBanner />
    </template>

    <template #doc-after>
      <ShareButton v-if="showShare" />
    </template>
  </Layout>
</template>

<style scoped></style>