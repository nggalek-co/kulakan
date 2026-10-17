<!-- intent-skills:start -->
## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:
- Run `pnpm exec intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm exec intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

**Kulakan** (`kulakan.nggalek.co`) is a small web app that shows and compares daily
staple-food prices across markets in Trenggalek. Prices are **scraped live** from
[SISKAPERBAPO](https://siskaperbapo.jatimprov.go.id) (Disperindag Jawa Timur).

Single-page app. Two source files carry almost all the logic:

- `src/routes/index.tsx` — the whole UI (tabs, filters, cart calculator).
- `src/server/harga.ts` — the server-only scraper.

## Commands

```bash
pnpm install            # install deps (pnpm only; pnpm-lock.yaml is the source of truth)
pnpm dev                # Vite dev server on http://localhost:3000
pnpm build              # production build (client -> dist/client, server fn -> .netlify/v1/functions/server.mjs)
pnpm preview            # preview the production build
pnpm generate-routes    # regenerate src/routeTree.gen.ts (tanstack router CLI)
pnpm exec tsc --noEmit  # typecheck
```

- Package manager is **pnpm**. Do not create `package-lock.json` or `yarn.lock`.
- There is no test runner and no linter configured. Use `tsc --noEmit` to verify.
- **Known pre-existing type errors** live in `src/siteplane/**` (e.g. `String.findLastIndex`
  needs `lib: es2023`). They are not caused by app code; ignore them unless the task
  is specifically about Siteplane.

## Stack

- **TanStack Start 1.169** + **TanStack Router 1.170** (file-based routing).
- **React 19**, **Vite 8** (rolldown), **TypeScript 6**, **Tailwind CSS v4**.
- **Siteplane UI** — vendored component source under `src/siteplane/**`, imported as
  `@/siteplane/components/*`. Managed via `skills-lock.json` and `.agents/skills/siteplane-ui`.
  Prefer these components over hand-rolled markup; see also `LICENSE.siteplane-ui` and
  `TRADEMARKS.siteplane-ui.md`.
- **lucide-react** for icons, **@base-ui/react** + **react-aria-components** under the hood.
- **Netlify** for hosting (server functions run as Netlify Functions).

## Architecture: how data flows

1. `src/routes/index.tsx` renders on the server as a lightweight **loading shell** only.
2. After hydration, a `useEffect` calls `getLiveMarketData()` (a `createServerFn`).
3. TanStack Start transports that call to the server via `POST/GET /_serverFn/<id>`.
4. `src/server/harga.ts` fetches from SISKAPERBAPO, parses HTML to JSON, and returns it.
5. The browser renders `<KulakanContent liveData={...} />` with the result.

**Important:** data loading is intentionally **client-side**, not in a route `loader`,
so SSR does not block on the upstream scrape. A plain `curl /` will only show the
loading shell — that is expected, not a bug. To verify data, call the server function
(the browser does this automatically).

### Why a server function?

SISKAPERBAPO sends no CORS headers, so the browser cannot call it directly. All
upstream requests must go through the server function.

### `src/server/harga.ts`

- Reads the market list from `GET /harga/pasar.json/<kabkota>`.
- Reads prices from `POST /harga/tabel.nodesign` with form fields `tanggal`, `kabkota`, `pasar`
  (this is the AJAX endpoint the SISKAPERBAPO page itself uses).
- Fetches once for the kabupaten **average** (`pasar` empty) and once per market to build
  real per-market prices.
- **Date resolution:** starts at "today" in `Asia/Jakarta`; if the *harga sekarang* column is
  still `0` (data not entered yet), it walks back up to 7 days and returns the newest date
  that has prices.
- Caches responses in memory for 5 minutes; request timeout is 15s.
- Drops commodities with no price (source shows `-` / `0`).

### `src/data/marketData.ts`

Isomorphic contract only — types (`CommodityItem`, `LiveMarket`, `LiveCategory`, `LivePriceData`),
constants (`SISKAPERBAPO_BASE`, `DEFAULT_KABKOTA = 'trenggalekkab'`), and `formatTanggalPanjang`.
Keep it free of server-only imports so the client can import types from it.

## Conventions

- **Aliases:** `@/*` and `#/*` both map to `src/*` (see `tsconfig.json`). Prefer `@/`.
- **TypeScript is strict** with `noUnusedLocals` and `noUnusedParameters` — do not leave
  unused imports or variables. `verbatimModuleSyntax` is on, so import types with `import type`.
- **Route tree is generated** (`src/routeTree.gen.ts`). Never edit it by hand; add route files
  under `src/routes/` and run `pnpm generate-routes`.
- **State lives in the URL** in `src/routes/index.tsx` (`tab`, `market`, `category`, `status`, `q`,
  `view`) via `validateSearch` + `navigate({ search })`. Follow this pattern instead of adding
  ad-hoc local state for shareable UI state.
- **Copy is Indonesian.** UI strings, comments, and commit messages use Indonesian; keep that style.
- Keep the existing visual language (Tailwind utility classes, emerald/rose/slate palette,
  `#741221` brand red) when adding UI.

## Do not commit

`dist/`, `.netlify/`, `.tanstack/`, `.output/`, `.nitro/`, `.wrangler/`, `node_modules/`, `.env`
(see `.gitignore`).

## Deployment

`netlify.toml` sets `command = "vite build"` and `publish = "dist/client"`.
Server functions are emitted to `.netlify/v1/functions/server.mjs` and run on Netlify Functions,
so the runtime must be able to reach `siskaperbapo.jatimprov.go.id` outbound.
No environment variables are required.
