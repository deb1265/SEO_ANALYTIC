import { DOMParser } from "linkedom";
import robotsParser from "robots-parser";
import { extractContentFromHTML } from "../src/utils/contentExtractor";
import { auditPage, getChecks } from "../src/utils/audit";
import { fetchPublic, safeUrl } from "./fetch-page";
import type { PageFinding } from "../src/pro/types";

export function pageFinding(
  html: string,
  url: string,
  status = 200,
  fetchMs = 0,
) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const d = extractContentFromHTML(html, url, doc as unknown as Document);
  const a = auditPage(d);
  const page: PageFinding = {
    url: d.url,
    title: d.title,
    description: d.metaDescription,
    h1: d.headings.h1,
    score: a.overallScore,
    scores: a.scores,
    wordCount: d.wordCount,
    images: d.images.length,
    missingAlt: d.images.filter((i) => !i.hasAlt).length,
    canonical: d.canonical,
    robots: d.robots,
    schemas: d.schemas,
    checks: getChecks(d),
    terms: a.primaryKeywords,
    status,
    fetchMs,
    bodyExcerpt: d.bodyText.slice(0, 7000),
    internalLinks: [...new Set(d.internalLinks.map((x) => x.href))].slice(
      0,
      50,
    ),
  };
  return { page, links: d.internalLinks };
}
export async function collectPages(input: {
  url: string;
  maxPages?: number;
  html?: string;
}) {
  const url = safeUrl(input.url);
  const warnings: string[] = [];
  const pages: PageFinding[] = [];
  const origin = new URL(url).origin;
  let robotsText = "",
    robotsStatus: number | null = null,
    sitemapStatus: number | null = null,
    sitemapUrl = origin + "/sitemap.xml";
  try {
    const r = await fetchPublic(origin + "/robots.txt", 300000);
    robotsStatus = r.status;
    if (r.status === 200) robotsText = r.text;
    else if (r.status !== 404)
      warnings.push(
        `robots.txt returned HTTP ${r.status}; crawl permissions could not be established.`,
      );
  } catch {
    warnings.push(
      "robots.txt was unavailable; no additional pages were crawled.",
    );
  }
  const robots = robotsParser(origin + "/robots.txt", robotsText);
  const allowed = (u: string) => robots.isAllowed(u, "SEOAnalytic") !== false;
  const declarations = robotsText.match(/^sitemap:\s*(\S+)/gim) || [];
  if (declarations.length) {
    try {
      const candidate = safeUrl(declarations[0].replace(/^sitemap:\s*/i, ""));
      if (new URL(candidate).hostname === new URL(url).hostname)
        sitemapUrl = candidate;
    } catch {}
  }
  try {
    const sm = await fetchPublic(sitemapUrl, 500000);
    sitemapStatus = sm.status;
    sitemapUrl = sm.url;
  } catch {
    warnings.push("Sitemap could not be checked.");
  }
  if (!input.html && robotsStatus === 200 && !allowed(url))
    throw new Error(
      "The site robots.txt disallows this page for the audit crawler. Import an authorized HTML snapshot instead.",
    );
  const root = input.html
    ? {
        text: input.html,
        url,
        status: 200,
        fetchMs: 0,
        headers: { "content-type": "text/html" },
      }
    : await fetchPublic(url);
  if (root.status !== 200)
    throw new Error(
      `The page returned HTTP ${root.status}. Import HTML if the website blocks automated requests.`,
    );
  if (
    !/html/i.test(root.headers["content-type"] || "") ||
    !/<(?:html|head|body)[\s>]/i.test(root.text)
  )
    throw new Error("The response is not a usable HTML page.");
  const rootData = pageFinding(root.text, root.url, root.status, root.fetchMs);
  pages.push(rootData.page);
  const canCrawl = robotsStatus === 200 || robotsStatus === 404;
  const links = [
    ...new Set(
      rootData.links.map((x) => {
        const u = new URL(x.href);
        u.hash = "";
        return u.href;
      }),
    ),
  ]
    .filter(
      (x) =>
        new URL(x).origin === new URL(root.url).origin &&
        !new URL(x).search &&
        allowed(x) &&
        x !== root.url &&
        !/\.(pdf|zip|jpg|png|svg)$/i.test(new URL(x).pathname),
    )
    .slice(0, Math.max(0, (input.maxPages || 3) - 1));
  if (!input.html && canCrawl) {
    for (const link of links) {
      try {
        const r = await fetchPublic(link);
        if (r.status === 200 && /html/i.test(r.headers["content-type"] || ""))
          pages.push(pageFinding(r.text, r.url, r.status, r.fetchMs).page);
        else warnings.push(`${link}: HTTP ${r.status} or non-HTML response.`);
      } catch {
        warnings.push(`Could not audit ${link}.`);
      }
    }
  }
  if (input.html)
    warnings.push(
      "Imported HTML: HTTP status, redirects and fetch timing for that page were not measured.",
    );
  const robotsNotes: string[] = [];
  const firstAgent = robotsText.toLowerCase().indexOf("user-agent:");
  if (
    firstAgent > 0 &&
    /^(allow|disallow):/im.test(robotsText.slice(0, firstAgent))
  )
    robotsNotes.push(
      "Allow/Disallow directives appear before the first User-agent group. Review their intended scope.",
    );
  return {
    pages,
    warnings,
    technical: {
      robotsUrl: origin + "/robots.txt",
      robotsStatus,
      sitemapUrl,
      sitemapStatus,
      robotsNotes,
    },
  };
}
export {
  enhanceReport,
  newReport,
  validateStrategy,
  parseModelJSON,
  analysisPrompt,
} from "../src/pro/strategy";
