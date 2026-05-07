import { createContentLoader } from 'vitepress'

export default createContentLoader('acara/**/*.md', {
  transform(data) {
    const sekarang = new Date()
    sekarang.setHours(0, 0, 0, 0)

    return data
      .filter(p =>
        p.frontmatter.tanggal &&
        p.frontmatter.title &&
        !p.url.endsWith('/index')
      )
      .sort((a, b) =>
        +new Date(a.frontmatter.tanggal) - +new Date(b.frontmatter.tanggal)
      )
      .map(p => {
        const tanggal = new Date(p.frontmatter.tanggal)
        tanggal.setHours(0, 0, 0, 0)
        return {
          title:        p.frontmatter.title,
          link:         p.url,
          tanggal:      p.frontmatter.tanggal,
          waktu_mulai:  p.frontmatter.waktu_mulai  ?? '',
          waktu_selesai:p.frontmatter.waktu_selesai ?? '',
          lokasi:       p.frontmatter.lokasi        ?? 'Masjid Al-Birru',
          pemateri:     p.frontmatter.pemateri      ?? '',
          tipe:         p.frontmatter.tipe          ?? 'Lainnya',
          terbuka_umum: p.frontmatter.terbuka_umum  ?? 'Ya',
          deskripsi:    p.frontmatter.description   ?? '',
          sudah_lewat:  tanggal < sekarang,
        }
      })
  }
})