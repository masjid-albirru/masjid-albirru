// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Layout from './Layout.vue'
import BlogList from './BlogList.vue'
import JadwalSholat from './JadwalSholat.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('BlogList', BlogList)
    app.component('JadwalSholat', JadwalSholat)
  },
}