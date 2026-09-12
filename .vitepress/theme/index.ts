// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Layout from './Layout.vue'
import BlogList from './BlogList.vue'
import JadwalSholat from './JadwalSholat.vue'
import KeuanganSummary from './KeuanganSummary.vue'
import KeuanganSheets from './KeuanganSheets.vue'
import KeuanganRingkas from './KeuanganRingkas.vue'
import KeuanganSegeraHadir from './KeuanganSegeraHadir.vue'
import DonasiQRIS from './DonasiQRIS.vue'
import ProgramDonasi from './ProgramDonasi.vue'
import TombolDonasi from './TombolDonasi.vue'
import PengumumanBanner from './PengumumanBanner.vue'
import ShareButton from './ShareButton.vue'
import AcaraList from './AcaraList.vue'
import JadwalKhatib from './JadwalKhatib.vue'
import DaftarQurban from './DaftarQurban.vue'
import KegiatanRutin from './KegiatanRutin.vue'
import JadwalImam from './JadwalImam.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('BlogList', BlogList)
    app.component('JadwalSholat', JadwalSholat)
    app.component('KeuanganSummary', KeuanganSummary)
    app.component('KeuanganSheets', KeuanganSheets)
    app.component('KeuanganRingkas', KeuanganRingkas)
    app.component('KeuanganSegeraHadir', KeuanganSegeraHadir)
    app.component('DonasiQRIS', DonasiQRIS)
    app.component('ProgramDonasi', ProgramDonasi)
    app.component('TombolDonasi', TombolDonasi)
    app.component('PengumumanBanner', PengumumanBanner)
    app.component('ShareButton', ShareButton)
    app.component('AcaraList', AcaraList)
    app.component('JadwalKhatib', JadwalKhatib)
    app.component('DaftarQurban', DaftarQurban)
    app.component('KegiatanRutin', KegiatanRutin)
    app.component('JadwalImam', JadwalImam)
  },
}