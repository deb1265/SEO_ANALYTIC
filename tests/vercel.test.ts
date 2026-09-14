import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { JSDOM } from "jsdom";
import { handleAudit } from "../api/audit";

beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("persists report edits and rejects conflicting revisions across tabs", async () => {
  const { listBrowserReports, patchBrowserReport } =
    await import("../src/pro/browser-store");
  const [first, second] = await Promise.all([
    listBrowserReports(),
    listBrowserReports(),
  ]);
  expect(first).toHaveLength(1);
  expect(second).toHaveLength(1);
  const original = first[0];
  await patchBrowserReport(original.id, {
    revision: 1,
    notes: "Ready for client review",
    task: { id: original.tasks[0].id, status: "done" },
  });
  await expect(
    patchBrowserReport(original.id, { revision: 1, notes: "stale" }),
  ).rejects.toThrow("another tab");
  const [reloaded] = await listBrowserReports();
  expect(reloaded.notes).toBe("Ready for client review");
  expect(reloaded.tasks[0].status).toBe("done");
  expect(reloaded.revision).toBe(2);
});
it("rejects invalid rankings without changing a saved report", async () => {
  const { listBrowserReports, patchBrowserReport } =
    await import("../src/pro/browser-store");
  const [report] = await listBrowserReports();
  await expect(
    patchBrowserReport(report.id, {
      revision: 1,
      ranking: { keyword: "solar", position: -1 },
    }),
  ).rejects.toThrow("valid date");
  expect((await listBrowserReports())[0].revision).toBe(1);
});
it("does not overwrite edits made while AI research is running", async () => {
  const { listBrowserReports, patchBrowserReport, saveBrowserReport } =
    await import("../src/pro/browser-store");
  const [report] = await listBrowserReports();
  await patchBrowserReport(report.id, {
    revision: 1,
    notes: "Keep these edits",
  });
  await expect(saveBrowserReport(report, 1)).rejects.toThrow(
    "another tab while research",
  );
  expect((await listBrowserReports())[0].notes).toBe("Keep these edits");
});
it("clears the key on pagehide and aborts research without writing any storage", async () => {
  vi.resetModules();
  const dom = new JSDOM("", { url: "https://seo-analytic.vercel.app" });
  vi.stubGlobal("window", dom.window);
  const { setSessionKey, hasSessionKey, startSessionAnalysis } =
    await import("../src/pro/session-key");
  setSessionKey("sk-or-v1-test-only");
  const operation = startSessionAnalysis();
  expect(operation.key()).toBe("sk-or-v1-test-only");
  expect(dom.window.localStorage.length).toBe(0);
  expect(dom.window.sessionStorage.length).toBe(0);
  dom.window.dispatchEvent(new dom.window.Event("pagehide"));
  expect(hasSessionKey()).toBe(false);
  expect(operation.signal.aborted).toBe(true);
  expect(() => operation.key()).toThrow();
  operation.finish();
  dom.window.close();
});
it("routes the key only to OpenRouter and persists a report without raw body excerpts", async () => {
  const { setSessionKey, clearSessionKey } =
    await import("../src/pro/session-key");
  const { browserApi } = await import("../src/pro/client-api");
  const { listBrowserReports } = await import("../src/pro/browser-store");
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (url === "/api/audit")
      return handleAudit(
        new Request("https://seo-analytic.vercel.app/api/audit", {
          ...init,
          headers: {
            "Content-Type": "application/json",
            origin: "https://seo-analytic.vercel.app",
          },
        }),
      );
    return Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Sourced review",
              issues: [
                { title: "Improve title", suggestion: "Add service context" },
              ],
            }),
          },
        },
      ],
    });
  });
  setSessionKey("sk-or-v1-test-only");
  const { report } = await browserApi("/api/reports", "POST", {
    client: "Test customer",
    url: "https://example.com",
    useAI: true,
    html: "<html><head><title>Example</title></head><body><h1>Welcome</h1><p>Public evidence</p></body></html>",
  });
  expect(calls).toHaveLength(2);
  expect(JSON.stringify(calls[0])).not.toContain("sk-or-v1");
  expect(calls[1].url).toBe("https://openrouter.ai/api/v1/chat/completions");
  expect((calls[1].init.headers as Record<string, string>).Authorization).toBe(
    "Bearer sk-or-v1-test-only",
  );
  expect(report.aiStatus).toBe("complete");
  clearSessionKey();
  const saved = await listBrowserReports();
  expect(saved.find((r) => r.id === report.id)?.pages[0].bodyExcerpt).toBe("");
  expect(JSON.stringify(saved)).not.toContain("sk-or-v1");
});
it("preserves measured results if the AI provider fails", async () => {
  const { setSessionKey, clearSessionKey } =
    await import("../src/pro/session-key");
  const { browserApi } = await import("../src/pro/client-api");
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) =>
    url === "/api/audit"
      ? handleAudit(
          new Request("https://seo-analytic.vercel.app/api/audit", {
            ...init,
            headers: {
              "Content-Type": "application/json",
              origin: "https://seo-analytic.vercel.app",
            },
          }),
        )
      : new Response("provider unavailable", { status: 402 }),
  );
  setSessionKey("sk-or-v1-test-only");
  const { report } = await browserApi("/api/reports", "POST", {
    url: "https://example.com",
    html: "<html><body><h1>Example</h1></body></html>",
    useAI: true,
  });
  expect(report.pages).toHaveLength(1);
  expect(report.aiStatus).toBe("unavailable");
  expect(report.warnings.join(" ")).toContain("measured audit is saved");
  clearSessionKey();
});
it("rejects credentials and cross-origin calls at the Vercel endpoint", async () => {
  const request = (origin: string, body: object) =>
    new Request("https://seo-analytic.vercel.app/api/audit", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  expect(
    (
      await handleAudit(
        request("https://other.example", { url: "https://example.com" }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await handleAudit(
        request("https://seo-analytic.vercel.app", {
          url: "https://example.com",
          apiKey: "never-accept",
        }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await handleAudit(
        request("https://seo-analytic.vercel.app", { url: "http://127.0.0.1" }),
      )
    ).status,
  ).toBe(400);
});
