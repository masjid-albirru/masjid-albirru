// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Layout from './Layout.vue'
import BlogList from './BlogList.vue'
import JadwalSholat from './JadwalSholat.vue'
import KeuanganSummary from './KeuanganSummary.vue'
import KeuanganSheets from './KeuanganSheets.vue'
import KeuanganRingkas from './KeuanganRingkas.vue'
import DonasiQRIS from './DonasiQRIS.vue'
import PengumumanBanner from './PengumumanBanner.vue'
import ShareButton from './ShareButton.vue'
import AcaraList from './AcaraList.vue'
import JadwalKhatib from './JadwalKhatib.vue'
import DaftarQurban from './DaftarQurban.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('BlogList', BlogList)
    app.component('JadwalSholat', JadwalSholat)
    app.component('KeuanganSummary', KeuanganSummary)
    app.component('KeuanganSheets', KeuanganSheets)
    app.component('KeuanganRingkas', KeuanganRingkas)
    app.component('DonasiQRIS', DonasiQRIS)
    app.component('PengumumanBanner', PengumumanBanner)
    app.component('ShareButton', ShareButton)
    app.component('AcaraList', AcaraList)
    app.component('JadwalKhatib', JadwalKhatib)
    app.component('DaftarQurban', DaftarQurban)
  },
}