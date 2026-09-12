# Contributing

Start with `npm ci`, then `npm test` and `npm run build`. Node 22.12+ is supported.
For browser checks: `npx playwright install chromium` and `npm run test:browser`.

Open a bug report with a minimal HTML example and expected output. Redact secrets and personal data.
For a new check, explain its evidence, limits and user action; add a regression test under `tests/`.
Checks live in `src/utils/audit.ts`, extraction in `src/utils/contentExtractor.ts`.
Keep factual results deterministic. Unknown values must not become passing checks or invented measurements.
AI copy suggestions must never replace measured counts or checklist scores.

Useful first contributions: multilingual stop-word handling, distinguishing decorative images from informative images, keyboard accessibility improvements, and additional extraction edge cases.
Please discuss new external services or major scoring changes in an issue first.

No license has been selected by the owner yet. Do not assume a reuse license from the repository being public.
