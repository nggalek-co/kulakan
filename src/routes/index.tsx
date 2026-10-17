import { KulakanLogo, KulakanMark } from '@/components/KulakanLogo'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ClockIcon,
  LayoutGridIcon,
  ListIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/siteplane/components/badge'
import { Button } from '@/siteplane/components/button'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/siteplane/components/card'
import { Input } from '@/siteplane/components/input'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/siteplane/components/select'
import { Separator } from '@/siteplane/components/separator'
import { Spinner } from '@/siteplane/components/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type SortDescriptor,
} from '@/siteplane/components/table'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/siteplane/components/tabs'

import {
  SISKAPERBAPO_BASE,
  formatTanggalPanjang,
  type CommodityItem,
  type LiveCategory,
  type LiveMarket,
  type LivePriceData,
} from '@/data/marketData'
import { getLiveMarketData } from '@/server/harga'

export interface KulakanSearchParams {
  tab?: 'daftar-harga' | 'pasar-termurah' | 'kalkulator' | 'info-pasar'
  market?: string
  category?: string
  status?: 'all' | 'naik' | 'turun' | 'stabil'
  q?: string
  view?: 'card' | 'table'
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): KulakanSearchParams => {
    const validTabs: Array<KulakanSearchParams['tab']> = [
      'daftar-harga',
      'pasar-termurah',
      'kalkulator',
      'info-pasar',
    ]
    const validStatuses: Array<KulakanSearchParams['status']> = [
      'all',
      'naik',
      'turun',
      'stabil',
    ]

    return {
      tab:
        typeof search.tab === 'string' &&
          validTabs.includes(search.tab as KulakanSearchParams['tab'])
          ? (search.tab as KulakanSearchParams['tab'])
          : undefined,
      market:
        typeof search.market === 'string' && search.market !== 'all'
          ? search.market
          : undefined,
      category:
        typeof search.category === 'string' && search.category !== 'all'
          ? search.category
          : undefined,
      status:
        typeof search.status === 'string' &&
          validStatuses.includes(search.status as KulakanSearchParams['status']) &&
          search.status !== 'all'
          ? (search.status as KulakanSearchParams['status'])
          : undefined,
      q:
        typeof search.q === 'string' && search.q.trim() !== ''
          ? search.q.trim()
          : undefined,
      view: search.view === 'table' ? 'table' : undefined,
    }
  },
  component: KulakanHomePage,
})

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

/** Rentang harga antar pasar; jatuh ke harga rata-rata bila pasar kosong. */
function priceRange(
  marketPrices: Record<string, number>,
  fallback: number,
): [number, number] {
  const values = Object.values(marketPrices).filter((value) => value > 0)
  if (values.length === 0) return [fallback, fallback]
  return [Math.min(...values), Math.max(...values)]
}

function KulakanShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 text-foreground dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-xs dark:bg-slate-900/40 dark:border-slate-800">
        {children}
      </div>
    </div>
  )
}

function KulakanPendingState() {
  return (
    <KulakanShell>
      <Spinner className="mx-auto size-8 animate-spin text-emerald-700" />
      <h1 className="mt-4 text-lg font-bold">Memuat harga pasar...</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Mengambil data terbaru dari SISKAPERBAPO Disperindag Jawa Timur.
      </p>
    </KulakanShell>
  )
}

function KulakanErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return (
    <KulakanShell>
      <h1 className="text-lg font-bold">Gagal memuat data harga</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Data live dari SISKAPERBAPO sedang tidak bisa diambil. Coba muat ulang
        beberapa saat lagi.
      </p>
      <p className="mt-3 text-xs font-mono text-destructive break-words">{message}</p>
      <Button variant="default" size="md" className="mt-5" onClick={onRetry}>
        <RefreshCwIcon className="size-4" />
        <span>Coba Lagi</span>
      </Button>
    </KulakanShell>
  )
}

function CategoryFilterButtons({
  categories,
  selectedCategory,
  onChange,
}: {
  categories: LiveCategory[]
  selectedCategory: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-foreground mr-1">Kategori:</span>
      <Button
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        size="md"
        onClick={() => onChange('all')}
      >
        Semua
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? 'default' : 'outline'}
          size="md"
          onClick={() => onChange(category.id)}
        >
          {category.label}
        </Button>
      ))}
    </div>
  )
}

