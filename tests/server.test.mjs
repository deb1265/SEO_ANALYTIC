import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { openDatabase } from "../scripts/sqlite-d1.mjs";
await build({
  entryPoints: ["server/api.ts", "server/fetch-page.ts"],
  outdir: ".sites-runtime/test",
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outExtension: { ".js": ".mjs" },
});
const { handleApi } = await import("../.sites-runtime/test/api.mjs");
const { safeUrl, fetchPublic } = await import(
  "../.sites-runtime/test/fetch-page.mjs"
);
const database = openDatabase();
const env = { DB: database };
const req = (
  path,
  owner = "alice",
  method = "GET",
  body,
  origin = "https://audit.example.com",
) =>
  new Request("https://audit.example.com" + path, {
    method,
    headers: {
      ...(owner ? { "oai-authenticated-user-id": owner } : {}),
      origin: origin,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
test("private API rejects unsigned identity and cross-origin writes", async () => {
  assert.equal((await handleApi(req("/api/reports", null), env)).status, 401);
  assert.equal(
    (
      await handleApi(
        req("/api/reports", "alice", "POST", {}, "https://evil.example"),
        env,
      )
    ).status,
    403,
  );
});
test("reports are seeded once per owner under concurrent first reads", async () => {
  const responses = await Promise.all([
    handleApi(req("/api/reports"), env),
    handleApi(req("/api/reports"), env),
  ]);
  const a = await responses[0].json(),
    b = await responses[1].json();
  assert.equal(a.reports.length, 1);
  assert.equal(b.reports.length, 1);
  assert.equal(a.reports[0].id, b.reports[0].id);
  const r = a.reports[0];
  assert.ok(r.pages.length >= 1);
  assert.equal(r.aiStatus, "complete");
});
test("owner scoping, optimistic conflicts, branding and real ranking updates persist", async () => {
  const { reports } = await (await handleApi(req("/api/reports"), env)).json();
  const r = reports[0];
  assert.equal(
    (
      await handleApi(
        req("/api/reports/" + r.id, "bob", "PATCH", {
          revision: r.revision,
          notes: "stolen",
        }),
        env,
      )
    ).status,
    404,
  );
  const response = await handleApi(
    req("/api/reports/" + r.id, "alice", "PATCH", {
      revision: r.revision,
      agency: "My agency",
      fee: 299,
      task: { id: r.tasks[0].id, status: "done" },
      ranking: {
        keyword: "solar long island",
        date: "2026-09-13",
        position: 12.5,
        source: "Search Console",
      },
    }),
    env,
  );
  assert.equal(response.status, 200);
  const { report } = await response.json();
  assert.equal(report.tasks[0].status, "done");
  assert.equal(report.fee, 299);
  assert.equal(
    (
      await handleApi(
        req("/api/reports/" + r.id, "alice", "PATCH", {
          revision: r.revision,
          notes: "old tab",
        }),
        env,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await handleApi(
        req("/api/reports/" + r.id, "alice", "PATCH", {
          revision: report.revision,
          ranking: { keyword: "test", date: "bad", position: 0, source: "AI" },
        }),
        env,
      )
    ).status,
    400,
  );
  const saved = (await (await handleApi(req("/api/reports"), env)).json())
    .reports[0];
  assert.equal(saved.rankings.length, 1);
  assert.equal(saved.agency, "My agency");
  assert.equal(saved.revision, 2);
});
test("crawler blocks local URLs and private DNS before page fetching", async () => {
  for (const u of [
    "http://127.0.0.1",
    "http://localhost",
    "http://[::1]",
    "http://10.0.0.1",
    "https://example.com:8080",
    "https://router.internal",
  ])
    assert.throws(() => safeUrl(u));
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({
      Status: 0,
      Answer: [{ type: 1, data: "169.254.169.254" }],
    });
  };
  try {
    await assert.rejects(
      () => fetchPublic("https://public-looking.example.com"),
      /public website/,
    );
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
  }
});
test("production worker serves real assets and protects its API", async () => {
  const worker = (await import("../dist/server/index.js")).default;
  const html = await worker.fetch(
    new Request("https://audit.example.com/"),
    env,
  );
  assert.equal(html.status, 200);
  assert.match(await html.text(), /id="app"/);
  assert.equal(
    (
      await worker.fetch(
        new Request("https://audit.example.com/api/reports"),
        env,
      )
    ).status,
    401,
  );
});
test("complete audit runs the server crawler and preserves evidence when AI fails", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const u = String(input);
    if (u.startsWith("https://cloudflare-dns.com/"))
      return Response.json({
        Status: 0,
        Answer: [{ type: 1, data: "93.184.216.34" }],
      });
    if (u.includes("openrouter.ai"))
      return new Response("provider failed", { status: 402 });
    if (u.endsWith("/robots.txt"))
      return new Response("User-agent: *\nAllow: /");
    if (u.endsWith("/sitemap.xml")) return new Response("<urlset/>");
    return new Response(
      '<html lang="en"><head><title>Solar example</title></head><body><h1>Energy services</h1><p>A useful local service page with clear evidence for the measured audit.</p></body></html>',
      { headers: { "content-type": "text/html" } },
    );
  };
  try {
    const response = await handleApi(
      req("/api/reports", "crawler-test", "POST", {
        client: "Example",
        url: "https://example.com",
        useAI: true,
        maxPages: 1,
      }),
      { DB: database, OPENROUTER_API_KEY: "test-only" },
    );
    assert.equal(response.status, 201);
    const { report } = await response.json();
    assert.equal(report.aiStatus, "unavailable");
    assert.equal(report.pages[0].title, "Solar example");
    assert.equal(report.pages[0].bodyExcerpt, "");
    assert.ok(report.warnings.some((w) => w.includes("402")));
    const saved = await (
      await handleApi(req("/api/reports", "crawler-test"), env)
    ).json();
    assert.equal(saved.reports[0].id, report.id);
  } finally {
    globalThis.fetch = original;
  }
});
