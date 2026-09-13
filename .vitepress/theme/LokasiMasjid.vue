<script setup>
import { MapPin, Navigation } from 'lucide-vue-next'

const ALAMAT = 'Jl. Sirnagalih No.21, Cinangka, Kec. Sawangan, Kota Depok, Jawa Barat 16516'
const QUERY = encodeURIComponent('Masjid Al-Birru, Jl. Sirnagalih No.21, Cinangka, Sawangan, Depok')
const LINK_ARAH = 'https://maps.app.goo.gl/irpLduEHRHQXqvoKA'
</script>

<template>
  <div class="lokasi-masjid">
    <div class="lokasi-peta">
      <iframe
        :src="`https://maps.google.com/maps?q=${QUERY}&z=16&output=embed`"
        title="Peta lokasi Masjid Al-Birru"
        loading="lazy"
        allowfullscreen
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>

    <div class="lokasi-info">
      <div class="lokasi-alamat">
        <MapPin class="lokasi-ikon" aria-hidden="true" />
        <p><strong>Masjid Al-Birru</strong><br />{{ ALAMAT }}</p>
      </div>
      <a class="lokasi-arah" :href="LINK_ARAH" target="_blank" rel="noopener">
        <Navigation class="lokasi-ikon" aria-hidden="true" />
        Petunjuk Arah
      </a>
    </div>
  </div>
</template>

<style scoped>
.lokasi-masjid {
  background: var(--warm-bg);
  border: 1px solid var(--warm-border);
  border-radius: 12px;
  overflow: hidden;
  margin: 1.5rem 0;
}

.lokasi-peta iframe {
  display: block;
  width: 100%;
  height: 340px;
  border: 0;
}

.lokasi-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--warm-border);
  flex-wrap: wrap;
}

.lokasi-alamat {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  min-width: 0;
}

.lokasi-alamat p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--vp-c-text-1);
}

.lokasi-ikon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 3px;
  color: var(--teal-700);
}

.dark .lokasi-ikon {
  color: var(--teal-400);
}

.lokasi-arah {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--teal-700);
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  padding: 0.6rem 1.1rem;
  border-radius: 10px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.lokasi-arah:hover {
  background: var(--teal-600);
}

.dark .lokasi-arah {
  background: var(--teal-700);
}

.dark .lokasi-arah:hover {
  background: var(--teal-600);
}

.lokasi-arah .lokasi-ikon {
  margin-top: 0;
  color: currentColor;
}

@media (max-width: 640px) {
  .lokasi-peta iframe {
    height: 260px;
  }

  .lokasi-info {
    flex-direction: column;
    align-items: stretch;
  }

  .lokasi-arah {
    justify-content: center;
  }
}
</style>
