import { createContentLoader } from 'vitepress'

export default createContentLoader('khatib/**/*.md', {
  transform(data) {
    return data
      .filter(p =>
        p.frontmatter.tanggal &&
        p.frontmatter.khatib &&
        !p.url.endsWith('/index')
      )
      .sort((a, b) =>
        +new Date(a.frontmatter.tanggal) - +new Date(b.frontmatter.tanggal)
      )
      .map(p => ({
        tanggal: p.frontmatter.tanggal,
        khatib:  p.frontmatter.khatib,
        tema:    p.frontmatter.tema    ?? '',
        link:    p.url,
      }))
  }
})