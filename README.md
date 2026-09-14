# SEO Analytic Studio

**Turn a website into a sourced SEO action plan and a branded client report.**

[![CI](https://github.com/deb1265/SEO_ANALYTIC/actions/workflows/ci.yml/badge.svg)](https://github.com/deb1265/SEO_ANALYTIC/actions/workflows/ci.yml)

A consulting workspace with transparent HTML checks, Muse Spark 1.3 strategy, competitor research, keyword-to-page mapping and persistent client progress. The original free HTML checker is included.

**[Open the live reporting Studio](https://seo-analytic.vercel.app/)** — includes a sourced Patriot Energy Solutions example. Add your own OpenRouter key in the UI for new AI reports; it is cleared when you refresh or close the tab.

## Quick start

Requires Node.js 24+ and npm.

```sh
git clone https://github.com/deb1265/SEO_ANALYTIC.git
cd SEO_ANALYTIC
npm ci
npm run dev
```

Open `http://localhost:5173`. Local development uses a local SQLite database and a development identity, bound to loopback. Production uses authenticated Sites identity and D1. Vercel runs the full reporting Studio with a bounded public-page audit function, browser-saved reports and a session-only OpenRouter key. The private deployment is [SEO Analytic Studio](https://seo-analytic-debashis.deb1265.chatgpt.site); access is restricted to its owner.

To enable AI locally, set `OPENROUTER_API_KEY` in the server process environment. The default model is `meta/muse-spark-1.3`; set `OPENROUTER_MODEL` to override it. Never use a `VITE_` prefix for a secret. Without a key, measured audits and the included Patriot baseline still work.

## What you get

- Sample up to five public HTML pages with robots and sitemap checks.
- Fifteen deterministic HTML presence checks per page, with evidence.
- Sourced competitor positioning and keyword intent, priority and page mapping.
- Prioritized issues, original content briefs, suggested copy and a 30/60/90-day plan.
- Saved reports, consultant notes, branding, fee and draft/reviewed/delivered status.
- Charts for measured checklist results, body terms, task completion and recorded positions.
- Branded, paginated PDF reports and JSON export.
- A free single-page checker with authorized HTML import.

The Patriot baseline samples four pages, with four sourced competitors, 15 keyword opportunities, 12 recommendations and five content briefs. It was prepared with Muse Spark 1.3 on September 13, 2026. [Case study](docs/patriot-audit.md).

## Client workflow

Create a report, review its evidence and sources, set your business name and report fee, and export the PDF. Record agreed tasks and observed keyword positions as work progresses. Re-audit with the same page sample for comparable checklist history.

The fee field records a consulting price; it does not collect payment. Invoice and collect separately. Vercel reports belong to the current browser profile; Sites reports are private to the signed-in consultant. PDFs are the client deliverable. A public checkout or customer portal requires a separate billing and access integration.

## Scoring

This is a **product checklist, not Google's ranking formula**. A high score does not imply strong rankings, valid rich results or that a page is indexed. The 15 checks and weights are defined in [`src/utils/audit.ts`](src/utils/audit.ts).

| Category | Checks and points | Maximum |
| --- | --- | ---: |
| On-page | Title 10; description 10; H1 present 5 | 25 |
| Content structure | Body text 10; paragraph 5; H2 5; internal link 5 | 25 |
| Technical hints | HTTPS URL 5; canonical present 5; no blocking robots meta 10; JSON-LD type 5; Open Graph title 5 | 30 |
| HTML accessibility hints | Device-width viewport 10; language 5; all images have nonempty alt 5 | 20 |

Presence checks do not validate quality. Empty alt is correct for decorative images and needs manual review. JSON-LD presence does not validate a schema. A robots meta check cannot inspect HTTP headers, robots.txt or Google's index. Import uses the supplied original URL, so redirects/HTTPS must be checked separately. Word counts use whitespace; term counts tokenize letters/numbers and omit a small English stop-word list. Keyword density is not search demand.

Title and description character counts are guidance, not fixed Google limits: [title links](https://developers.google.com/search/docs/appearance/title-link), [snippets](https://developers.google.com/search/docs/appearance/snippet).
Performance needs measurements: [Core Web Vitals](https://web.dev/articles/vitals). This app does **not** invent LCP, INP or CLS from HTML.

## Privacy, scope and server design

**Vercel:** Open the OpenRouter panel and select **Use key for this tab**. The key lives only in JavaScript memory. Refreshing, closing or leaving the tab, or selecting **Clear key**, removes it from the app; Clear also aborts active AI requests. It is never written to localStorage, sessionStorage, IndexedDB, cookies, GitHub or Vercel environment variables. AI requests go directly from the browser to OpenRouter; the Vercel crawl endpoint accepts only a URL, page count and optional HTML. Clearing a key cannot undo a request already processed by the provider. Reports and progress persist separately in IndexedDB on that browser profile. Export backups before clearing browser data. There is no cross-device sync or shared customer portal.

**Sites:** Production credentials are runtime secrets; the client receives only connection status and model name. Each authenticated owner can start up to ten reports per hour.

On either host, AI sends public page content and the business brief to OpenRouter and its web-search provider. Charges apply to the connected account.

The server accepts public HTTP(S) hostnames on standard ports, checks DNS for private addresses, validates redirects, caps pages at 2 MB and samples at most five pages. This is a bounded public-page crawler, not an exhaustive site audit. Robots restrictions are respected for crawling. If a website blocks requests, import an authorized snapshot. Unknown robots permissions prevent additional crawling. Page scripts are not executed, so rendered content may be absent.

On Sites, reports and edits persist in D1 through owner-scoped queries and optimistic revisions. Cross-origin writes and unsigned API requests are rejected. Local development uses the same API with an explicit local identity and SQLite compatibility adapter. The Sites version does not store reports in browser storage. Full page body excerpts are removed before saving; measured evidence and strategy remain.

The original free checker runs locally and retains its opt-in public-proxy and memory-only AI settings. Those settings are separate from Studio's connection. Public proxies receive the requested URL; imports stay local unless optional AI is enabled.

Database schema: `db/schema.ts`; generated migrations: `drizzle/`. To change the schema, run `npm run db:generate` and commit SQL plus metadata. The Worker build embeds static assets and packages migrations under `dist/.openai/drizzle`. Sites applies the D1 migrations during publishing. `.sites-runtime/` contains disposable local state and is ignored.

## Deploy on Vercel

Import this GitHub repository into Vercel and use the committed `vercel.json`. It selects `npm run build:vercel`, output `dist/client`, and the Node.js function at `/api/audit`. Pushes to the production branch deploy the full Studio. No database or OpenRouter environment variable is required. Do not add `VITE_OPENROUTER_API_KEY`: Vite-prefixed variables are public in the bundle.

For a matching local preview, run `npm run dev:vercel`. `/build-info.json` identifies the deployed commit and runtime; `/api/audit` returns service health. `npm run build:static` remains an optional export of the original free checker and is not the Vercel build.

## Reproduce an audit from HTML

Save a public page's source to an HTML file, then:

```sh
npm run audit:html -- saved-page.html https://www.patriotenergysolution.com/
```

The helper uses the exact same extraction and scoring functions as the browser. It does not execute page scripts or fetch additional URLs. [Patriot case study](docs/patriot-audit.md) records observations and testing limits.

## Development

```sh
npm test
npm run build
npm run test:server
npx playwright install chromium
npm run test:browser
npm run build:vercel
npm run test:browser:vercel
```

See [CONTRIBUTING.md](CONTRIBUTING.md), the issue templates and the [adoption roadmap](docs/maintainer-roadmap.md). Useful next contributions include measured Search Console imports, multilingual term analysis and rendered-page measurements.

## Support the project

If this saves you time, star the repo and share a reproducible issue or useful example. Contributions and clear bug reports make the tool better for everyone.

## License

No open-source license has been chosen by the repository owner. Public visibility does not grant a general reuse license. An explicit owner-selected license is a remaining step before promoting this as an open-source project.
