/**
 * Kontrak data harga pasar Kulakan.
 *
 * Seluruh data harga diambil langsung (live) dari SISKAPERBAPO Disperindag
 * Jawa Timur saat halaman dibuka. File ini hanya berisi tipe dan konstanta
 * yang dipakai bersama oleh server (scraper) dan UI.
 *
 * Sumber: https://siskaperbapo.jatimprov.go.id/harga/tabel
 */

export const SISKAPERBAPO_BASE = 'https://siskaperbapo.jatimprov.go.id'
export const DEFAULT_KABKOTA = 'trenggalekkab'
export const DEFAULT_KABKOTA_LABEL = 'Kabupaten Trenggalek'

export type PriceStatus = 'naik' | 'turun' | 'stabil'

export interface LiveMarket {
  /** ID pasar di SISKAPERBAPO (psr_id). */
  id: string
  name: string
}

export interface LiveCategory {
  id: string
  label: string
  count: number
}

export interface CommodityItem {
  id: string
  name: string
  /** Slug kategori, mis. `beras`, `cabe`. */
  category: string
  categoryLabel: string
  unit: string
  /** Harga rata-rata kabupaten (harga sekarang). */
  currentPrice: number
  /** Harga rata-rata kabupaten kemarin. */
  yesterdayPrice: number
  changeRp: number
  changePercent: number
  status: PriceStatus
  /** Harga per pasar, hanya berisi pasar yang memiliki harga (> 0). */
  marketPrices: Record<string, number>
}

export interface LivePriceData {
  /** Cadangan ditandai agar tidak disajikan sebagai pembaruan live. */
  freshness?: 'live' | 'stale' | 'seed'
  kabkota: string
  kabkotaLabel: string
  /** Tanggal data yang ditampilkan, format `YYYY-MM-DD`. */
  tanggal: string
  /** Waktu pengambilan data dari sumber, format ISO. */
  fetchedAt: string
  /** URL sumber yang bisa dibuka pengguna. */
  sourceUrl: string
  markets: LiveMarket[]
  categories: LiveCategory[]
  commodities: CommodityItem[]
}

/** Mengubah `2026-10-17` menjadi `17 Oktober 2026`. */
export function formatTanggalPanjang(tanggal: string): string {
  const date = new Date(`${tanggal}T00:00:00+07:00`)
  if (Number.isNaN(date.getTime())) return tanggal
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}
