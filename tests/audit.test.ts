import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractContentFromHTML, fetchPageContent } from '../src/utils/contentExtractor';
import { auditPage, getChecks, mergeSuggestions } from '../src/utils/audit';
import { fetchKeywordSuggestions } from '../src/utils/aiService';
import { normalizeUrl } from '../src/utils/url';

beforeAll(() => { globalThis.DOMParser = new JSDOM('').window.DOMParser; });
afterEach(() => vi.unstubAllGlobals());
const url = 'https://example.com/path/page';
const html = `<!doctype html><html lang="en"><head><title>Example</title><meta name="description" content="A useful description"><meta name="viewport" content="width=device-width, initial-scale=1"><meta property="og:title" content="Example"><link rel="canonical" href="https://example.com/path/page"><script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":["WebPage","Thing"]}]}</script></head><body><h1>Example</h1><h2>Details</h2><p>Energy savings and energy improvements for comfortable homes.</p><a href="../contact">Contact</a><img src="a.png" alt="Insulated home"></body></html>`;

describe('HTML evidence', () => {
  it('reads nested schema types and resolves path-relative links', () => {
    const d = extractContentFromHTML(html, url);
    expect(d.schemas).toEqual(['Organization','WebPage','Thing']);
    expect(d.internalLinks[0].href).toBe('https://example.com/contact');
  });
  it('does not classify spoofed hostnames or query strings as internal', () => {
    const d = extractContentFromHTML('<title>Links</title><a href="https://example.com.evil.org">x</a><a href="//outside.org">y</a><a href="https://outside.org/?next=example.com">z</a><a href="mailto:a@example.com">mail</a>',url);
    expect(d.externalLinks).toHaveLength(3); expect(d.internalLinks).toHaveLength(0);
  });
  it('respects base URLs and excludes executable/non-web links', () => {
    const d=extractContentFromHTML('<title>T</title><base href="https://cdn.example.org/"><a href="guide">Guide</a><a href="javascript:alert(1)">x</a>',url);
    expect(d.externalLinks).toEqual([{href:'https://cdn.example.org/guide',text:'Guide'}]);
  });
  it('never generates an empty-page audit', () => expect(() => extractContentFromHTML('',url)).toThrow('empty'));
  it('flags uppercase noindex and Googlebot none directives', () => {
    for(const meta of ['<meta name="robots" content="NOINDEX, FOLLOW">','<meta name="googlebot" content="none">']) {
      const d=extractContentFromHTML(html.replace('</head>',meta+'</head>'),url);
      expect(auditPage(d).scores.technical.failed).toContain('index-meta');
    }
  });
});
describe('deterministic scoring', () => {
  it('has 15 inspectable checks totaling 100 and counts actual terms', () => {
    const d=extractContentFromHTML(html,url), result=auditPage(d);
    expect(getChecks(d)).toHaveLength(15); expect(getChecks(d).reduce((n,c)=>n+c.points,0)).toBe(100);
    expect(result.overallScore).toBe(100);
    expect(result.primaryKeywords.find(k=>k.word==='energy')?.count).toBe(2);
    expect(result.technicalEstimates.lcp).toBe('Not measured');
    expect(result.contentQuality.uniquenessScore).toBeNull();
  });
  it('AI cannot overwrite factual scores, counts or performance', () => {
    const base=auditPage(extractContentFromHTML(html,url));
    const result=mergeSuggestions(base,{summary:'Review this wording.',overallScore:1,technicalEstimates:{lcp:'1s'},primaryKeywords:[],suggestedKeywords:['solar',null,{}]});
    expect(result.overallScore).toBe(100);expect(result.primaryKeywords).toEqual(base.primaryKeywords);
    expect(result.technicalEstimates.lcp).toBe('Not measured');expect(result.suggestedKeywords).toEqual(['solar']);
    expect(()=>mergeSuggestions(base,{overallScore:55})).toThrow();
  });
});
describe('fetch failures and privacy', () => {
  it.each(['javascript:alert(1)','file:///tmp/a','https://user:pass@example.com','http://127.0.0.1','http://2130706433','http://localhost','https://example.com/a b'])('rejects unsafe URL %s', value => expect(()=>normalizeUrl(value)).toThrow());
  it('accepts a bare hostname', () => expect(normalizeUrl('example.com')).toBe('https://example.com/'));
  it('fails clearly on CORS errors and does not use proxies without opt-in', async () => {
    const fetch=vi.fn().mockRejectedValue(new Error('CORS'));vi.stubGlobal('fetch',fetch);
    await expect(fetchPageContent(url)).rejects.toThrow('No audit was generated');expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects non-HTML responses', async () => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{headers:{'content-type':'application/json'}})));
    await expect(fetchPageContent(url)).rejects.toThrow('Could not retrieve');
  });
  it('only retries through public proxies after opt-in', async () => {
    const fetch=vi.fn().mockRejectedValueOnce(new Error('CORS')).mockResolvedValueOnce(new Response(html,{headers:{'content-type':'text/html'}}));vi.stubGlobal('fetch',fetch);
    expect(await fetchPageContent(url,true)).toBe(html);expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toContain('api.allorigins.win');
    expect(fetch.mock.calls[0][1].credentials).toBe('omit');
  });
});

describe('optional keyword provider', () => {
  it('reads documented result array and rejects task errors even on HTTP 200', async () => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({status_code:20000,tasks:[{status_code:20000,result:[{keyword:'solar energy'},{keyword:null}]}]}))).mockResolvedValueOnce(new Response(JSON.stringify({status_code:20000,tasks:[{status_code:40000}]}))));
    expect(await fetchKeywordSuggestions('solar','test','test')).toEqual(['solar energy']);
    await expect(fetchKeywordSuggestions('solar','test','test')).rejects.toThrow('unavailable');
  });
});
