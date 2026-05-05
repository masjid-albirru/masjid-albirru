<script setup>
import { ref, computed } from 'vue'
import { data as posts } from '../../docs/blog/posts.data.ts'
import { withBase } from 'vitepress'

// Kumpulkan semua tag unik dari semua artikel
const allTags = computed(() => {
  const tags = new Set()
  posts.forEach(p => (p.tags ?? []).forEach(t => tags.add(t)))
  return ['semua', ...Array.from(tags).sort()]
})

const activeTag = ref('semua')

const filteredPosts = computed(() => {
  if (activeTag.value === 'semua') return posts
  return posts.filter(p => (p.tags ?? []).includes(activeTag.value))
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const categoryIcon = {
  kajian:      '📖',
  kegiatan:    '🏃',
  pengumuman:  '📢',
  Kajian:      '📖',
  Kegiatan:    '🏃',
  Pengumuman:  '📢',
}
</script>

<template>
  <div class="blog-list">

    <!-- Kosong -->
    <div v-if="posts.length === 0" class="empty-state">
      <p>Belum ada artikel. Gunakan workflow <strong>Tambah Artikel</strong> untuk membuat artikel pertama.</p>
    </div>

    <template v-else>
      <!-- Filter Tags -->
      <div class="tag-filter">
        <span class="filter-label">Filter:</span>
        <button
          v-for="tag in allTags"
          :key="tag"
          class="tag-btn"
          :class="{ active: activeTag === tag }"
          @click="activeTag = tag"
        >
          {{ tag }}
        </button>
      </div>

      <!-- Tidak ada hasil filter -->
      <p v-if="filteredPosts.length === 0" class="no-result">
        Tidak ada artikel dengan tag "<strong>{{ activeTag }}</strong>".
      </p>

      <!-- Daftar Artikel -->
      <div class="post-list">
        <article v-for="post in filteredPosts" :key="post.link" class="post-card">
          <div class="post-header">
            <span class="post-category">
              {{ categoryIcon[post.category] ?? '📝' }} {{ post.category }}
            </span>
            <span class="post-date">📅 {{ formatDate(post.date) }}</span>
          </div>

          <h3 class="post-title">
            <a :href="withBase(post.link)">{{ post.title }}</a>
          </h3>

          <p v-if="post.excerpt" class="post-excerpt">{{ post.excerpt }}</p>

          <div class="post-footer">
            <div class="post-tags">
              <button
                v-for="tag in (post.tags ?? [])"
                :key="tag"
                class="tag"
                :class="{ active: activeTag === tag }"
                @click="activeTag = tag"
              >
                {{ tag }}
              </button>
            </div>
            <div class="post-meta-right">
              <span v-if="post.author" class="post-author">✍️ {{ post.author }}</span>
              <span v-if="post.readTime" class="post-readtime">⏱️ {{ post.readTime }} mnt</span>
              <a :href="withBase(post.link)" class="read-more">Baca →</a>
            </div>
          </div>
        </article>
      </div>
    </template>

  </div>
</template>

<style scoped>
/* ===== Filter Tags ===== */
.tag-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 2rem;
  padding: 1rem 1.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-right: 4px;
}

.tag-btn {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1.5px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
  text-transform: capitalize;
}

.tag-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.tag-btn.active {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: #fff;
}

/* ===== Post Card ===== */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.post-card {
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.post-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border-color: var(--vp-c-brand-light);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
}

.post-category {
  font-weight: 600;
  color: var(--vp-c-brand);
  text-transform: capitalize;
}

.post-title {
  margin: 0 0 0.6rem;
  font-size: 1.1rem;
  line-height: 1.4;
}

.post-title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s;
}

.post-title a:hover {
  color: var(--vp-c-brand);
}

.post-excerpt {
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0 0 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(15, 107, 120, 0.1);
  color: var(--vp-c-brand);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: capitalize;
}

.tag:hover,
.tag.active {
  background: var(--vp-c-brand);
  color: #fff;
}

.post-meta-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  flex-wrap: wrap;
}

.read-more {
  font-weight: 600;
  color: var(--vp-c-brand);
  text-decoration: none;
  transition: opacity 0.2s;
}

.read-more:hover { opacity: 0.75; }

.no-result,
.empty-state {
  text-align: center;
  color: var(--vp-c-text-2);
  padding: 2rem;
}

@media (max-width: 640px) {
  .post-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .post-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>