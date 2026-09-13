import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
const [path, url] = process.argv.slice(2);
if (!path || !url) { console.error('Usage: npm run audit:html -- saved-page.html https://original-page.example/'); process.exit(1); }
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  globalThis.DOMParser = new JSDOM('').window.DOMParser;
  const { extractContentFromHTML } = await vite.ssrLoadModule('/src/utils/contentExtractor.ts');
  const { auditPage, getChecks } = await vite.ssrLoadModule('/src/utils/audit.ts');
  const data = extractContentFromHTML(await readFile(path,'utf8'), url);
  console.log(JSON.stringify({ url: data.url, analyzedAt:new Date().toISOString(), source:'import', checks:getChecks(data), analysis:auditPage(data), page:data },null,2));
} finally { await vite.close(); }
