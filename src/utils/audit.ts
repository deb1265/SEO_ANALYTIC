import type { AIAnalysis, ExtractedContent, Scores, Recommendation } from '../types';

export interface AuditCheck {
  id: string; category: keyof Scores; points: number; passed: boolean;
  title: string; evidence: string; suggestion: string;
}

/** Product checklist, not Google's ranking formula. Each rule has visible evidence. */
export function getChecks(d: ExtractedContent): AuditCheck[] {
  const rule = (id: string, category: keyof Scores, points: number, passed: boolean, title: string, evidence: string, suggestion: string): AuditCheck =>
    ({ id, category, points, passed, title, evidence, suggestion });
  return [
    rule('title', 'onPage', 10, !!d.title, 'Page title', d.title || 'Missing', 'Write a clear title describing this page.'),
    rule('description', 'onPage', 10, !!d.metaDescription, 'Meta description', d.metaDescription || 'Missing', 'Add a relevant summary. Character counts are guidance, not a Google limit.'),
    rule('h1', 'onPage', 5, d.headings.h1.length > 0, 'Main heading', `${d.headings.h1.length} H1 headings`, 'Add a descriptive main heading.'),
    rule('body', 'keywords', 10, d.wordCount > 0, 'Extractable body text', `${d.wordCount} whitespace-separated words`, 'Ensure meaningful page text is available in the HTML.'),
    rule('paragraphs', 'keywords', 5, d.paragraphs.length > 0, 'Descriptive paragraphs', `${d.paragraphs.length} paragraphs longer than 30 characters`, 'Use descriptive paragraphs when appropriate for this page.'),
    rule('subheadings', 'keywords', 5, d.headings.h2.length > 0, 'Content sections', `${d.headings.h2.length} H2 headings`, 'Use section headings when they help readers navigate.'),
    rule('internal-links', 'keywords', 5, d.internalLinks.length > 0, 'Internal navigation', `${d.internalLinks.length} internal links`, 'Link to relevant pages on your site.'),
    rule('https', 'technical', 5, d.isHttps, 'HTTPS URL', d.url, 'Use HTTPS and check redirects separately.'),
    rule('canonical', 'technical', 5, !!d.canonical, 'Canonical declaration', d.canonical || 'Missing', 'Review and declare the preferred URL for this page.'),
    rule('index-meta', 'technical', 10, !/(?:^|[\s,;])(?:noindex|none)(?:$|[\s,;])/.test(d.robots), 'No blocking robots meta', d.robots || 'No robots meta restriction found', 'If this page should be indexed, review its noindex directive. HTTP headers and robots.txt need separate checks.'),
    rule('schema', 'technical', 5, d.schemas.length > 0, 'Structured data types', d.schemas.join(', ') || 'No JSON-LD types found', 'Consider applicable structured data and validate it with Google’s Rich Results Test.'),
    rule('open-graph', 'technical', 5, !!d.ogTitle, 'Social title', d.ogTitle || 'Missing', 'Add an Open Graph title for shared links.'),
    rule('viewport', 'uxMobile', 10, /width\s*=\s*device-width/i.test(d.viewport), 'Device-width viewport', d.viewport || 'Missing', 'Use a device-width viewport; test the rendered layout separately.'),
    rule('language', 'uxMobile', 5, !!d.lang, 'Document language', d.lang || 'Missing', 'Declare the document language on the html element.'),
    rule('image-alt', 'uxMobile', 5, d.images.every(i => i.hasAlt), 'Image descriptions to review', `${d.images.filter(i => !i.hasAlt).length} images with missing or empty alt`, 'Describe informative images. Empty alt is correct for decorative images; review manually.')
  ];
}

export function auditPage(d: ExtractedContent): AIAnalysis {
  const checks = getChecks(d);
  const scores: Scores = { onPage: {score:0,passed:[],failed:[]}, keywords: {score:0,passed:[],failed:[]}, technical: {score:0,passed:[],failed:[]}, uxMobile: {score:0,passed:[],failed:[]} };
  for (const c of checks) {
    scores[c.category][c.passed ? 'passed' : 'failed'].push(c.id);
    if (c.passed) scores[c.category].score += c.points;
  }
  const tokens = d.bodyText.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const stop = new Set('the and for that this with your you are our from have has was were will can not but their they its into about more than when what where how all'.split(' '));
  const counts = new Map<string, number>();
  for (const token of tokens) if (token.length > 2 && !stop.has(token)) counts.set(token, (counts.get(token) || 0) + 1);
  const primaryKeywords = [...counts].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,12)
    .map(([word,count]) => ({word,count,density:`${(count / tokens.length * 100).toFixed(2)}%`}));
  const recommendations: Recommendation[] = checks.filter(c => !c.passed).map(c => ({
    priority: c.id === 'index-meta' || c.id === 'title' ? 'critical' : 'warning',
    title: c.title, description: c.evidence, suggestion: c.suggestion,
    impact: `Addresses ${c.points} points on this HTML checklist; ranking impact is not predicted.`
  }));
  return {
    overallScore: Object.values(scores).reduce((n,c) => n+c.score,0), confidence: 0, scores, primaryKeywords,
    suggestedKeywords: [], contentQuality: { readabilityScore: null, uniquenessScore: null, depthScore: null },
    technicalEstimates: {fcp:'Not measured',lcp:'Not measured',cls:'Not measured',tti:'Not measured'},
    summary: `${checks.filter(c => c.passed).length}/${checks.length} HTML checks passed. This is a single-page checklist, not a ranking prediction or full technical audit. Performance, rendered mobile usability, backlinks, search volume and actual Google indexing are not measured.`,
    keywordAnalysis: 'Counted terms in extracted body text. Density uses all letter/number tokens; common English stop words are omitted from the list. These are not search-volume or ranking measurements.',
    recommendations, optimizedTitle: '', optimizedMetaDescription: '', contentImprovements: [],
    industryComparison: 'Not measured: no competitor or search-results data was collected.'
  };
}

/** Only accept optional editorial suggestions. AI cannot replace measured scores/counts. */
export function mergeSuggestions(base: AIAnalysis, value: unknown): AIAnalysis {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid AI response object');
  const obj = value as Record<string, unknown>;
  if (typeof obj.summary !== 'string' || !obj.summary.trim()) throw new Error('AI response is missing a summary');
  const strings = (key: string): string[] => Array.isArray(obj[key]) ? (obj[key] as unknown[]).filter((v): v is string => typeof v === 'string').slice(0,20) : [];
  return { ...base, summary: base.summary + '\n\nAI editorial suggestion (verify before use): ' + obj.summary.slice(0,3000),
    suggestedKeywords: strings('suggestedKeywords'), contentImprovements: strings('contentImprovements'),
    optimizedTitle: typeof obj.optimizedTitle === 'string' ? obj.optimizedTitle.slice(0,300) : '',
    optimizedMetaDescription: typeof obj.optimizedMetaDescription === 'string' ? obj.optimizedMetaDescription.slice(0,1000) : '' };
}