function MarketInfoCard({
  market,
  commodities,
  dateLabel,
  onSelect,
}: {
  market: LiveMarket
  commodities: CommodityItem[]
  dateLabel: string
  onSelect: () => void
}) {
  const available = commodities.filter((c) => (c.marketPrices[market.id] ?? 0) > 0)
  const cheapest = available.reduce<CommodityItem | null>((lowest, item) => {
    if (!lowest) return item
    return item.marketPrices[market.id] < lowest.marketPrices[market.id] ? item : lowest
  }, null)

  return (
    <Card
      variant="raised"
      className="flex flex-col justify-between bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all dark:bg-slate-900/30 dark:border-slate-800/50"
    >
      <div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" size="sm">
              {available.length} komoditas
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">ID #{market.id}</span>
          </div>
          <CardTitle className="mt-2 text-lg font-bold">{market.name}</CardTitle>
          <CardDescription className="text-xs sm:text-sm font-medium">
            Harga konsumen tingkat pasar
          </CardDescription>
        </CardHeader>

        <CardPanel className="space-y-3 text-xs sm:text-sm text-muted-foreground">
          <p className="text-foreground leading-relaxed">
            Data harga {market.name} bersumber langsung dari SISKAPERBAPO Disperindag
            Jawa Timur.
          </p>
          <Separator />
          <div className="flex items-center gap-2">
            <ClockIcon className="size-4 shrink-0 text-foreground" />
            <span>Data per {dateLabel}</span>
          </div>
          {cheapest && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-4 shrink-0 text-foreground" />
              <span>
                Termurah: {cheapest.name} ({formatRupiah(cheapest.marketPrices[market.id])}/
                {cheapest.unit})
              </span>
            </div>
          )}
        </CardPanel>
      </div>

      <CardFooter className="mt-4 border-t border-(length:--sp-rw-border-default) border-(--sp-rw-border-translucent) pt-3">
        <Button variant="outline" size="sm" width="full" onClick={onSelect}>
          Lihat Harga di {market.name}
        </Button>
      </CardFooter>
    </Card>
  )
}

