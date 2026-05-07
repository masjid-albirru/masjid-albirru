// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Layout from './Layout.vue'
import BlogList from './BlogList.vue'
import JadwalSholat from './JadwalSholat.vue'
import KeuanganSummary from './KeuanganSummary.vue'
import DonasiQRIS from './DonasiQRIS.vue'
import PengumumanBanner from './PengumumanBanner.vue'
import ShareButton from './ShareButton.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('BlogList', BlogList)
    app.component('JadwalSholat', JadwalSholat)
    app.component('KeuanganSummary', KeuanganSummary)
    app.component('DonasiQRIS', DonasiQRIS)
    app.component('PengumumanBanner', PengumumanBanner)
    app.component('ShareButton', ShareButton)
  },
}