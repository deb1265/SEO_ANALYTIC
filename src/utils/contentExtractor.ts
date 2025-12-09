
import { ExtractedContent, HeadingStructure, ImageData, LinkData } from '../types';

export async function fetchPageContent(url: string): Promise<string> {
  const corsProxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];

  for (const proxyUrl of corsProxies) {
    try {
      const response = await fetch(proxyUrl, { 
        headers: { 'Accept': 'text/html' }
      });
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      console.log('Proxy failed, trying next...', e);
    }
  }
  
  return '';
}

export function extractContentFromHTML(html: string, url: string): ExtractedContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '<html><body></body></html>', 'text/html');
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  
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
      src: img.getAttribute('src') || '',
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
    if (href?.startsWith('/') || href?.includes(domain)) {
      internalLinks.push({ href, text });
    } else if (href?.startsWith('http')) {
      externalLinks.push({ href, text });
    }
  });
  
  // Extract meta tags and technical elements
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
  const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
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
      if (schema['@type']) schemas.push(schema['@type']);
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
    isHttps: url.startsWith('https'),
    urlLength: url.length
  };
}
