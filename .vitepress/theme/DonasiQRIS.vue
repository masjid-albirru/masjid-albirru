<script setup>
import { onMounted, ref } from 'vue'
import { QrCode, Landmark, Copy, Check, MessageCircle } from 'lucide-vue-next'

const QRIS_STRING = '00020101021126640017ID.CO.BANKBSI.WWW0118936004510000097631021000004947680303UMI51440014ID.CO.QRIS.WWW0215ID10221742528100303UMI5204866153033605802ID5912DKM AL BIRRU6005DEPOK61051651662070703A0163041E63'

const REKENING = [
  { bank: 'Bank Syariah Indonesia (BSI)', no: '7192880558', atas: 'DKM Al Birru'},
]

const WA_NUMBER = '6281399928319'
// ============================================================

const qrLoaded = ref(false)
const qrError = ref(false)
const copied = ref('')

onMounted(async () => {
  // Load QR code library dari CDN
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js')
  generateQR()
})

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = () => { qrError.value = true; resolve() }
    document.head.appendChild(s)
  })
}

function generateQR() {
  try {
    const el = document.getElementById('qris-canvas')
    if (!el || !window.QRCode) { qrError.value = true; return }
    new window.QRCode(el, {
      text: QRIS_STRING,
      width: 220,
      height: 220,
      colorDark: '#0f6b78',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M,
    })
    qrLoaded.value = true
  } catch (e) {
    qrError.value = true
  }
}

async function copyRek(no) {
  const clean = no.replace(/\s/g, '')
  await navigator.clipboard.writeText(clean)
  copied.value = no
  setTimeout(() => { copied.value = '' }, 2000)
}
</script>

<template>
  <div class="donasi-wrap">

    <!-- QRIS Section -->
    <div class="qris-section">
      <div class="qris-left">
        <h3 class="qris-title">
          <QrCode :size="18" />
          Scan QRIS
        </h3>
        <p class="qris-desc">Scan dengan aplikasi pembayaran atau m-Banking pilihan Anda.</p>
        <div class="qris-box">
          <div v-if="!qrLoaded && !qrError" class="qr-loading">
            <span class="spinner"></span> Memuat QR...
          </div>
          <div v-if="qrError" class="qr-error">
            Gagal memuat QR Code
          </div>
          <div id="qris-canvas" :style="{ display: qrLoaded ? 'block' : 'none' }"></div>
        </div>
        <p class="qris-note">Mendukung semua dompet digital dan m-Banking</p>
      </div>

      <!-- Rekening -->
      <div class="qris-right">
        <h3 class="qris-title">
          <Landmark :size="18" />
          Transfer Bank
        </h3>
        <div class="rek-list">
          <div v-for="rek in REKENING" :key="rek.no" class="rek-card">
            <div class="rek-bank">{{ rek.bank }}</div>
            <div class="rek-no">
              {{ rek.no }}
              <button class="copy-btn" @click="copyRek(rek.no)">
                <Check v-if="copied === rek.no" :size="12" />
                <Copy v-else :size="12" />
                {{ copied === rek.no ? 'Tersalin' : 'Salin' }}
              </button>
            </div>
            <div class="rek-atas">a.n. {{ rek.atas }}</div>
          </div>
        </div>
        <a :href="`https://wa.me/${WA_NUMBER}`" target="_blank" class="wa-btn">
          <MessageCircle :size="15" />
          Konfirmasi via WhatsApp
        </a>
      </div>
    </div>

  </div>
</template>

<style scoped>
.donasi-wrap {
  margin: 1.5rem 0;
}

/* ===== QRIS ===== */
.qris-section {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2rem;
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  padding: 1.75rem;
  margin-bottom: 2rem;
  border: 1px solid var(--vp-c-divider);
}

.qris-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--teal-700);
}

.qris-title svg {
  color: var(--teal-600);
}

.qris-desc {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  margin: 0 0 1rem;
  max-width: 220px;
}

.qris-box {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  min-width: 220px;
  min-height: 220px;
}

.qris-note {
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  margin: 0.5rem 0 0;
  text-align: center;
}

.qr-loading,
.qr-error {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  text-align: center;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 6px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Rekening */
.rek-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 1rem;
}

.rek-card {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.rek-bank {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
}

.rek-no {
  font-size: 1.1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rek-atas {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  margin-top: 2px;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.copy-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.wa-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #25d366;
  color: #fff;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}

.wa-btn:hover { opacity: 0.85; }

/* Mobile */
@media (max-width: 640px) {
  .qris-section {
    grid-template-columns: 1fr;
  }
  .qris-box {
    margin: 0 auto;
  }
}
</style>