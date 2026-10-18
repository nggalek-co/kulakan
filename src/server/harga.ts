/**
 * Scraper live SISKAPERBAPO (Disperindag Jawa Timur).
 *
 * Halaman tabel memuat isinya lewat AJAX ke `POST /harga/tabel.nodesign`,
 * jadi kita panggil endpoint itu langsung lalu parsing HTML-nya menjadi JSON.
 *
 * - Harga rata-rata kabupaten diambil dari permintaan tanpa filter pasar.
 * - Harga per pasar diambil dengan mengirim `pasar=<psr_id>`.
 * - Jika tanggal hari ini belum berisi data (harga masih 0), otomatis mundur
 *   ke tanggal terakhir yang memiliki data.
 *
 * Semua kode di file ini dijalankan di server.
 */
import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { DAY, cacheHeaders, caches, setCacheHeaders } from '@netlify/cache'

import {
  DEFAULT_KABKOTA,
  DEFAULT_KABKOTA_LABEL,
  SISKAPERBAPO_BASE,
  type CommodityItem,
  type LiveCategory,
  type LiveMarket,
  type LivePriceData,
  type PriceStatus,
} from '@/data/marketData'
import { seedTrenggalek } from '@/data/seedTrenggalek'

interface RawCommodity {
  name: string
  unit: string
  yesterday: number | null
  current: number | null
  change: number
  percent: number
  /** Label kategori asal; `null` untuk komoditas tanpa grup (mis. Jagung Pipilan). */
  group: string | null
}

interface RawMarket {
  psr_id: number
  psr_nama: string
}

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const DEFAULT_TRENGGALEK_MARKETS: LiveMarket[] = [
  { id: '96', name: 'Pasar Basah' },
  { id: '137', name: 'Pasar Subuh' },
]

function getDefaultMarkets(kabkota: string): LiveMarket[] {
  if (kabkota === DEFAULT_KABKOTA) {
    return DEFAULT_TRENGGALEK_MARKETS
  }
  return []
}

const NETLIFY_CACHE_NAME = 'kulakan-price-data'
const MEMORY_CACHE_TTL_MS = 60 * 60 * 1000 // 1 jam di memori runtime

const memoryCache = new Map<string, { at: number; data: LivePriceData }>()
const CACHE_TTL_MS = 5 * 60 * 1000
const tableCache = new Map<string, { at: number; html: string }>()

const isNetlify = typeof process !== 'undefined' && process.env.NETLIFY === 'true'

async function getDurableCache(kabkota: string): Promise<LivePriceData | null> {
  if (!isNetlify) return null
  try {
    const cache = await caches.open(NETLIFY_CACHE_NAME)
    const match = await cache.match(`https://kulakan.internal/live-data/${kabkota}`)
    if (match) {
      return (await match.json()) as LivePriceData
    }
  } catch (error) {
    console.warn('[harga] Gagal membaca durable cache:', error)
  }
  return null
}

async function putDurableCache(kabkota: string, data: LivePriceData): Promise<void> {
  if (!isNetlify) return
  try {
    const cache = await caches.open(NETLIFY_CACHE_NAME)
    const key = `https://kulakan.internal/live-data/${kabkota}`
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const cacheable = setCacheHeaders(response, {
      ttl: DAY,
      swr: DAY,
      durable: true,
      tags: [`kulakan-${kabkota}`],
    })
    await cache.put(key, cacheable)
  } catch (error) {
    console.warn('[harga] Gagal menyimpan ke durable cache:', error)
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ')
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&ndash;/gi, '-')
}

function cleanText(html: string): string {
  return decodeEntities(stripTags(html)).replace(/\s+/g, ' ').trim()
}

/** `14.200` -> 14200, `-` -> null. */
function toNumber(raw: string | undefined): number | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed === '-' || trimmed === '0') {
    return trimmed === '0' ? 0 : null
  }
  const normalized = trimmed.replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

/** `0,00%` -> 0, `-` -> 0. */
function toPercent(raw: string | undefined): number {
  if (!raw) return 0
  const normalized = raw.replace(/%/g, '').replace(/\./g, '').replace(',', '.').trim()
  const value = Number(normalized)
  return Number.isFinite(value) ? value : 0
}

const ACRONYMS = new Set(['sni', 'npk', 'kcl', 'sp', 'za', 'kg', 'mm', 'cm', 'bkp'])

