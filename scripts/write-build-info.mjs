import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const commit =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
writeFileSync(
  "dist/client/build-info.json",
  JSON.stringify({
    version,
    commit,
    runtime: "vercel",
    keyStorage: "tab-memory",
  }) + "\n",
);
