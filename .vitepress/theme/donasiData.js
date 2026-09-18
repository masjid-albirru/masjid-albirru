/**
 * Data donasi bersama — dipakai DonasiQRIS.vue dan StatusDonasi.vue.
 * Sumber tunggal agar string QRIS / rekening tidak berbeda antar tempat.
 */

// Payload EMV QRIS statis (dari merchant QRIS DKM Al-Birru).
export const QRIS_STRING =
  '00020101021126640017ID.CO.BANKBSI.WWW0118936004510000097631021000004947680303UMI51440014ID.CO.QRIS.WWW0215ID10221742528100303UMI5204866153033605802ID5912DKM AL BIRRU6005DEPOK61051651662070703A0163041E63'

export const REKENING = [
  { bank: 'Bank Syariah Indonesia (BSI)', no: '7192880558', atas: 'DKM Al Birru' },
]

export const WA_NUMBER = '6281399928319'
