import { createContentLoader } from 'vitepress'

export default createContentLoader('keuangan/**/*.md', {
  transform(data) {
    return data
      .filter(p =>
        p.frontmatter.pemasukan !== undefined &&
        p.frontmatter.pengeluaran !== undefined &&
        p.frontmatter.bulan &&
        p.frontmatter.tahun
      )
      .sort((a, b) => {
        // Urutkan by tahun desc, lalu bulan desc
        if (b.frontmatter.tahun !== a.frontmatter.tahun)
          return b.frontmatter.tahun - a.frontmatter.tahun
        return b.frontmatter.bulan - a.frontmatter.bulan
      })
      .map(p => ({
        title:       p.frontmatter.title,
        link:        p.url,
        bulan:       p.frontmatter.bulan,       // angka 1-12
        tahun:       p.frontmatter.tahun,
        pemasukan:   p.frontmatter.pemasukan,   // angka, tanpa titik
        pengeluaran: p.frontmatter.pengeluaran,
        saldo_akhir: p.frontmatter.saldo_akhir,
        bendahara:   p.frontmatter.bendahara ?? 'Bendahara',
        status:      p.frontmatter.status ?? 'selesai', // selesai | berjalan
      }))
  }
})