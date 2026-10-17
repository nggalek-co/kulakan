import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { KulakanLogo, KulakanMark } from '@/components/KulakanLogo'
import { useState, useMemo, useEffect } from 'react'
import {
  TrendingDownIcon,
  TrendingUpIcon,
  MinusIcon,
  RefreshCwIcon,
  MapPinIcon,
  ClockIcon,
  CalculatorIcon,
  PlusIcon,
  Trash2Icon,
  SearchIcon,
  LayoutGridIcon,
  ListIcon,
} from 'lucide-react'

import { Button } from '@/siteplane/components/button'
import { Badge } from '@/siteplane/components/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
  CardFooter,
  CardAction,
} from '@/siteplane/components/card'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  type SortDescriptor,
} from '@/siteplane/components/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/siteplane/components/select'
import { Input } from '@/siteplane/components/input'
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/siteplane/components/tabs'
import { Spinner } from '@/siteplane/components/spinner'
import { Separator } from '@/siteplane/components/separator'

import {
  TRENGGALEK_MARKETS,
  COMMODITIES_DATA,
  type CommodityItem,
} from '@/data/marketData'

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

function KulakanHomePage() {
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // Derived filter state from URL search params
  const selectedMarket = searchParams.market ?? 'all'
  const selectedCategory = searchParams.category ?? 'all'
  const statusFilter = searchParams.status ?? 'all'
  const activeTab = searchParams.tab ?? 'daftar-harga'
  const viewMode: 'card' | 'table' = searchParams.view ?? 'card'

  // Search state with Debounce (250ms) synced to URL `q`
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.q ?? '')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(searchParams.q ?? '')
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false)

  const [isRefreshing, setIsRefreshing] = useState(false)
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

  // Shopping cart calculator
  const [cart, setCart] = useState<Array<{ commodityId: string; qty: number }>>([
    { commodityId: 'beras-medium', qty: 5 },
    { commodityId: 'minyakita', qty: 2 },
    { commodityId: 'telur-ayam-ras', qty: 1 },
    { commodityId: 'cabe-rawit', qty: 0.5 },
  ])
  const [selectedCommodityToAdd, setSelectedCommodityToAdd] = useState<string>('gula-pasir')
  const [addQty, setAddQty] = useState<number>(1)

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 500)
  }

  // Filtered & sorted commodities using debounced search query
  const filteredCommodities = useMemo(() => {
    let result = [...COMMODITIES_DATA]

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
  }, [selectedCategory, statusFilter, debouncedSearchQuery, selectedMarket, sortDescriptor])

  // Key stats
  const totalItems = COMMODITIES_DATA.length
  const risingItems = COMMODITIES_DATA.filter((c) => c.status === 'naik')
  const fallingItems = COMMODITIES_DATA.filter((c) => c.status === 'turun')
  const stableItems = COMMODITIES_DATA.filter((c) => c.status === 'stabil')

  // Top highlight items
  const topRising = risingItems.slice(0, 2)
  const topFalling = fallingItems.slice(0, 2)

  // Shopping calculation across markets
  const cartSummary = useMemo(() => {
    return TRENGGALEK_MARKETS.map((market) => {
      let total = 0
      cart.forEach((item) => {
        const commodity = COMMODITIES_DATA.find((c) => c.id === item.commodityId)
        if (commodity) {
          const price = commodity.marketPrices[market.id] ?? commodity.currentPrice
          total += price * item.qty
        }
      })
      return {
        marketId: market.id,
        marketName: market.name,
        location: market.location,
        specialty: market.specialty,
        total,
      }
    }).sort((a, b) => a.total - b.total)
  }, [cart])

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
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
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
              onClick={handleRefresh}
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
              <span>Pembaruan: 17 Oktober 2026</span>
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
                      const m = TRENGGALEK_MARKETS.find((item) => item.id === val)
                      return m ? `${m.name} (${m.location})` : val
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="all">Semua Pasar (Rata-rata)</SelectItem>
                  {TRENGGALEK_MARKETS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.location})
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground font-medium">Populer:</span>
            {['Cabai Rawit Merah', 'Beras Medium', 'Telur Ayam Ras', 'Minyakita', 'Bawang Merah', 'Daging Ayam Broiler'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQuickSearch(term)}
                className="rounded-md border border-(length:--sp-rw-border-default) border-(--sp-rw-border-translucent) bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
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
          <TabsPanel value="daftar-harga" className="mt-4 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 rounded-lg border border-(length:--sp-rw-border-default) border-(--sp-rw-border-translucent) bg-muted/10 p-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Category selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-foreground mr-1">Kategori:</span>
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="md"
                  onClick={() => handleCategoryChange('all')}
                >
                  Semua
                </Button>
                <Button
                  variant={selectedCategory === 'beras' ? 'default' : 'outline'}
                  size="md"
                  onClick={() => handleCategoryChange('beras')}
                >
                  Beras
                </Button>
                <Button
                  variant={selectedCategory === 'bumbu' ? 'default' : 'outline'}
                  size="md"
                  onClick={() => handleCategoryChange('bumbu')}
                >
                  Bumbu &amp; Sayur
                </Button>
                <Button
                  variant={selectedCategory === 'minyak-gula' ? 'default' : 'outline'}
                  size="md"
                  onClick={() => handleCategoryChange('minyak-gula')}
                >
                  Minyak &amp; Gula
                </Button>
                <Button
                  variant={selectedCategory === 'protein' ? 'default' : 'outline'}
                  size="md"
                  onClick={() => handleCategoryChange('protein')}
                >
                  Lauk &amp; Daging
                </Button>
              </div>

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
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors ${
                      viewMode === 'card'
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
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors ${
                      viewMode === 'table'
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

                  const prices = Object.entries(item.marketPrices)
                  const minPrice = Math.min(...prices.map(([, p]) => p))
                  const maxPrice = Math.max(...prices.map(([, p]) => p))

                  return (
                    <Card
                      key={item.id}
                      variant="raised"
                      className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all dark:bg-slate-900/40 dark:border-slate-800"
                    >
                      <div>
                        {/* Top: Category & Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center rounded-md bg-slate-200/80 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
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
                      <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {selectedMarket === 'all'
                            ? `Rentang: ${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`
                            : `Pasar: ${TRENGGALEK_MARKETS.find((m) => m.id === selectedMarket)?.name}`}
                        </span>
                        <span className="font-mono">{item.lastUpdated}</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card
                variant="raised"
                className="overflow-hidden bg-slate-50/50 border border-slate-200/80 shadow-xs dark:bg-slate-900/30 dark:border-slate-800/50"
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
                        : `Harga di ${TRENGGALEK_MARKETS.find((m) => m.id === selectedMarket)?.name}`}
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
                              Pembaruan: {item.lastUpdated}
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
                              className={`font-mono text-sm sm:text-base font-bold flex items-center justify-end gap-1.5 ${
                                item.status === 'naik'
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
        <div className="flex flex-col gap-3 rounded-lg border border-(length:--sp-rw-border-default) border-(--sp-rw-border-translucent) bg-muted/10 p-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Category selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-foreground mr-1">Kategori:</span>
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="md"
              onClick={() => handleCategoryChange('all')}
            >
              Semua
            </Button>
            <Button
              variant={selectedCategory === 'beras' ? 'default' : 'outline'}
              size="md"
              onClick={() => handleCategoryChange('beras')}
            >
              Beras
            </Button>
            <Button
              variant={selectedCategory === 'bumbu' ? 'default' : 'outline'}
              size="md"
              onClick={() => handleCategoryChange('bumbu')}
            >
              Bumbu &amp; Sayur
            </Button>
            <Button
              variant={selectedCategory === 'minyak-gula' ? 'default' : 'outline'}
              size="md"
              onClick={() => handleCategoryChange('minyak-gula')}
            >
              Minyak &amp; Gula
            </Button>
            <Button
              variant={selectedCategory === 'protein' ? 'default' : 'outline'}
              size="md"
              onClick={() => handleCategoryChange('protein')}
            >
              Lauk &amp; Daging
            </Button>
          </div>

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
            const prices = Object.entries(item.marketPrices)
            const minPrice = Math.min(...prices.map(([, p]) => p))
            const maxPrice = Math.max(...prices.map(([, p]) => p))

            return (
              <Card
                key={item.id}
                variant="raised"
                className="bg-slate-50/50 border border-slate-200/80 shadow-xs dark:bg-slate-900/30 dark:border-slate-800/50"
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
                    {TRENGGALEK_MARKETS.map((market) => {
                      const price = item.marketPrices[market.id] ?? item.currentPrice
                      const isLowest = price === minPrice
                      const isHighest = price === maxPrice && minPrice !== maxPrice

                      return (
                        <div
                          key={market.id}
                          className={`flex items-center justify-between py-2 text-sm ${
                            isLowest
                              ? 'bg-emerald-100/60 dark:bg-emerald-950/40 font-semibold text-emerald-950 dark:text-emerald-100 px-2.5 rounded-md border border-emerald-200/70'
                              : 'px-2'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{market.name}</span>
                            {isLowest && (
                              <Badge variant="success" size="xs">
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
              className="bg-slate-50/50 border border-slate-200/80 shadow-xs dark:bg-slate-900/30 dark:border-slate-800/50"
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
                <div className="flex flex-col gap-2 rounded-lg border border-slate-200/80 bg-slate-100/80 dark:bg-slate-900/40 p-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <Select
                      value={selectedCommodityToAdd}
                      onValueChange={(val) => setSelectedCommodityToAdd((val as string) ?? '')}
                    >
                      <SelectTrigger size="md" className="w-full">
                        <SelectValue placeholder="Pilih komoditas...">
                          {(val: string | null) => {
                            if (!val) return null
                            const c = COMMODITIES_DATA.find((item) => item.id === val)
                            return c ? `${c.name} (${formatRupiah(c.currentPrice)}/${c.unit})` : val
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectPopup>
                        {COMMODITIES_DATA.map((c) => (
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
                    const commodity = COMMODITIES_DATA.find((c) => c.id === item.commodityId)
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
              className="bg-slate-50/50 border border-slate-200/80 shadow-xs dark:bg-slate-900/30 dark:border-slate-800/50"
            >
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Perbandingan Total Belanja
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Perkiraan total belanja di 6 pasar Trenggalek.
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
                      {cheapestMarket.location} &bull; {cheapestMarket.specialty}
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
                  <div className="divide-y divide-slate-200/70 dark:divide-slate-800/60 rounded-lg border border-slate-200/80 bg-background/90 dark:bg-slate-900/40 p-2">
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
          {TRENGGALEK_MARKETS.map((market) => (
            <Card
              key={market.id}
              variant="raised"
              className="flex flex-col justify-between bg-slate-50/50 border border-slate-200/80 shadow-xs dark:bg-slate-900/30 dark:border-slate-800/50"
            >
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" size="sm">
                      {market.district}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {market.location}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-lg font-bold">
                    {market.name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    {market.specialty}
                  </CardDescription>
                </CardHeader>

                <CardPanel className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                  <p className="text-foreground leading-relaxed">{market.description}</p>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="size-4 shrink-0 text-foreground" />
                    <span>{market.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="size-4 shrink-0 text-foreground" />
                    <span>{market.openHours}</span>
                  </div>
                </CardPanel>
              </div>

              <CardFooter className="mt-4 border-t border-(length:--sp-rw-border-default) border-(--sp-rw-border-translucent) pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  width="full"
                  onClick={() => {
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        market: market.id,
                        tab: undefined,
                      }),
                    })
                  }}
                >
                  Lihat Harga di {market.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </TabsPanel>
    </Tabs>
  </main>

  {/* Footer */}
  <footer className="mt-16 border-t border-(length:--sp-rw-border-default) border-(--sp-rw-border-translucent) bg-muted/10 py-10">
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
            <KulakanMark className="size-6 transition-transform duration-200 group-hover:scale-110" idPrefix="klk-footer" />
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
