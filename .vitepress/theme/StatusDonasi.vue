<script setup>
/**
 * StatusDonasi — kartu gambar 9:16 untuk status WhatsApp.
 * Dirender di luar layar, dikonversi ke PNG oleh ProgramDonasi.vue.
 * Warna dipatok light-theme (bukan CSS var) agar hasil gambar konsisten
 * di mode gelap maupun terang.
 */
defineProps({
  program: { type: Object, required: true },
})

function angka(v) {
  // Terima "65000000" maupun "Rp 65.000.000" — sama dengan ProgramDonasi.
  const n = parseInt(String(v ?? '').replace(/[^0-9-]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

function rupiah(v) {
  return 'Rp ' + Number(v).toLocaleString('id-ID')
}

function persen(p) {
  const target = angka(p.target)
  if (target <= 0) return 0
  return Math.min(Math.round((angka(p.terkumpul) / target) * 100), 100)
}
</script>

<template>
  <div class="sd-layer" aria-hidden="true">
    <div class="sd-status">
      <header class="sd-head">
        <div class="sd-brand">Masjid Al-Birru</div>
        <div class="sd-motif"></div>
      </header>

      <div class="sd-body">
        <p class="sd-label">Program Donasi</p>
        <h4 class="sd-nama">{{ program.nama }}</h4>
        <p v-if="program.deskripsi" class="sd-deskripsi">{{ program.deskripsi }}</p>

        <div class="sd-fokus">
          <span class="sd-persen">{{ persen(program) }}%</span>
          <span class="sd-persen-caption">terkumpul</span>
        </div>

        <div class="sd-bar">
          <div
            class="sd-bar-fill"
            :style="{ width: persen(program) + '%' }"
          ></div>
        </div>

        <div class="sd-angka">
          <span class="sd-terkumpul">{{ rupiah(angka(program.terkumpul)) }}</span>
          <span class="sd-target">dari {{ rupiah(angka(program.target)) }}</span>
        </div>

        <p v-if="program.deadline" class="sd-deadline">Sampai {{ program.deadline }}</p>
      </div>

      <footer class="sd-foot">
        <p class="sd-ajakan">Salurkan donasi Anda</p>
        <p class="sd-situs">masjid-albirru.id</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Pembawa di luar layar; ukuran 540x960, diekspor @2x jadi 1080x1920 */
.sd-layer {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 540px;
  pointer-events: none;
}

.sd-status {
  width: 540px;
  height: 960px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 56px 52px;
  background: #0d3d45;
  color: #ffffff;
  font-family: 'Lato', 'Segoe UI', sans-serif;
  text-align: left;
}

.sd-head {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sd-brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Garis hairline emas: identity motif dari DESIGN.md */
.sd-motif {
  width: 56px;
  height: 2px;
  background: #e8c97a;
}

.sd-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  min-height: 0;
}

.sd-label {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #33bdd4;
}

.sd-nama {
  margin: 0;
  font-size: 38px;
  font-weight: 700;
  line-height: 1.25;
}

.sd-deskripsi {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Fokus tunggal kartu: persentase capaian */
.sd-fokus {
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sd-persen {
  font-size: 104px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.sd-persen-caption {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.78);
}

.sd-bar {
  height: 10px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.18);
  overflow: hidden;
}

.sd-bar-fill {
  height: 100%;
  border-radius: 99px;
  background: #33bdd4;
}

.sd-angka {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.sd-terkumpul {
  font-size: 26px;
  font-weight: 700;
}

.sd-target {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.78);
}

.sd-deadline {
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.78);
}

.sd-foot {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.sd-ajakan {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.78);
}

.sd-situs {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #33bdd4;
}
</style>
