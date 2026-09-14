import { hasSessionKey, startSessionAnalysis } from "./session-key";
export const isVercelRuntime = import.meta.env.MODE === "vercel";
export async function requestJSON(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
) {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The workspace is temporarily unavailable. Please try again.",
    );
  }
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
export async function browserApi(path: string, method = "GET", body?: any) {
  if (path === "/api/config")
    return {
      aiConfigured: hasSessionKey(),
      model: "meta/muse-spark-1.3",
      storage: "browser",
    };
  const store = await import("./browser-store");
  if (path === "/api/reports" && method === "GET")
    return { reports: await store.listBrowserReports() };
  if (path.startsWith("/api/reports/") && method === "PATCH")
    return {
      report: await store.patchBrowserReport(
        decodeURIComponent(path.slice(13)),
        body,
      ),
    };
  if (path === "/api/reports" && method === "POST") {
    const { newReport, enhanceReport } = await import("./strategy");
    const report = newReport(body);
    const session = body.useAI !== false ? startSessionAnalysis() : null;
    try {
      // Credentials and client brief never pass through the crawl endpoint.
      Object.assign(
        report,
        await requestJSON(
          "/api/audit",
          "POST",
          {
            url: report.url,
            maxPages: body.maxPages,
            html: typeof body.html === "string" ? body.html : undefined,
          },
          session?.signal,
        ),
      );
      report.tasks = report.pages
        .flatMap((p) =>
          p.checks
            .filter((c) => !c.passed)
            .map((c) => ({
              id: crypto.randomUUID(),
              title: c.title,
              priority: "Medium",
              status: "todo" as const,
              dueDate: "",
              notes: c.suggestion,
            })),
        )
        .slice(0, 30);
      // Save the measured audit before a slow or interrupted model request.
      await store.saveBrowserReport(report);
      if (session) {
        try {
          await enhanceReport(
            report,
            session.key(),
            "meta/muse-spark-1.3",
            session.signal,
          );
        } catch {
          report.aiStatus = "unavailable";
          report.warnings.push(
            session.signal.aborted
              ? "AI research stopped when the session key was cleared. The measured audit is saved."
              : "AI research could not finish. The measured audit is saved. Check OpenRouter credit and model access, then retry in a new report.",
          );
        }
      }
      return { report: await store.saveBrowserReport(report, 1) };
    } finally {
      session?.finish();
    }
  }
  throw new Error("Unknown workspace action.");
}
export const studioApi = isVercelRuntime ? browserApi : requestJSON;
