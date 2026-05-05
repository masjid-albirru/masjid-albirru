import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Masjid Al-Birru',
  description: 'Website Resmi Masjid Al-Birru - Informasi, Berita, Acara & Laporan Keuangan',
  lang: 'id-ID',
  
  head: [
    ['link', { rel: 'icon', href: '/icons/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }],
    ['meta', { name: 'theme-color', content: '#1a6b3a' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'id_ID' }],
    ['meta', { property: 'og:site_name', content: 'Masjid Al-Birru' }],
  ],

  themeConfig: {
    logo: '/icons/masjid-logo.svg',
    siteTitle: 'Masjid Al-Birru',

    nav: [
      { text: '🏠 Beranda', link: '/' },
      { text: '📰 Berita & Blog', link: '/blog/' },
      { text: '📅 Acara', link: '/acara/' },
      {
        text: '💰 Keuangan',
        items: [
          { text: 'Laporan Bulanan', link: '/keuangan/' },
          { text: 'Laporan Tahunan', link: '/keuangan/tahunan' },
          { text: 'Program Donasi', link: '/keuangan/donasi' },
        ]
      },
      {
        text: '🕌 Masjid',
        items: [
          { text: 'Tentang Kami', link: '/tentang/' },
          { text: 'Pengurus', link: '/tentang/pengurus' },
          { text: 'Fasilitas', link: '/tentang/fasilitas' },
          { text: 'Galeri', link: '/galeri/' },
        ]
      },
      { text: '📞 Kontak', link: '/tentang/kontak' },
    ],

    sidebar: {
      '/blog/': [
        {
          text: '📰 Blog & Berita',
          items: [
            { text: 'Semua Artikel', link: '/blog/' },
            { text: 'Kajian Islam', link: '/blog/kajian/' },
            { text: 'Kegiatan Masjid', link: '/blog/kegiatan/' },
            { text: 'Pengumuman', link: '/blog/pengumuman/' },
          ]
        }
      ],
      '/acara/': [
        {
          text: '📅 Acara & Kegiatan',
          items: [
            { text: 'Semua Acara', link: '/acara/' },
            { text: 'Jadwal Sholat Jum\'at', link: '/acara/jumat' },
            { text: 'Kajian Rutin', link: '/acara/kajian-rutin' },
            { text: 'Ramadan', link: '/acara/ramadan' },
            { text: 'Hari Besar Islam', link: '/acara/hari-besar' },
          ]
        }
      ],
      '/keuangan/': [
        {
          text: '💰 Laporan Keuangan',
          items: [
            { text: 'Ringkasan', link: '/keuangan/' },
            { text: 'Laporan Bulanan', collapsed: false, items: [
              { text: '2025', collapsed: true, items: [
                { text: 'Januari 2025', link: '/keuangan/2025/januari' },
                { text: 'Februari 2025', link: '/keuangan/2025/februari' },
                { text: 'Maret 2025', link: '/keuangan/2025/maret' },
                { text: 'April 2025', link: '/keuangan/2025/april' },
              ]}
            ]},
            { text: 'Laporan Tahunan', link: '/keuangan/tahunan' },
            { text: 'Program Donasi', link: '/keuangan/donasi' },
          ]
        }
      ],
      '/tentang/': [
        {
          text: '🕌 Tentang Masjid',
          items: [
            { text: 'Profil Masjid', link: '/tentang/' },
            { text: 'Sejarah', link: '/tentang/sejarah' },
            { text: 'Visi & Misi', link: '/tentang/visi-misi' },
            { text: 'Struktur Pengurus', link: '/tentang/pengurus' },
            { text: 'Fasilitas', link: '/tentang/fasilitas' },
            { text: 'Kontak & Lokasi', link: '/tentang/kontak' },
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'youtube', link: 'https://youtube.com/@masjid-al-ikhlas' },
      { icon: 'instagram', link: 'https://instagram.com/masjidalikhas' },
      { icon: {
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
        }, link: 'https://wa.me/6281234567890' }
    ],

    footer: {
      message: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم',
      copyright: `© ${new Date().getFullYear()} Masjid Al-Birru. Semua hak dilindungi.`
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'Cari...',
                buttonAriaLabel: 'Cari artikel'
              },
              modal: {
                noResultsText: 'Tidak ada hasil untuk',
                resetButtonTitle: 'Hapus pencarian',
                footer: {
                  selectText: 'untuk memilih',
                  navigateText: 'untuk navigasi',
                  closeText: 'untuk menutup'
                }
              }
            }
          }
        }
      }
    },

    editLink: {
      pattern: 'https://github.com/USERNAME/masjid-al-ikhlas/edit/main/docs/:path',
      text: 'Edit halaman ini di GitHub'
    },

    lastUpdated: {
      text: 'Terakhir diperbarui',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'short'
      }
    },

    docFooter: {
      prev: '← Sebelumnya',
      next: 'Selanjutnya →'
    },

    outline: {
      label: 'Daftar Isi',
      level: [2, 3]
    },

    returnToTopLabel: 'Kembali ke atas',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Tema',
    lightModeSwitchTitle: 'Mode Terang',
    darkModeSwitchTitle: 'Mode Gelap',
  },

  srcDir: 'docs',
  
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: false,
  },

  ignoreDeadLinks: true,
})
