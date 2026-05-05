import { createContentLoader } from 'vitepress'

export default createContentLoader('blog/**/*.md', {
  excerpt: true,
  transform(data) {
    return data
      .filter(p =>
        p.frontmatter.date &&         // harus punya tanggal
        p.frontmatter.title &&        // harus punya judul
        !p.url.endsWith('/index')     // skip file index.md
      )
      .sort((a, b) =>
        +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date)
      )
      .map(p => ({
        title:    p.frontmatter.title,
        link:     p.url,
        date:     p.frontmatter.date,
        author:   p.frontmatter.author  ?? 'Redaksi',
        excerpt:  p.frontmatter.description ?? p.excerpt ?? '',
        tags:     p.frontmatter.tags     ?? [],
        category: p.frontmatter.category ?? 'Umum',
        readTime: p.frontmatter.readTime ?? null,
      }))
  }
})