import { createServer as viteServer } from "vite";
import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { openDatabase } from "./sqlite-d1.mjs";
mkdirSync(".sites-runtime", { recursive: true });
const isVercel = process.env.STUDIO_RUNTIME === "vercel";
const vite = await viteServer({
  mode: isVercel ? "vercel" : "development",
  server: { middlewareMode: true },
  appType: "spa",
});
const env = {
  DB: openDatabase(".sites-runtime/reports.sqlite"),
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "meta/muse-spark-1.3",
};
const port = Number(process.env.PORT || 5173);
createServer(async (req, res) => {
  if (!req.url.startsWith("/api/")) return vite.middlewares(req, res);
  try {
    const handleApi = isVercel
      ? (await vite.ssrLoadModule("/api/audit.ts")).handleAudit
      : (await vite.ssrLoadModule("/server/api.ts")).handleApi;
    const chunks = [];
    let size = 0;
    for await (const c of req) {
      size += c.length;
      if (size > 2200000) {
        res.writeHead(413);
        res.end("Request too large");
        return;
      }
      chunks.push(c);
    }
    const headers = new Headers(
      Object.entries(req.headers).filter(([, v]) => typeof v === "string"),
    );
    headers.set("oai-authenticated-user-id", "local-developer");
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : Buffer.concat(chunks),
    });
    const response = await handleApi(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: e.message }));
  }
}).listen(port, "127.0.0.1", () =>
  console.log(
    `SEO Analytic: http://localhost:${port} (local development identity)`,
  ),
);
