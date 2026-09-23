import { createContentLoader } from 'vitepress'

export interface GaleriFoto {
  gambar: string
  keterangan: string
}

export interface GaleriAlbum {
  title: string
  tanggal: string
  description: string
  sampul: string
  foto: GaleriFoto[]
}

export default createContentLoader('galeri/album/*.md', {
  transform(data): GaleriAlbum[] {
    return data
      .filter(p =>
        p.frontmatter.tanggal &&
        p.frontmatter.title &&
        p.frontmatter.sampul
      )
      .sort((a, b) =>
        +new Date(b.frontmatter.tanggal) - +new Date(a.frontmatter.tanggal)
      )
      .map(p => {
        const daftar = Array.isArray(p.frontmatter.foto) ? p.frontmatter.foto : []
        return {
          title: p.frontmatter.title,
          tanggal: p.frontmatter.tanggal,
          description: p.frontmatter.description ?? '',
          sampul: p.frontmatter.sampul,
          foto: daftar
            .filter((f: unknown): f is { gambar?: string; keterangan?: string } =>
              !!f && typeof f === 'object' && typeof (f as { gambar?: unknown }).gambar === 'string'
            )
            .map((f: { gambar?: string; keterangan?: string }, i: number) => ({
              gambar: f.gambar as string,
              keterangan: f.keterangan?.trim() || `Foto ${i + 1} — ${p.frontmatter.title}`,
            })),
        }
      })
  },
})
