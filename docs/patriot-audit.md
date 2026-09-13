# Patriot Energy Solutions: test case and findings

Checked 2026-09-12 against [the public homepage](https://www.patriotenergysolution.com/). No website changes were made.

## Test method

Downloaded the homepage directly from the origin (HTTP 200), then ran the repository's extraction and scoring functions against that saved HTML using `node scripts/audit-html.mjs`. This tests actual page content without pretending browser cross-origin fetching succeeded. The AllOrigins fetch attempt timed out after 20 seconds in this environment. The app now limits each attempt to 12 seconds and offers local HTML import. A Chromium browser test confirmed direct fetch failed clearly without generating a report. Importing the same live snapshot succeeded; exported scores and counts exactly matched the helper. The 390px mobile view had no horizontal overflow and no JavaScript page errors.

[Machine-readable summary](patriot-audit-summary.json) includes the source HTML SHA-256. Results are a snapshot, not a guarantee about later page content. No paid AI or keyword APIs were called.

## Measured HTML checklist

**95/100, with 14 of 15 presence checks passing. This is not a comprehensive SEO grade.** This example demonstrates why presence alone does not prove quality: the social title exists, but its wording is generic.

| Observation | Result |
| --- | --- |
| Title and description | Present |
| H1 / H2 headings | 1 / 8 |
| Extracted words | 1323 (whitespace-based) |
| Internal / external links | 59 / 8; links were classified, not checked for breakage |
| Images | 30; 12 missing alt attributes |
| Canonical | Points to the HTTPS www homepage |
| Robots meta | No noindex directive found |
| JSON-LD | LocalBusiness and Organization with nested address, geo and image types |
| Performance / actual indexing | Not measured |

## Website improvements, in priority order

1. **Correct inconsistent business details.** The company-history copy refers to both 2012 and 2014. The contact paragraph uses the plural-domain email while the footer uses the singular-domain email. Verify the intended year and working address, then make the page consistent. Neither alternative was independently verified.
2. **Improve social previews.** The Open Graph title is “Home”; the selected social image is a BBB badge. Use a descriptive branded title and a relevant branded image. This is a presentation improvement, not a promised ranking boost.
3. **Fix testimonial-icon accessibility.** All 12 images missing alt attributes are Facebook icons in the testimonial widget. If adjacent text already communicates their meaning, add empty `alt=""`; if meaningful without that text, add a useful label. Do not keyword-stuff decorative icons.
4. **Clean up structured data.** The LocalBusiness JSON-LD contains an empty `@id`. Give the entity a stable identifier (for example the homepage URL plus `#business`) and validate the combined output. Presence detection does not validate rich-result eligibility.
5. **Review robots.txt structure.** The initial Disallow/Allow directives appear before any User-agent declaration, so they need a correctly scoped group if intended to apply generally. The rest of the file contains many bot-specific groups. Review intent before changing crawl rules; do not blindly remove them.
6. **Measure rendered performance and conversion.** Run PageSpeed Insights and inspect real Search Console data. This task did not establish LCP, INP, CLS, Google rankings, broken-link status, or conversion performance.

## Sitemap verification

[robots.txt](https://www.patriotenergysolution.com/robots.txt) and [sitemap_index.xml](https://www.patriotenergysolution.com/sitemap_index.xml) returned HTTP 200. The advertised `/sitemap.xml` redirects with HTTP 301 to `/sitemap_index.xml`, which returns HTTP 200. That redirect is not itself a broken sitemap. Additional advertised feeds were not validated.

## Repository bugs this case helped expose

- Empty fetch failures could proceed to paid AI analysis.
- TypeScript production compilation failed on browser `process`, a URL-based JSZip import and nonstandard persistentStorage.
- Performance and mobile passes were invented or hard-coded.
- Minified adjacent block elements joined words, corrupting counts.
- Relative links and lookalike hostnames were misclassified.
- Nested/array JSON-LD types were missed.
- DataForSEO results used the wrong nesting, and keywords could be stale React state.
- No README, lockfile, CI or regression suite existed.

These are addressed in this change. Public fetching can still be blocked; imported HTML may omit JavaScript-rendered content. The legacy deployment utility and real paid-provider credentials remain untested.

## Studio expansion: September 13, 2026

The professional baseline now samples the homepage, `/company/`, `/nyserda/` and `/go-solar/` (all HTTP 200). Muse Spark 1.3 generated a strategy with four competitors, 15 keyword opportunities, 12 recommendations, five content briefs and a 90-day plan. Recommendations were reviewed to reuse existing navigation-linked pages and avoid treating checklist scores as rankings. The model run reported approximately $0.093 in OpenRouter usage cost; future costs vary.

Active comparison sources: [SUNation](https://www.sunation.com/), [Long Island Power Solutions](https://www.lipowersolutions.com/), [Green Team LI](https://www.greenteamli.com/) and adjacent roofing/solar-service provider [Marcor](https://marcorny.com/). [EmPower Solar](https://www.empower-solar.com/) announces it stopped operating and was excluded.

Google's [documentation updates](https://developers.google.com/search/updates) confirm FAQ rich results were retired in May 2026. The plan recommends useful visible FAQs without selling a retired search feature.

The saved baseline is `server/seed.json`. New visitors receive an owner-scoped copy. Reports include PDF and JSON export, editable branding/fee/notes, task status and due dates, and recorded keyword positions. No real rankings, traffic, search volume or Core Web Vitals have been supplied.
