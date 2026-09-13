import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SeoReport } from "./types";
import { normalFont, boldFont } from "./fonts";
export function createPDF(r: SeoReport) {
  const pdf = new jsPDF();
  pdf.addFileToVFS("Studio.ttf", normalFont);
  pdf.addFont("Studio.ttf", "Studio", "normal");
  pdf.addFileToVFS("Studio-Bold.ttf", boldFont);
  pdf.addFont("Studio-Bold.ttf", "Studio", "bold");
  pdf.setFont("Studio", "normal");
  let y = 25;
  const clean = (s: unknown) =>
    String(s ?? "")
      .replace(/[–—]/g, "-")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[^\x09\x0a\x0d\x20-\x7e\u00a0-\u00ff]/g, "");
  const room = (h: number) => {
    if (y + h > 274) {
      pdf.addPage();
      y = 25;
    }
  };
  const heading = (s: string) => {
    pdf.setFont("Studio", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(37, 43, 77);
    const lines = pdf.splitTextToSize(clean(s), 177);
    room(Math.max(40, lines.length * 7 + 10));
    pdf.text(lines, 16, y);
    y += lines.length * 7 + 4;
  };
  const text = (s: string) => {
    pdf.setFont("Studio", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(60, 68, 88);
    const lines = pdf.splitTextToSize(clean(s), 177);
    for (const line of lines) {
      room(6);
      pdf.text(line, 16, y);
      y += 5;
    }
    y += 4;
  };
  const table = (heads: string[], rows: unknown[][]) => {
    room(24);
    autoTable(pdf, {
      startY: y,
      head: [heads.map(clean)],
      body: rows.map((row) => row.map(clean)),
      margin: { left: 16, right: 16, top: 24, bottom: 23 },
      styles: {
        font: "Studio",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: { fillColor: [48, 55, 94] },
      alternateRowStyles: { fillColor: [246, 247, 252] },
    });
    y = (pdf as any).lastAutoTable.finalY + 10;
  };
  pdf.setFillColor(26, 32, 57);
  pdf.rect(0, 0, 210, 72, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.text(clean(r.agency || "SEO Analytic"), 16, 18);
  pdf.setFontSize(27);
  pdf.setFont("Studio", "bold");
  pdf.text("SEO STRATEGY REPORT", 16, 35);
  pdf.setFontSize(16);
  pdf.setFontSize(14);
  pdf.text(pdf.splitTextToSize(clean(r.client), 177).slice(0, 2), 16, 49);
  pdf.setFontSize(10);
  pdf.setFont("Studio", "normal");
  pdf.text(
    clean(r.createdAt.slice(0, 10) + "  |  " + r.state.toUpperCase()),
    16,
    62,
  );
  y = 86;
  text(
    r.url +
      "\nService area: " +
      r.location +
      "\nPrepared by: " +
      (r.preparedBy || r.agency),
  );
  if (r.fee !== null)
    text(
      "Report fee: " +
        r.currency +
        " " +
        r.fee.toFixed(2) +
        " (billing is managed separately)",
    );
  heading("Executive assessment");
  text(
    r.strategy?.summary ||
      "Measured HTML audit. AI strategy was unavailable for this report.",
  );
  heading("Measured evidence");
  room(r.pages.length * 13 + 10);
  for (const p of r.pages) {
    pdf.setFontSize(9);
    pdf.setTextColor(60, 68, 88);
    pdf.text(clean(new URL(p.url).pathname || "/").slice(0, 80), 16, y);
    pdf.setFillColor(237, 238, 246);
    pdf.roundedRect(100, y - 4, 72, 5, 2, 2, "F");
    pdf.setFillColor(114, 89, 237);
    pdf.roundedRect(100, y - 4, (72 * p.score) / 100, 5, 2, 2, "F");
    pdf.text(String(p.score) + "/100", 177, y);
    y += 13;
  }

  table(
    ["Page", "Checklist /100", "Words", "Alt text to review"],
    r.pages.map((p) => [p.url, p.score, p.wordCount, p.missingAlt]),
  );
  text(
    "Scores reflect HTML presence checks, not Google rankings. Performance, search volume and actual indexing are not inferred. Fetch timing is a server request duration, not a Core Web Vital.",
  );
  if (r.strategy) {
    heading("Strengths");
    r.strategy.strengths.forEach((s) => text("- " + s));
    heading("Business risks");
    r.strategy.risks.forEach((s) => text("- " + s));
    heading("Priority issues");
    r.strategy.issues.forEach((i, n) => {
      heading(`${n + 1}. ${i.title}`);
      text(`${i.severity} | ${i.category} | Effort: ${i.effort}`);
      text("Evidence: " + i.evidence);
      text("Action: " + i.suggestion);
      if (i.sourceUrl) text("Source: " + i.sourceUrl);
    });
    heading("Keyword-to-page plan");
    table(
      ["Keyword / intent", "Priority", "Target page", "Recommended action"],
      r.strategy.keywordPlan.map((k) => [
        k.keyword + " / " + k.intent,
        k.priority,
        k.targetPage,
        k.action,
      ]),
    );
    text(
      "These priorities are editorial recommendations, not measured volume, difficulty or ranking scores.",
    );
    heading("Competitor research");
    r.strategy.competitors.forEach((c) => {
      heading(c.name);
      text(c.url);
      text("Why relevant: " + c.whyRelevant);
      text("Observed positioning: " + c.strength);
      text("Opportunity: " + c.opportunity);
      text("Source to verify: " + c.sourceUrl);
    });
    heading("Content briefs");
    r.strategy.contentPlan.forEach((c) => {
      heading(c.title);
      text("Target: " + c.primaryKeyword + " | " + c.pageType);
      c.outline.forEach((o) => text("- " + o));
      text("CTA: " + c.cta);
    });
    heading("90-day action plan");
    r.strategy.roadmap.forEach((x) => {
      heading(x.phase + ": " + x.title);
      x.actions.forEach((a) => text("- " + a));
      text("Success measure: " + x.successMetric);
    });
    heading("Suggested homepage copy");
    text("Title: " + r.strategy.optimized.title);
    text("Description: " + r.strategy.optimized.metaDescription);
    text("H1: " + r.strategy.optimized.h1);
  }
  heading("Delivery checklist & progress");
  table(
    ["Task", "Priority", "Status", "Due"],
    r.tasks.map((t) => [
      t.title,
      t.priority,
      t.status.replace("_", " "),
      t.dueDate || "Not set",
    ]),
  );
  if (r.rankings.length) {
    heading("Recorded ranking observations");
    table(
      ["Keyword", "Date", "Position", "Source"],
      r.rankings.map((k) => [k.keyword, k.date, k.position, k.source]),
    );
  }
  if (r.notes) {
    heading("Consultant notes");
    text(r.notes);
  }
  heading("Method and sources");
  text(
    "Model: " +
      (r.model || "No AI used") +
      ". Report generated " +
      r.createdAt +
      ". Public HTML was sampled; JavaScript-only content, off-page links, real traffic and actual search-engine rankings require separate measurement. Research and AI suggestions require consultant review before client delivery.",
  );
  r.warnings.forEach((w) => text("- " + w));
  r.sources.forEach((s) => text(s.title + "\n" + s.url));
  const count = pdf.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(110, 118, 138);
    pdf.text((clean(r.agency) + " | " + clean(r.client)).slice(0, 88), 16, 287);
    pdf.text(`${i} / ${count}`, 185, 287);
  }
  return pdf;
}
export function exportPDF(r: SeoReport) {
  const pdf = createPDF(r);
  pdf.save(
    `SEO-${r.client.replace(/[^a-z0-9]/gi, "-")}-${r.createdAt.slice(0, 10)}.pdf`,
  );
}