function titleCase(raw: string): string {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      const bare = word.replace(/[()]/g, '')
      if (ACRONYMS.has(bare)) return word.toUpperCase()
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function jakartaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function shiftDate(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function postTable(kabkota: string, tanggal: string, pasar = ''): Promise<string> {
  const body = new URLSearchParams({ tanggal, kabkota, pasar })
  const response = await fetch(`${SISKAPERBAPO_BASE}/harga/tabel.nodesign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'text/html, */*; q=0.01',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      Origin: SISKAPERBAPO_BASE,
      Referer: `${SISKAPERBAPO_BASE}/harga/tabel`,
      'User-Agent': BROWSER_USER_AGENT,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`SISKAPERBAPO membalas ${response.status}`)
  }

  return response.text()
}

/** Mengambil tabel dengan cache singkat agar navigasi tidak menembak sumber terus. */
async function fetchTable(kabkota: string, tanggal: string, pasar = ''): Promise<string> {
  const key = `${kabkota}|${tanggal}|${pasar}`
  const cached = tableCache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.html
  }
  const html = await postTable(kabkota, tanggal, pasar)
  tableCache.set(key, { at: Date.now(), html })
  return html
}

function parseCommodities(html: string): RawCommodity[] {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  const commodities: RawCommodity[] = []
  let group: string | null = null

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      cleanText(cell[1]),
    )
    if (cells.length < 5) continue

    const code = cells[0] ?? ''
    const name = cells[1] ?? ''
    if (!name) continue

    if (name.startsWith('-')) {
      // Baris komoditas, mis. `- Beras Premium`.
      const topLevel = /^\d+$/.test(code)
      commodities.push({
        name: name.replace(/^-\s*/, '').trim(),
        unit: cells[2] ?? '',
        yesterday: toNumber(cells[3]),
        current: toNumber(cells[4]),
        change: toNumber(cells[5]) ?? 0,
        percent: toPercent(cells[6]),
        group: topLevel ? null : group,
      })
      continue
    }

    if (/^\d+$/.test(code)) {
      // Baris judul kategori, mis. `01 BERAS`.
      group = titleCase(name)
    }
  }

  return commodities
}

function hasPrices(html: string): boolean {
  return parseCommodities(html).some((item) => (item.current ?? 0) > 0)
}

async function fetchMarkets(kabkota: string): Promise<LiveMarket[]> {
  try {
    const response = await fetch(`${SISKAPERBAPO_BASE}/harga/pasar.json/${kabkota}`, {
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: `${SISKAPERBAPO_BASE}/harga/tabel`,
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      console.warn(`[harga] Gagal memuat daftar pasar (${response.status}), menggunakan pasar default`)
      return getDefaultMarkets(kabkota)
    }

    const raw = (await response.json()) as RawMarket[]
    const list = raw
      .filter((market) => market.psr_nama)
      .map((market) => ({ id: String(market.psr_id), name: market.psr_nama }))

    return list.length > 0 ? list : getDefaultMarkets(kabkota)
  } catch (error) {
    console.warn('[harga] Gagal memuat daftar pasar, menggunakan pasar default:', error)
    return getDefaultMarkets(kabkota)
  }
}

/** Cari tanggal terakhir (maks. 7 hari ke belakang) yang punya data harga. */
async function resolveTanggal(kabkota: string): Promise<string> {
  const today = jakartaToday()
  const candidates = Array.from({ length: 7 }, (_, index) => shiftDate(today, -index))

  const results = await Promise.all(
    candidates.map(async (tanggal) => {
      try {
        const html = await fetchTable(kabkota, tanggal)
        return { tanggal, html }
      } catch {
        return { tanggal, html: '' }
      }
    }),
  )

  // Pertahankan urutan dari terbaru ke terlama.
  for (const result of results) {
    if (result.html && hasPrices(result.html)) return result.tanggal
  }

  return today
}

function statusFromChange(changeRp: number): PriceStatus {
  if (changeRp > 0) return 'naik'
  if (changeRp < 0) return 'turun'
  return 'stabil'
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100
}

function buildPriceMap(rows: RawCommodity[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) {
    if ((row.current ?? 0) > 0) map.set(row.name, row.current as number)
  }
  return map
}

async function scrapeLiveData(kabkota: string): Promise<LivePriceData> {
  const [markets, tanggal] = await Promise.all([fetchMarkets(kabkota), resolveTanggal(kabkota)])

  const [aggregateHtml, ...marketHtml] = await Promise.all([
    fetchTable(kabkota, tanggal),
    ...markets.map((market) => fetchTable(kabkota, tanggal, market.id)),
  ])

  const aggregateRows = parseCommodities(aggregateHtml)
  const priceMaps = marketHtml.map((html) => buildPriceMap(parseCommodities(html)))

  const commodities: CommodityItem[] = []
  const categoryCounts = new Map<string, { label: string; count: number }>()
  const usedIds = new Set<string>()

  for (const row of aggregateRows) {
    // Harga per pasar untuk komoditas ini.
    const marketPrices: Record<string, number> = {}
    markets.forEach((market, index) => {
      const price = priceMaps[index]?.get(row.name)
      if (price && price > 0) marketPrices[market.id] = price
    })

    const marketValues = Object.values(marketPrices)
    const currentFromMarkets =
      marketValues.length > 0
        ? marketValues.reduce((total, value) => total + value, 0) / marketValues.length
        : 0

    const currentPrice = Math.round(row.current && row.current > 0 ? row.current : currentFromMarkets)

    // Lewati komoditas yang tidak punya harga sama sekali (mis. semen/pupuk kosong).
    if (currentPrice <= 0) continue

    const yesterdayRaw = row.yesterday && row.yesterday > 0 ? row.yesterday : currentPrice
    const yesterdayPrice = Math.round(yesterdayRaw)
    const changeRp = currentPrice - yesterdayPrice
    const changePercent =
      yesterdayPrice > 0 ? roundPercent((changeRp / yesterdayPrice) * 100) : 0

    const categoryLabel = row.group ?? 'Lainnya'
    const category = row.group ? slugify(row.group) : 'lainnya'

    let id = slugify(row.name) || `komoditas-${commodities.length + 1}`
    while (usedIds.has(id)) id = `${id}-${commodities.length + 1}`
    usedIds.add(id)

    const existing = categoryCounts.get(category)
    categoryCounts.set(category, {
      label: categoryLabel,
      count: (existing?.count ?? 0) + 1,
    })

    commodities.push({
      id,
      name: row.name,
      category,
      categoryLabel,
      unit: row.unit || '-',
      currentPrice,
      yesterdayPrice,
      changeRp,
      changePercent,
      status: statusFromChange(changeRp),
      marketPrices,
    })
  }

  const categories: LiveCategory[] = [...categoryCounts.entries()].map(([id, value]) => ({
    id,
    label: value.label,
    count: value.count,
  }))
  // Kelompok "Lainnya" selalu di akhir.
  categories.sort((a, b) => Number(a.id === 'lainnya') - Number(b.id === 'lainnya'))

  return {
    kabkota,
    kabkotaLabel: kabkota === DEFAULT_KABKOTA ? DEFAULT_KABKOTA_LABEL : kabkota,
    tanggal,
    fetchedAt: new Date().toISOString(),
    sourceUrl: `${SISKAPERBAPO_BASE}/harga/tabel?kabkota=${kabkota}&tanggal=${tanggal}`,
    markets,
    categories,
    commodities,
  }
}

async function loadLiveData(kabkota: string): Promise<LivePriceData> {
  // 1. Cek memory cache runtime
  const mem = memoryCache.get(kabkota)
  if (mem && Date.now() - mem.at < MEMORY_CACHE_TTL_MS) {
    return mem.data
  }

  // 2. Cek Netlify durable cache (tersimpan hingga 24 jam di edge)
  const durableData = await getDurableCache(kabkota)
  if (durableData && durableData.commodities && durableData.commodities.length > 0) {
    memoryCache.set(kabkota, { at: Date.now(), data: durableData })
    return durableData
  }

  // 3. Scraping langsung ke SISKAPERBAPO
  try {
    const liveData = await scrapeLiveData(kabkota)
    if (liveData.commodities && liveData.commodities.length > 0) {
      memoryCache.set(kabkota, { at: Date.now(), data: liveData })
      await putDurableCache(kabkota, liveData)
      return liveData
    }
  } catch (error) {
    console.warn('[harga] Gagal scrape live data SISKAPERBAPO:', error)
  }

  // 4. Fallback jika scraper terhambat (misal 403 / timeout / offline)
  if (mem && mem.data.commodities && mem.data.commodities.length > 0) {
    return mem.data
  }
  if (durableData && durableData.commodities && durableData.commodities.length > 0) {
    return durableData
  }
  if (kabkota === DEFAULT_KABKOTA) {
    return seedTrenggalek
  }

  throw new Error(`Data harga untuk ${kabkota} tidak tersedia saat ini.`)
}

export const getLiveMarketData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<LivePriceData> => {
    try {
      const headers = cacheHeaders({
        ttl: DAY,
        swr: DAY,
        durable: true,
        tags: [`kulakan-api-${DEFAULT_KABKOTA}`],
      })
      for (const [name, value] of Object.entries(headers)) {
        setResponseHeader(name, value)
      }
    } catch {
      // Abaikan jika dipanggil di luar konteks HTTP request
    }
    return loadLiveData(DEFAULT_KABKOTA)
  },
)
