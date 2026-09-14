import { collectPages, pageFinding } from "../server/analysis";
import { safeUrl } from "../src/pro/public-url";
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export async function handleAudit(request: Request) {
  if (request.method === "GET")
    return json({
      service: "SEO Analytic Studio",
      runtime: "vercel",
      version: "1.2.0",
      keyStorage: "tab-memory",
    });
  if (request.method !== "POST")
    return json({ error: "Method not allowed." }, 405);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return json({ error: "Send JSON." }, 415);
  try {
    if (Number(request.headers.get("content-length")) > 2_200_000)
      return json({ error: "Request is too large." }, 413);
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 2_200_000)
      return json({ error: "Request is too large." }, 413);
    const input = JSON.parse(text);
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).some(
        (key) => !["url", "maxPages", "html"].includes(key),
      )
    )
      return json(
        {
          error:
            "Only URL, page count and optional HTML are accepted. Send AI credentials directly to OpenRouter.",
        },
        400,
      );
    if (typeof input.url !== "string")
      return json({ error: "Enter a public website URL." }, 400);
    const url = safeUrl(input.url);
    if (typeof input.html === "string" && input.html) {
      if (new TextEncoder().encode(input.html).length > 2_000_000)
        return json({ error: "HTML must be under 2 MB." }, 413);
      if (!/<(?:html|head|body)[\s>]/i.test(input.html))
        return json({ error: "Import a usable HTML page." }, 400);
      return json({
        pages: [pageFinding(input.html, url, 0, 0).page],
        warnings: [
          "Imported HTML: HTTP status, redirects, fetch timing, robots.txt and sitemap were not measured.",
        ],
        technical: {
          robotsUrl: new URL(url).origin + "/robots.txt",
          robotsStatus: null,
          sitemapUrl: new URL(url).origin + "/sitemap.xml",
          sitemapStatus: null,
          robotsNotes: [],
        },
      });
    }
    return json(
      await collectPages({
        url,
        maxPages: Math.min(5, Math.max(1, Number(input.maxPages) || 3)),
      }),
    );
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error ? e.message : "The audit could not be completed.",
      },
      400,
    );
  }
}
export default { fetch: handleAudit };
