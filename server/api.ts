import { updateReport } from "../src/pro/report-updates";
import seed from "./seed.json";
import { listReports, saveNew, db } from "./db";
import { collectPages, enhanceReport, newReport } from "./analysis";
import type { SeoReport } from "../src/pro/types";
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
async function payload(req: Request) {
  if (Number(req.headers.get("content-length")) > 2_200_000)
    throw new Error("Request is too large.");
  const text = await req.text();
  if (text.length > 2_200_000) throw new Error("Request is too large.");
  return JSON.parse(text);
}
export async function handleApi(req: Request, env: any) {
  const owner = req.headers.get("oai-authenticated-user-id");
  if (!owner)
    return json(
      { error: "Sign in with your ChatGPT account to use this workspace." },
      401,
    );
  const u = new URL(req.url);
  if (
    !["GET", "HEAD"].includes(req.method) &&
    req.headers.get("origin") !== u.origin
  )
    return json({ error: "Cross-origin writes are not allowed." }, 403);
  try {
    if (u.pathname === "/api/config")
      return json({
        aiConfigured: !!env.OPENROUTER_API_KEY,
        model: env.OPENROUTER_MODEL || "meta/muse-spark-1.3",
        storage: !!env.DB,
      });
    if (u.pathname === "/api/reports" && req.method === "GET") {
      let reports = await listReports(env, owner);
      if (!reports.length && seed) {
        const hash = Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(owner),
            ),
          ),
        )
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
        const s = { ...(seed as any), id: "patriot-" + hash, revision: 1 };
        await saveNew(env, owner, s, true);
        reports = await listReports(env, owner);
      }
      return json({ reports });
    }
    if (u.pathname === "/api/reports" && req.method === "POST") {
      const input = await payload(req);
      const report = newReport(input);
      const recent: any = await db(env)
        .prepare(
          "SELECT COUNT(*) AS n FROM audit_jobs WHERE owner_id=? AND created_at>?",
        )
        .bind(owner, new Date(Date.now() - 3600000).toISOString())
        .first();
      if (recent.n >= 10)
        return json(
          {
            error:
              "Ten reports were started in the past hour. Please wait before starting another.",
          },
          429,
        );
      await db(env)
        .prepare(
          "INSERT INTO audit_jobs (id,owner_id,created_at) VALUES (?,?,?)",
        )
        .bind(report.id, owner, report.createdAt)
        .run();
      Object.assign(
        report,
        await collectPages({
          url: report.url,
          maxPages: Math.min(5, Math.max(1, Number(input.maxPages) || 3)),
          html: typeof input.html === "string" ? input.html : undefined,
        }),
      );
      if (input.useAI !== false && env.OPENROUTER_API_KEY) {
        try {
          await enhanceReport(
            report,
            env.OPENROUTER_API_KEY,
            env.OPENROUTER_MODEL,
          );
        } catch (e) {
          report.aiStatus = "unavailable";
          report.warnings.push(
            e instanceof Error ? e.message : "AI report unavailable.",
          );
        }
      }
      if (!report.tasks.length)
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
      report.pages.forEach((p) => (p.bodyExcerpt = ""));
      await saveNew(env, owner, report);
      return json({ report }, 201);
    }
    if (u.pathname.startsWith("/api/reports/") && req.method === "PATCH") {
      const id = decodeURIComponent(u.pathname.slice("/api/reports/".length));
      const row: any = await db(env)
        .prepare(
          "SELECT payload,revision FROM reports WHERE id=? AND owner_id=?",
        )
        .bind(id, owner)
        .first();
      if (!row) return json({ error: "Report not found." }, 404);
      const input = await payload(req);
      if (input.revision !== row.revision)
        return json(
          {
            error: "This report changed in another tab. Refresh before saving.",
          },
          409,
        );
      const report: SeoReport = JSON.parse(row.payload);
      const updated = updateReport(report, input);
      Object.assign(report, updated);
      const result = await db(env)
        .prepare(
          "UPDATE reports SET payload=?,revision=?,updated_at=? WHERE id=? AND owner_id=? AND revision=?",
        )
        .bind(
          JSON.stringify(report),
          report.revision,
          report.updatedAt,
          id,
          owner,
          row.revision,
        )
        .run();
      if (result.meta.changes !== 1)
        return json(
          { error: "Concurrent update. Refresh before saving." },
          409,
        );
      return json({ report });
    }
    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error
            ? e.message
            : "The request could not be completed. Your saved reports are unchanged.",
      },
      400,
    );
  }
}
