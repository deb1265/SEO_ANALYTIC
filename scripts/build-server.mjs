import { build } from "esbuild";
import { readFile, readdir, mkdir, writeFile, cp } from "node:fs/promises";
import path from "node:path";
const assets = {};
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};
async function walk(dir) {
  for (const x of await readdir(dir, { withFileTypes: true })) {
    const f = path.join(dir, x.name);
    if (x.isDirectory()) await walk(f);
    else
      assets["/" + path.relative("dist/client", f)] = [
        types[path.extname(f)] || "application/octet-stream",
        (await readFile(f)).toString("base64"),
      ];
  }
}
await walk("dist/client");
await mkdir(".sites-runtime", { recursive: true });
await writeFile(".sites-runtime/assets.json", JSON.stringify(assets));
await build({
  entryPoints: ["server/index.ts"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  external: ["cloudflare:workers"],
  loader: { ".json": "json" },
});
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle", "dist/.openai/drizzle", { recursive: true });
console.log("Worker and static assets built; no client secrets.");
