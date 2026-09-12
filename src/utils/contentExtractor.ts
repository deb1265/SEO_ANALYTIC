
import { ExtractedContent, HeadingStructure, ImageData, LinkData } from '../types';

import { normalizeUrl } from './url';

export const MAX_HTML_BYTES = 5 * 1024 * 1024;

export async function fetchPageContent(input: string, allowProxies = false): Promise<string> {
  const url = normalizeUrl(input);
  const candidates = [url];
  if (allowProxies) candidates.push(
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`
  );
  for (const target of candidates) {
    try {
      const response = await fetch(target, {
        headers: { Accept: 'text/html' }, credentials: 'omit',
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) continue;
      const type = response.headers.get('content-type') || '';
      if (!/text\/html|application\/xhtml\+xml/i.test(type)) continue;
      if (Number(response.headers.get('content-length')) > MAX_HTML_BYTES) continue;
      const reader = response.body?.getReader();
      if (!reader) continue;
      const decoder = new TextDecoder();
      let html = '', bytes = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > MAX_HTML_BYTES) throw new Error('Page exceeds 5 MB.');
          html += decoder.decode(value, { stream: true });
        }
        html += decoder.decode();
      } finally { await reader.cancel(); }
      if (html.trim() && /<(?:html|head|body|title)[\s>]/i.test(html)) return html;
    } catch { /* CORS, timeouts and rejected responses try the next allowed source. */ }
  }
  throw new Error('Could not retrieve HTML. The website may block browser access. Import saved page HTML or enable public proxies for a public URL. No audit was generated.');
}

export function extractContentFromHTML(html: string, url: string): ExtractedContent {
  if (!html.trim()) throw new Error('Cannot audit an empty page.');
  if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) throw new Error('HTML exceeds 5 MB.');
  url = normalizeUrl(url);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '<html><body></body></html>', 'text/html');
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  if (!doc.body?.textContent?.trim() && !doc.title) throw new Error('No page content found.');
  let base = url;
  try { base = new URL(doc.querySelector('base[href]')?.getAttribute('href') || url, url).href; } catch {}
  
  // Extract title
  const title = doc.querySelector('title')?.textContent?.trim() || '';
  
  // Extract meta description
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
  
  // Extract meta keywords
  const metaKeywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.trim() || '';
  
  // Extract headings
  const headings: HeadingStructure = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
  (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).forEach(tag => {
    doc.querySelectorAll(tag).forEach(h => {
      const text = h.textContent?.trim();
      if (text) headings[tag].push(text.substring(0, 150));
    });
  });
  
  // Remove unwanted elements for text extraction
  const docClone = doc.cloneNode(true) as Document;
  ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript', 'iframe'].forEach(tag => {
    docClone.querySelectorAll(tag).forEach(el => el.remove());
  });
  
  // Preserve word boundaries between block elements, even in minified HTML.
  docClone.querySelectorAll('p,div,section,article,h1,h2,h3,h4,h5,h6,li,ul,ol,br,td,th').forEach(el => {
    el.prepend(docClone.createTextNode(' '));
    el.append(docClone.createTextNode(' '));
  });
  // Get text content
  const bodyText = docClone.body?.textContent || '';
  const cleanText = bodyText.replace(/\s+/g, ' ').trim();
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  
  // Extract paragraphs
  const paragraphs: string[] = [];
  doc.querySelectorAll('p').forEach(p => {
    const text = p.textContent?.trim();
    if (text && text.length > 30) paragraphs.push(text);
  });
  
  // Extract images
  const images: ImageData[] = [];
  doc.querySelectorAll('img').forEach(img => {
    images.push({
      src: img.getAttribute('src') || img.getAttribute('data-src') || '',
      alt: img.getAttribute('alt') || '',
      hasAlt: !!img.getAttribute('alt')?.trim()
    });
  });
  
  // Extract links
  const internalLinks: LinkData[] = [];
  const externalLinks: LinkData[] = [];
  doc.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    const text = a.textContent?.trim().substring(0, 50) || '';
    if (!href || href.startsWith('#')) return;
    try {
      const resolved = new URL(href, base);
      if (!['http:', 'https:'].includes(resolved.protocol)) return;
      const link = { href: resolved.href, text };
      if (resolved.hostname === domain) internalLinks.push(link);
      else externalLinks.push(link);
    } catch { /* Ignore malformed and non-web links. */ }
  });
  
  // Extract meta tags and technical elements
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
  const robots = Array.from(doc.querySelectorAll('meta[name]')).filter(el => ['robots', 'googlebot'].includes((el.getAttribute('name') || '').toLowerCase())).map(el => el.getAttribute('content') || '').join(', ').toLowerCase();
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
  const twitterCard = doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '';
  const lang = doc.documentElement.getAttribute('lang') || '';
  
  // Check for schema markup
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const schemas: string[] = [];
  schemaScripts.forEach(script => {
    try {
      const schema = JSON.parse(script.textContent || '{}');
      const visit = (node: unknown): void => {
        if (Array.isArray(node)) { node.forEach(visit); return; }
        if (!node || typeof node !== 'object') return;
        const obj = node as Record<string, unknown>;
        const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
        types.forEach(type => { if (typeof type === 'string' && !schemas.includes(type)) schemas.push(type); });
        Object.values(obj).forEach(visit);
      };
      visit(schema);
    } catch (e) {}
  });

  return {
    url,
    domain,
    title,
    metaDescription: metaDesc,
    metaKeywords,
    headings,
    bodyText: cleanText,
    paragraphs,
    wordCount: words.length,
    first100Words: words.slice(0, 100).join(' '),
    images,
    internalLinks,
    externalLinks,
    canonical,
    viewport,
    robots,
    ogTitle,
    ogDesc,
    twitterCard,
    lang,
    schemas,
    isHttps: urlObj.protocol === 'https:',
    urlLength: url.length
  };
}
