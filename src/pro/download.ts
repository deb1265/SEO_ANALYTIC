import type { SeoReport } from "./types";
export function exportJSON(report: SeoReport) {
  const u = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = `seo-${report.client.replace(/[^a-z0-9]/gi, "-")}-${report.createdAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(u);
}
