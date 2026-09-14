// Vite resolves extensionless imports; deployed Node ESM does not. Verify the
// emitted function in native Node so this difference cannot break production.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, symlink, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const output = await mkdtemp(join(tmpdir(), "seo-vercel-runtime-"));
try {
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc", "--outDir", output,
    "--noEmit", "false", "--module", "ESNext", "--moduleResolution", "bundler",
    "--target", "ES2022", "--skipLibCheck", "--esModuleInterop", "api/audit.ts",
  ], { stdio: "inherit" });
  await writeFile(join(output, "package.json"), '{"type":"module"}');
  await symlink(resolve("node_modules"), join(output, "node_modules"), "dir");
  const { default: handler } = await import(pathToFileURL(join(output, "api/audit.js")).href);
  const endpoint = "https://seo-analytic.vercel.app/api/audit";
  const health = await handler.fetch(new Request(endpoint));
  assert.equal(health.status, 200);
  assert.equal((await health.json()).runtime, "vercel");
  const audit = await handler.fetch(new Request(endpoint, {
    method: "POST",
    headers: { origin: new URL(endpoint).origin, "content-type": "application/json" },
    body: JSON.stringify({ url: "https://example.com", html: "<html><head><title>Runtime check</title></head><body><h1>Example</h1></body></html>" }),
  }));
  assert.equal(audit.status, 200);
  assert.equal((await audit.json()).pages[0].title, "Runtime check");
  console.log("Native Node runtime: health and imported-HTML audit passed.");
} finally {
  await rm(output, { recursive: true, force: true });
}
