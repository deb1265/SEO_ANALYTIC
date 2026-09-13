import React, { useState } from 'react';
import { normalizeUrl } from '../utils/url';
import { MAX_HTML_BYTES } from '../utils/contentExtractor';
import './UrlInputSection.css';

interface Props {
  onAnalyze: (url: string, html?: string, allowProxies?: boolean, useAI?: boolean) => void;
  hasApiKey: boolean; isLoading: boolean; onOpenSettings: () => void;
}
export default function UrlInputSection({onAnalyze, hasApiKey, isLoading, onOpenSettings}: Props) {
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [useImport, setUseImport] = useState(false);
  const [allowProxies, setAllowProxies] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try {
      const normalized = normalizeUrl(url);
      if (useImport && !html.trim()) throw new Error('Paste or upload the page HTML first.');
      if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) throw new Error('HTML exceeds 5 MB.');
      onAnalyze(normalized, useImport ? html : undefined, allowProxies, useAI && hasApiKey);
    } catch (e) { setError(e instanceof Error ? e.message : 'Enter a valid website URL.'); }
  };
  return <section className="url-input-section"><div className="url-input-card">
    <div className="url-input-header">
      <h2>SEO checks you can verify.</h2>
      <p>Audit a page for free. See the evidence, export your findings, and add AI writing suggestions when you need them.</p>
      <div className="feature-badges">
        <span className="badge badge-green">15 transparent HTML checks</span>
        <span className="badge badge-blue">No API key required</span>
        <span className="badge badge-purple">JSON &amp; text exports</span>
      </div>
    </div>
    <form onSubmit={submit}>
      <label htmlFor="audit-url">Page URL</label>
      <div className="url-input-form">
        <div className="input-wrapper"><input id="audit-url" type="text" inputMode="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.patriotenergysolution.com" required disabled={isLoading}/></div>
        <button className="analyze-btn" disabled={isLoading} type="submit">{isLoading ? 'Analyzing…' : 'Analyze page'}</button>
      </div>
      <div className="audit-options">
        <label><input type="checkbox" checked={useImport} onChange={e=>setUseImport(e.target.checked)} disabled={isLoading}/> Import saved HTML instead of fetching</label>
        {useImport ? <div className="html-import">
          <label htmlFor="html-file">Upload an HTML file (maximum 5 MB)</label>
          <input id="html-file" type="file" accept=".html,.htm,text/html" disabled={isLoading} onChange={async e=>{
            const file=e.target.files?.[0]; if(!file) return;
            if(file.size>MAX_HTML_BYTES){setError('HTML exceeds 5 MB.');return;}
            try {setHtml(await file.text());setError('');} catch {setError('Could not read the file.');}
          }}/>
          <label htmlFor="html-source">Or paste page source</label>
          <textarea id="html-source" value={html} onChange={e=>setHtml(e.target.value)} rows={6} placeholder="<!doctype html>…" disabled={isLoading}/>
          <small>Parsed locally without executing scripts. Enter the original page URL so relative links resolve correctly.</small>
        </div> : <label><input type="checkbox" checked={allowProxies} onChange={e=>setAllowProxies(e.target.checked)} disabled={isLoading}/> If direct access fails, share this public URL with AllOrigins / corsproxy.io to fetch it. Do not use private or signed URLs.</label>}
        {hasApiKey ? <label><input type="checkbox" checked={useAI} onChange={e=>setUseAI(e.target.checked)} disabled={isLoading}/> Add AI suggestions (sends page text to OpenRouter; configured providers may charge).</label>
        : <p>Want writing suggestions? <button type="button" onClick={onOpenSettings} className="configure-btn">Set up optional AI</button></p>}
      </div>
      {error && <p role="alert" className="input-error">{error}</p>}
    </form>
  </div></section>;
}