function KulakanHomePage() {
  const [liveData, setLiveData] = useState<LivePriceData | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadLiveData = useCallback(async () => {
    setIsRefreshing(true)
    setLoadError(null)
    try {
      const data = await getLiveMarketData()
      setLiveData(data)
    } catch (error) {
      setLoadError(error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Data diambil di sisi klien setelah halaman dirender.
  useEffect(() => {
    void loadLiveData()
  }, [loadLiveData])

  if (!liveData && loadError) {
    return <KulakanErrorState error={loadError} onRetry={() => void loadLiveData()} />
  }

  if (!liveData) {
    return <KulakanPendingState />
  }

  return (
    <KulakanContent
      liveData={liveData}
      isRefreshing={isRefreshing}
      onRefresh={() => void loadLiveData()}
    />
  )
}

function KulakanContent({
  liveData,
  isRefreshing,
  onRefresh,
}: {
  liveData: LivePriceData
  isRefreshing: boolean
  onRefresh: () => void
}) {
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const markets = liveData.markets
  const commodities = liveData.commodities
  const categories = liveData.categories

  // Derived filter state from URL search params
  const selectedMarket = markets.some((m) => m.id === searchParams.market)
    ? (searchParams.market as string)
    : 'all'
  const selectedCategory = categories.some((c) => c.id === searchParams.category)
    ? (searchParams.category as string)
    : 'all'
  const statusFilter = searchParams.status ?? 'all'
  const activeTab = searchParams.tab ?? 'daftar-harga'
  const viewMode: 'card' | 'table' = searchParams.view ?? 'card'

  // Search state with Debounce (250ms) synced to URL `q`
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.q ?? '')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(searchParams.q ?? '')
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false)

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  })

  // Sync state if URL `q` changes externally (browser back/forward button)
  useEffect(() => {
    const urlQ = searchParams.q ?? ''
    if (urlQ !== searchQuery && !isDebouncing) {
      setSearchQuery(urlQ)
      setDebouncedSearchQuery(urlQ)
    }
  }, [searchParams.q])

  // Debounce search query into URL
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsDebouncing(true)
    }

    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setIsDebouncing(false)
      const trimmed = searchQuery.trim()
      const currentUrlQ = searchParams.q ?? ''
      if (trimmed !== currentUrlQ) {
        navigate({
          search: (prev) => ({
            ...prev,
            q: trimmed ? trimmed : undefined,
          }),
          replace: true,
        })
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearchQuery, searchParams.q, navigate])

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term)
    setDebouncedSearchQuery(term)
    setIsDebouncing(false)
    navigate({
      search: (prev) => ({
        ...prev,
        q: term,
      }),
      replace: true,
    })
  }

  const handleResetSearch = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setIsDebouncing(false)
    navigate({
      search: (prev) => ({
        ...prev,
        q: undefined,
      }),
      replace: true,
    })
  }

  const handleMarketChange = (val: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        market: val === 'all' ? undefined : val,
      }),
      replace: true,
    })
  }

  const handleCategoryChange = (val: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        category: val === 'all' ? undefined : val,
      }),
      replace: true,
    })
  }

  const handleStatusFilterChange = (val: 'all' | 'naik' | 'turun' | 'stabil') => {
    navigate({
      search: (prev) => ({
        ...prev,
        status: val === 'all' ? undefined : val,
      }),
      replace: true,
    })
  }

  const handleTabChange = (val: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        tab: val === 'daftar-harga' ? undefined : (val as KulakanSearchParams['tab']),
      }),
    })
  }

  const handleViewChange = (val: 'card' | 'table') => {
    navigate({
      search: (prev) => ({
        ...prev,
        view: val === 'card' ? undefined : val,
      }),
      replace: true,
    })
  }

  // Shopping cart calculator — default diambil dari komoditas live yang tersedia.
  const [cart, setCart] = useState<Array<{ commodityId: string; qty: number }>>(() => {
    const preferred: Array<{ match: string; qty: number }> = [
      { match: 'beras medium', qty: 5 },
      { match: 'minyakita', qty: 2 },
      { match: 'telur ayam ras', qty: 1 },
      { match: 'cabe rawit merah', qty: 0.5 },
    ]
    const picked: Array<{ commodityId: string; qty: number }> = []
    for (const item of preferred) {
      const found = commodities.find((c) => c.name.toLowerCase().includes(item.match))
      if (found && !picked.some((p) => p.commodityId === found.id)) {
        picked.push({ commodityId: found.id, qty: item.qty })
      }
    }
    return picked
  })
  const [selectedCommodityToAdd, setSelectedCommodityToAdd] = useState<string>(
    () => commodities[0]?.id ?? '',
  )
  const [addQty, setAddQty] = useState<number>(1)

  // Filtered & sorted commodities using debounced search query
  const filteredCommodities = useMemo(() => {
    let result = [...commodities]

    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory)
    }

    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter)
    }

    if (debouncedSearchQuery.trim() !== '') {
      const q = debouncedSearchQuery.toLowerCase().trim()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      const col = sortDescriptor.column as string
      let valA: string | number = a.name
      let valB: string | number = b.name

      const priceA = selectedMarket === 'all' ? a.currentPrice : (a.marketPrices[selectedMarket] ?? a.currentPrice)
      const priceB = selectedMarket === 'all' ? b.currentPrice : (b.marketPrices[selectedMarket] ?? b.currentPrice)

      if (col === 'name') {
        valA = a.name
        valB = b.name
      } else if (col === 'price') {
        valA = priceA
        valB = priceB
      } else if (col === 'change') {
        valA = a.changePercent
        valB = b.changePercent
      } else if (col === 'category') {
        valA = a.categoryLabel
        valB = b.categoryLabel
      }

      const order = sortDescriptor.direction === 'descending' ? -1 : 1
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * order
      }
      return ((valA as number) - (valB as number)) * order
    })

    return result
  }, [commodities, selectedCategory, statusFilter, debouncedSearchQuery, selectedMarket, sortDescriptor])

  // Key stats
  const totalItems = commodities.length
  const risingItems = commodities.filter((c) => c.status === 'naik')
  const fallingItems = commodities.filter((c) => c.status === 'turun')
  const stableItems = commodities.filter((c) => c.status === 'stabil')

  // Top highlight items
  const topRising = risingItems.slice(0, 2)
  const topFalling = fallingItems.slice(0, 2)

  // Saran pencarian cepat, diambil dari komoditas yang benar-benar ada.
  const quickSearchTerms = useMemo(() => {
    const curated = [
      'Beras Medium',
      'Cabe Rawit Merah',
      'Telur Ayam Ras',
      'Minyak Goreng MINYAKITA',
      'Bawang Merah',
      'Daging Ayam Ras',
    ]
    const found = curated.filter((term) =>
      commodities.some((c) => c.name.toLowerCase().includes(term.toLowerCase())),
    )
    if (found.length >= 6) return found
    const fallback = commodities
      .map((c) => c.name)
      .filter((name) => !found.includes(name))
    return [...found, ...fallback].slice(0, 6)
  }, [commodities])

  // Shopping calculation across markets
  const cartSummary = useMemo(() => {
    return markets
      .map((market) => {
        let total = 0
        cart.forEach((item) => {
          const commodity = commodities.find((c) => c.id === item.commodityId)
          if (commodity) {
            const price = commodity.marketPrices[market.id] ?? commodity.currentPrice
            total += price * item.qty
          }
        })
        return {
          marketId: market.id,
          marketName: market.name,
          total,
        }
      })
      .sort((a, b) => a.total - b.total)
  }, [cart, markets, commodities])

  const cheapestMarket = cartSummary[0]
  const mostExpensiveMarket = cartSummary[cartSummary.length - 1]
  const potentialSavings = mostExpensiveMarket && cheapestMarket ? mostExpensiveMarket.total - cheapestMarket.total : 0

  const handleAddToCart = () => {
    if (!selectedCommodityToAdd || addQty <= 0) return
    const existingIndex = cart.findIndex((item) => item.commodityId === selectedCommodityToAdd)
    if (existingIndex >= 0) {
      const updated = [...cart]
      updated[existingIndex].qty += addQty
      setCart(updated)
    } else {
      setCart([...cart, { commodityId: selectedCommodityToAdd, qty: addQty }])
    }
  }

  const handleRemoveFromCart = (commodityId: string) => {
    setCart(cart.filter((item) => item.commodityId !== commodityId))
  }

  return (
    <div className="min-h-screen bg-white text-foreground antialiased dark:bg-slate-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 dark:bg-slate-950/90 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <KulakanLogo
            onClick={() => {
              setSearchQuery('')
              setDebouncedSearchQuery('')
            }}
          />

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              loading={isRefreshing}
              onClick={onRefresh}
              aria-label="Perbarui data harga"
            >
              <RefreshCwIcon className="size-4" />
              <span>Muat Ulang</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Harga Pasar Trenggalek
              </h1>
              <p className="mt-1.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Cek harga sembako dan kebutuhan harian di pasar-pasar Trenggalek.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start sm:self-center rounded-full bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-emerald-900 shadow-2xs dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Data live: {formatTanggalPanjang(liveData.tanggal)}</span>
            </div>
          </div>

          {/* Search & Market Bar with Debounce Indicator */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Cari komoditas (beras, telur, cabai, minyak)..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                size="lg"
                className="pr-10"
              />
              {isDebouncing && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground">
                  <Spinner className="size-4 animate-spin" />
                </div>
              )}
            </div>

            {/* Market Selection Dropdown */}
            <div className="w-full sm:w-64">
              <Select
                value={selectedMarket}
                onValueChange={(val) => handleMarketChange((val as string) ?? 'all')}
              >
                <SelectTrigger size="lg" className="w-full">
                  <SelectValue placeholder="Pilih Pasar...">
                    {(val: string | null) => {
                      if (!val || val === 'all') return 'Semua Pasar (Rata-rata)'
                      const m = markets.find((item) => item.id === val)
                      return m ? m.name : val
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="all">Semua Pasar (Rata-rata)</SelectItem>
                  {markets.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground font-medium">Populer:</span>
            {quickSearchTerms.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQuickSearch(term)}
                className="rounded-md border border-slate-200/90 bg-slate-50/80 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300"
              >
                {term}
              </button>
            ))}
            {searchQuery && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="text-xs font-medium text-destructive hover:underline ml-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => handleTabChange(val as string)}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
            <TabsList variant="pill" size="md">
              <TabsTab value="daftar-harga">Daftar Harga</TabsTab>
              <TabsTab value="pasar-termurah">Bandingkan Pasar</TabsTab>
              <TabsTab value="kalkulator">Hitung Belanja</TabsTab>
              <TabsTab value="info-pasar">Daftar Pasar</TabsTab>
            </TabsList>

            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
              {filteredCommodities.length} komoditas
            </div>
          </div>

          {/* TAB 1: Daftar Harga */}
          <TabsPanel value="daftar-harga" className="mt-4 space-y-6">
            {/* Highlight Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Card: Lagi Turun */}
              <Card
                variant="raised"
                className="bg-emerald-50/70 border border-emerald-200/80 shadow-xs dark:bg-emerald-950/20 dark:border-emerald-800/40"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-2xs">
                      <TrendingDownIcon className="size-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        Harga Turun
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Lagi turun harga hari ini
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardPanel className="space-y-3">
                  {topFalling.length === 0 && (
                    <p className="py-2 text-xs sm:text-sm text-muted-foreground">
                      Tidak ada komoditas yang turun harga hari ini.
                    </p>
                  )}
                  <div className="divide-y divide-emerald-200/60 dark:divide-emerald-900/40">
                    {topFalling.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <div className="font-bold text-sm sm:text-base text-foreground">
                            {item.name}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Rata-rata: {formatRupiah(item.currentPrice)} / {item.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-base sm:text-lg font-extrabold text-emerald-800 dark:text-emerald-300">
                            -{formatRupiah(Math.abs(item.changeRp))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardPanel>
              </Card>

              {/* Card: Lagi Naik */}
              <Card
                variant="raised"
                className="bg-rose-50/70 border border-rose-200/80 shadow-xs dark:bg-rose-950/20 dark:border-rose-800/40"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#741221] text-white shadow-2xs dark:bg-[#881a2c]">
                      <TrendingUpIcon className="size-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        Harga Naik
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Lagi naik harga hari ini
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardPanel className="space-y-3">
                  {topRising.length === 0 && (
                    <p className="py-2 text-xs sm:text-sm text-muted-foreground">
                      Tidak ada komoditas yang naik harga hari ini.
                    </p>
                  )}
                  <div className="divide-y divide-rose-200/60 dark:divide-rose-900/40">
                    {topRising.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <div className="font-bold text-sm sm:text-base text-foreground">
                            {item.name}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Rata-rata: {formatRupiah(item.currentPrice)} / {item.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-base sm:text-lg font-extrabold text-[#741221] dark:text-rose-300">
                            +{formatRupiah(item.changeRp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardPanel>
              </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900/40 dark:border-slate-800">
              {/* Category selector */}
              <CategoryFilterButtons
                categories={categories}
                selectedCategory={selectedCategory}
                onChange={handleCategoryChange}
              />

              {/* Status filter & View Switcher */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterChange('all')}
                  >
                    Semua ({totalItems})
                  </Button>
                  <Button
                    variant={statusFilter === 'turun' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterChange('turun')}
                    className={
                      statusFilter === 'turun'
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                        : 'text-emerald-800 border-emerald-300/80 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-800'
                    }
                  >
                    <TrendingDownIcon className="size-4" />
                    <span>Turun ({fallingItems.length})</span>
                  </Button>
                  <Button
                    variant={statusFilter === 'naik' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterChange('naik')}
                    className={
                      statusFilter === 'naik'
                        ? 'bg-[#741221] text-white hover:bg-[#600f1c] dark:bg-[#881a2c]'
                        : 'text-[#741221] border-[#741221]/40 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-900'
                    }
                  >
                    <TrendingUpIcon className="size-4" />
                    <span>Naik ({risingItems.length})</span>
                  </Button>
                  <Button
                    variant={statusFilter === 'stabil' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterChange('stabil')}
                    className={
                      statusFilter === 'stabil'
                        ? 'bg-slate-700 text-white hover:bg-slate-800'
                        : 'text-slate-700 border-slate-300/80 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-800'
                    }
                  >
                    <MinusIcon className="size-4" />
                    <span>Stabil ({stableItems.length})</span>
                  </Button>
                </div>

                {/* View Mode Switcher: Card vs Table */}
                <div className="flex items-center gap-1 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-background p-1">
                  <button
                    type="button"
                    onClick={() => handleViewChange('card')}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors ${viewMode === 'card'
                      ? 'bg-foreground text-background shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                    aria-label="Tampilan Kartu"
                  >
                    <LayoutGridIcon className="size-3.5" />
                    <span>Kartu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewChange('table')}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors ${viewMode === 'table'
                      ? 'bg-foreground text-background shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                    aria-label="Tampilan Tabel"
                  >
                    <ListIcon className="size-3.5" />
                    <span>Tabel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content: Card Grid View or Table View */}
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCommodities.map((item) => {
                  const displayPrice =
                    selectedMarket === 'all'
                      ? item.currentPrice
                      : (item.marketPrices[selectedMarket] ?? item.currentPrice)

                  const [minPrice, maxPrice] = priceRange(item.marketPrices, displayPrice)

                  return (
                    <Card
                      key={item.id}
                      variant="raised"
                      className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4.5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all dark:bg-slate-900/40 dark:border-slate-800"
                    >
                      <div>
                        {/* Top: Category & Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                            {item.categoryLabel}
                          </span>

                          {item.status === 'naik' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#741221] dark:bg-[#881a2c] px-3 py-1 text-xs font-bold text-white shadow-2xs">
                              <TrendingUpIcon className="size-3.5 text-white" />
                              <span>Naik</span>
                            </span>
                          )}
                          {item.status === 'turun' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 dark:bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                              <TrendingDownIcon className="size-3.5 text-white" />
                              <span>Turun</span>
                            </span>
                          )}
                          {item.status === 'stabil' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-600 dark:bg-slate-700 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                              <MinusIcon className="size-3.5 text-white" />
                              <span>Stabil</span>
                            </span>
                          )}
                        </div>

                        {/* Commodity Name */}
                        <h3 className="mt-3 text-lg font-bold text-foreground leading-snug">
                          {item.name}
                        </h3>

                        {/* Price display */}
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            {formatRupiah(displayPrice)}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground">
                            /{item.unit}
                          </span>
                        </div>

                        {/* Change indicator line */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                          {item.status === 'turun' && (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              Turun {formatRupiah(Math.abs(item.changeRp))} hari ini
                            </span>
                          )}
                          {item.status === 'naik' && (
                            <span className="text-[#741221] dark:text-rose-400">
                              Naik {formatRupiah(item.changeRp)} hari ini
                            </span>
                          )}
                          {item.status === 'stabil' && (
                            <span className="text-muted-foreground font-medium">
                              Harga stabil / tetap
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Rentang harga: {formatRupiah(minPrice)} - {formatRupiah(maxPrice)}
                        </span>
                        {selectedMarket !== 'all' && (
                          <span className="font-medium text-foreground">
                            {markets.find((m) => m.id === selectedMarket)?.name}
                          </span>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card
                variant="raised"
                className="overflow-hidden bg-white border border-slate-200/90 shadow-xs dark:bg-slate-900/30 dark:border-slate-800/50"
              >
                <Table
                  aria-label="Tabel Harga Komoditas Pasar Trenggalek"
                  sortDescriptor={sortDescriptor}
                  onSortChange={setSortDescriptor}
                >
                  <TableHeader>
                    <TableHead id="name" isRowHeader allowsSorting>
                      Komoditas
                    </TableHead>
                    <TableHead id="category" allowsSorting>
                      Kategori
                    </TableHead>
                    <TableHead id="unit" align="center">
                      Satuan
                    </TableHead>
                    <TableHead id="price" align="end" allowsSorting>
                      {selectedMarket === 'all'
                        ? 'Harga Rata-rata'
                        : `Harga di ${markets.find((m) => m.id === selectedMarket)?.name}`}
                    </TableHead>
                    <TableHead id="change" align="end" allowsSorting>
                      Perubahan
                    </TableHead>
                    <TableHead id="status" align="center">
                      Status
                    </TableHead>
                  </TableHeader>

                  <TableBody>
                    {filteredCommodities.map((item) => {
                      const displayPrice =
                        selectedMarket === 'all'
                          ? item.currentPrice
                          : (item.marketPrices[selectedMarket] ?? item.currentPrice)

                      const [minPrice, maxPrice] = priceRange(item.marketPrices, displayPrice)

                      return (
                        <TableRow
                          key={item.id}
                          id={item.id}
                          textValue={`${item.name} ${item.categoryLabel}`}
                        >
                          <TableCell>
                            <div className="font-semibold text-sm sm:text-base text-foreground">
                              {item.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Rentang harga: {formatRupiah(minPrice)} - {formatRupiah(maxPrice)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-sm sm:text-base font-semibold text-foreground border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
                              {item.categoryLabel}
                            </span>
                          </TableCell>
                          <TableCell align="center">
                            <span className="font-mono text-sm sm:text-base font-medium text-foreground">
                              {item.unit}
                            </span>
                          </TableCell>
                          <TableCell align="end">
                            <span className="font-mono text-sm sm:text-base font-bold text-foreground">
                              {formatRupiah(displayPrice)}
                            </span>
                          </TableCell>
                          <TableCell align="end">
                            <div
                              className={`font-mono text-sm sm:text-base font-bold flex items-center justify-end gap-1.5 ${item.status === 'naik'
                                ? 'text-[#741221] dark:text-rose-400'
                                : item.status === 'turun'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-muted-foreground'
                                }`}
                            >
                              {item.status === 'turun' && (
                                <TrendingDownIcon className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                              )}
                              {item.status === 'naik' && (
                                <TrendingUpIcon className="size-4 shrink-0 text-[#741221] dark:text-rose-400" />
                              )}
                              <span>
                                {item.changeRp > 0
                                  ? `+${formatRupiah(item.changeRp)}`
                                  : item.changeRp < 0
                                    ? `-${formatRupiah(Math.abs(item.changeRp))}`
                                    : 'Tetap'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell align="center">
                            {item.status === 'naik' && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#741221] dark:bg-[#881a2c] px-3 py-1 text-xs sm:text-sm font-bold text-white shadow-2xs">
                                <TrendingUpIcon className="size-4 shrink-0 text-white" />
                                <span>Naik</span>
                              </span>
                            )}
                            {item.status === 'turun' && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 dark:bg-emerald-600 px-3 py-1 text-xs sm:text-sm font-bold text-white shadow-2xs">
                                <TrendingDownIcon className="size-4 shrink-0 text-white" />
                                <span>Turun</span>
                              </span>
                            )}
                            {item.status === 'stabil' && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-600 dark:bg-slate-700 px-3 py-1 text-xs sm:text-sm font-bold text-white shadow-2xs">
                                <MinusIcon className="size-4 shrink-0 text-white" />
                                <span>Stabil</span>
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}

            {filteredCommodities.length === 0 && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-900/30 p-10 text-center text-sm text-muted-foreground">
                Tidak ditemukan data komoditas yang sesuai dengan kata kunci &quot;{debouncedSearchQuery}&quot;.
              </div>
            )}
          </TabsPanel>

          {/* TAB 2: Bandingkan Pasar */}
          <TabsPanel value="pasar-termurah" className="mt-4 space-y-4">
            {/* Filter Bar for Tab 2 */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900/40 dark:border-slate-800">
              {/* Category selector */}
              <CategoryFilterButtons
                categories={categories}
                selectedCategory={selectedCategory}
                onChange={handleCategoryChange}
              />

              {/* Status filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange('all')}
                >
                  Semua ({totalItems})
                </Button>
                <Button
                  variant={statusFilter === 'turun' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange('turun')}
                  className={
                    statusFilter === 'turun'
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'text-emerald-800 border-emerald-300/80 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-800'
                  }
                >
                  <TrendingDownIcon className="size-4" />
                  <span>Turun ({fallingItems.length})</span>
                </Button>
                <Button
                  variant={statusFilter === 'naik' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange('naik')}
                  className={
                    statusFilter === 'naik'
                      ? 'bg-[#741221] text-white hover:bg-[#600f1c] dark:bg-[#881a2c]'
                      : 'text-[#741221] border-[#741221]/40 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-900'
                  }
                >
                  <TrendingUpIcon className="size-4" />
                  <span>Naik ({risingItems.length})</span>
                </Button>
                <Button
                  variant={statusFilter === 'stabil' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange('stabil')}
                  className={
                    statusFilter === 'stabil'
                      ? 'bg-slate-700 text-white hover:bg-slate-800'
                      : 'text-slate-700 border-slate-300/80 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-800'
                  }
                >
                  <MinusIcon className="size-4" />
                  <span>Stabil ({stableItems.length})</span>
                </Button>
              </div>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredCommodities.map((item) => {
                const [minPrice, maxPrice] = priceRange(item.marketPrices, item.currentPrice)

                return (
                  <Card
                    key={item.id}
                    variant="raised"
                    className="bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all dark:bg-slate-900/30 dark:border-slate-800/50"
                  >
                    <CardHeader>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold text-foreground">
                            {item.name}
                          </CardTitle>
                          <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-foreground border border-slate-200/60 dark:border-slate-700/60">
                            {item.categoryLabel}
                          </span>
                        </div>
                        <CardDescription className="text-xs sm:text-sm mt-0.5">
                          Rata-rata: {formatRupiah(item.currentPrice)} / {item.unit}
                        </CardDescription>
                      </div>
                      <CardAction>
                        {item.status === 'naik' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#741221] dark:bg-[#881a2c] px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                            <TrendingUpIcon className="size-3.5 shrink-0 text-white" />
                            <span>Naik</span>
                          </span>
                        )}
                        {item.status === 'turun' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 dark:bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                            <TrendingDownIcon className="size-3.5 shrink-0 text-white" />
                            <span>Turun</span>
                          </span>
                        )}
                        {item.status === 'stabil' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-600 dark:bg-slate-700 px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                            <MinusIcon className="size-3.5 shrink-0 text-white" />
                            <span>Stabil</span>
                          </span>
                        )}
                      </CardAction>
                    </CardHeader>

                    <CardPanel>
                      <div className="divide-y divide-(length:--sp-rw-border-default) divide-(--sp-rw-border-translucent)">
                        {markets.map((market) => {
                          const price = item.marketPrices[market.id] ?? item.currentPrice
                          const isLowest = price === minPrice
                          const isHighest = price === maxPrice && minPrice !== maxPrice

                          return (
                            <div
                              key={market.id}
                              className={`flex items-center justify-between py-2 text-sm ${isLowest
                                ? 'bg-emerald-100/60 dark:bg-emerald-950/40 font-semibold text-emerald-950 dark:text-emerald-100 px-2.5 rounded-md border border-emerald-200/70'
                                : 'px-2'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{market.name}</span>
                                {isLowest && (
                                  <Badge variant="success">
                                    Termurah
                                  </Badge>
                                )}
                                {isHighest && (
                                  <span className="text-xs text-muted-foreground">
                                    Tertinggi
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-bold">{formatRupiah(price)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </CardPanel>
                  </Card>
                )
              })}
            </div>

            {filteredCommodities.length === 0 && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-900/30 p-10 text-center text-sm text-muted-foreground">
                Tidak ditemukan data komoditas yang sesuai dengan kriteria pencarian atau filter.
              </div>
            )}
          </TabsPanel>

          {/* TAB 3: Hitung Belanja */}
          <TabsPanel value="kalkulator" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Basket */}
              <div className="space-y-4 lg:col-span-7">
                <Card
                  variant="raised"
                  className="bg-white border border-slate-200/90 shadow-xs dark:bg-slate-900/30 dark:border-slate-800/50"
                >
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Daftar Belanja
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Pilih komoditas dan jumlah untuk menghitung perkiraan belanja.
                    </CardDescription>
                  </CardHeader>

                  <CardPanel className="space-y-4">
                    {/* Add Item Row */}
                    <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 dark:bg-slate-900/40 p-3 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <Select
                          value={selectedCommodityToAdd}
                          onValueChange={(val) => setSelectedCommodityToAdd((val as string) ?? '')}
                        >
                          <SelectTrigger size="md" className="w-full">
                            <SelectValue placeholder="Pilih komoditas...">
                              {(val: string | null) => {
                                if (!val) return null
                                const c = commodities.find((item) => item.id === val)
                                return c ? `${c.name} (${formatRupiah(c.currentPrice)}/${c.unit})` : val
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectPopup>
                            {commodities.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} ({formatRupiah(c.currentPrice)}/{c.unit})
                              </SelectItem>
                            ))}
                          </SelectPopup>
                        </Select>
                      </div>

                      <div className="w-28">
                        <Input
                          type="number"
                          min={0.1}
                          step={0.5}
                          value={addQty}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAddQty(parseFloat(e.target.value) || 1)
                          }
                          size="md"
                          placeholder="Jumlah"
                        />
                      </div>

                      <Button
                        variant="default"
                        size="md"
                        onClick={handleAddToCart}
                      >
                        <PlusIcon className="size-4" />
                        Tambah
                      </Button>
                    </div>

                    {/* Basket Items List */}
                    <div className="divide-y divide-(length:--sp-rw-border-default) divide-(--sp-rw-border-translucent)">
                      {cart.map((item) => {
                        const commodity = commodities.find((c) => c.id === item.commodityId)
                        if (!commodity) return null
                        const subtotal = commodity.currentPrice * item.qty

                        return (
                          <div
                            key={item.commodityId}
                            className="flex items-center justify-between py-2.5 text-sm"
                          >
                            <div>
                              <div className="font-semibold text-foreground text-sm sm:text-base">{commodity.name}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {item.qty} {commodity.unit} &times; {formatRupiah(commodity.currentPrice)}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-sm sm:text-base text-foreground">
                                {formatRupiah(subtotal)}
                              </span>
                              <Button
                                variant="ghost"
                                size="xs"
                                aria-label={`Hapus ${commodity.name}`}
                                onClick={() => handleRemoveFromCart(item.commodityId)}
                              >
                                <Trash2Icon className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}

                      {cart.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          Daftar belanja masih kosong. Tambahkan komoditas di atas.
                        </div>
                      )}
                    </div>
                  </CardPanel>
                </Card>
              </div>

              {/* Right Column: Comparative Totals */}
              <div className="space-y-4 lg:col-span-5">
                <Card
                  variant="raised"
                  className="bg-white border border-slate-200/90 shadow-xs dark:bg-slate-900/30 dark:border-slate-800/50"
                >
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Perbandingan Total Belanja
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Perkiraan total belanja di {markets.length} pasar Trenggalek.
                    </CardDescription>
                  </CardHeader>

                  <CardPanel className="space-y-4">
                    {cheapestMarket && (
                      <div className="rounded-lg border border-emerald-300/80 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-800/50 p-4 shadow-2xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Pasar Paling Hemat
                        </div>
                        <div className="mt-1 text-xl font-bold text-foreground">
                          {cheapestMarket.marketName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Data live SISKAPERBAPO &bull; {formatTanggalPanjang(liveData.tanggal)}
                        </div>
                        <div className="mt-3 text-3xl font-extrabold font-mono text-emerald-800 dark:text-emerald-300">
                          {formatRupiah(cheapestMarket.total)}
                        </div>
                        {potentialSavings > 0 && (
                          <div className="mt-2.5 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 p-2 rounded-md">
                            Hemat {formatRupiah(potentialSavings)} dibanding pasar lain.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground">
                        Urutan Semua Pasar:
                      </div>
                      <div className="divide-y divide-slate-200/70 dark:divide-slate-800/60 rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/40 p-2">
                        {cartSummary.map((m, index) => {
                          const diff = m.total - cheapestMarket.total
                          return (
                            <div
                              key={m.marketId}
                              className="flex items-center justify-between py-2 text-xs sm:text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-muted-foreground">
                                  #{index + 1}
                                </span>
                                <span className="font-medium text-foreground">{m.marketName}</span>
                                {diff > 0 && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    (+{formatRupiah(diff)})
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-semibold text-foreground">
                                {formatRupiah(m.total)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardPanel>
                </Card>
              </div>
            </div>
          </TabsPanel>

          {/* TAB 4: Daftar Pasar */}
          <TabsPanel value="info-pasar" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {markets.map((market) => (
                <MarketInfoCard
                  key={market.id}
                  market={market}
                  commodities={commodities}
                  dateLabel={formatTanggalPanjang(liveData.tanggal)}
                  onSelect={() => {
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        market: market.id,
                        tab: undefined,
                      }),
                    })
                  }}
                />
              ))}
            </div>
          </TabsPanel>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/80 bg-slate-50/70 py-10 dark:bg-slate-900/30 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <Link
                to="/"
                search={{}}
                onClick={() => {
                  setSearchQuery('')
                  setDebouncedSearchQuery('')
                }}
                className="group inline-flex items-center justify-center gap-2.5 sm:justify-start rounded-lg p-1 -m-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
                aria-label="Kembali ke Beranda Kulakan"
              >
                <KulakanMark className="size-7 rounded-lg" iconClassName="size-4" />
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    Kulakan
                  </span>
                  <span className="text-xs text-muted-foreground">&bull;</span>
                  <span className="text-xs font-mono font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    kulakan.nggalek.co
                  </span>
                </div>
              </Link>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Informasi harga kebutuhan pokok harian di pasar-pasar Trenggalek.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sumber data:{' '}
                <a
                  href={liveData.sourceUrl || SISKAPERBAPO_BASE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  SISKAPERBAPO Disperindag Jawa Timur
                </a>
              </p>
            </div>

            <div className="text-xs sm:text-sm text-muted-foreground font-mono">
              Trenggalek, Jawa Timur &bull; &copy; {new Date().getFullYear()} nggalek.co
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
