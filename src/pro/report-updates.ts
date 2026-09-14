import type { SeoReport } from "./types";
export function updateReport(current: SeoReport, input: any): SeoReport {
  if (input.revision !== current.revision)
    throw new Error(
      "This report changed in another tab. Refresh before saving.",
    );
  const report = structuredClone(current);
  if (input.state && ["draft", "reviewed", "delivered"].includes(input.state))
    report.state = input.state;
  if (typeof input.notes === "string")
    report.notes = input.notes.slice(0, 12000);
  if (typeof input.agency === "string")
    report.agency = input.agency.slice(0, 160);
  if (typeof input.preparedBy === "string")
    report.preparedBy = input.preparedBy.slice(0, 160);
  if (
    input.fee === null ||
    (typeof input.fee === "number" &&
      Number.isFinite(input.fee) &&
      input.fee >= 0 &&
      input.fee <= 100000)
  )
    report.fee = input.fee;
  if (input.task) {
    const task = report.tasks.find((t) => t.id === input.task.id);
    if (!task) throw new Error("Task not found.");
    if (["todo", "in_progress", "done"].includes(input.task.status))
      task.status = input.task.status;
    if (
      typeof input.task.dueDate === "string" &&
      (/^\d{4}-\d{2}-\d{2}$/.test(input.task.dueDate) ||
        input.task.dueDate === "")
    )
      task.dueDate = input.task.dueDate;
    if (typeof input.task.notes === "string")
      task.notes = input.task.notes.slice(0, 3000);
  }
  if (input.ranking) {
    const k = input.ranking;
    if (
      typeof k.keyword !== "string" ||
      !k.keyword.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(k.date) ||
      !Number.isFinite(k.position) ||
      k.position < 1 ||
      k.position > 1000 ||
      !["Search Console", "SERP tool", "Manual observation"].includes(k.source)
    )
      throw new Error(
        "Enter a keyword, valid date, position from 1–1000 and source.",
      );
    if (report.rankings.length >= 1000)
      throw new Error("This report has reached its observation limit.");
    report.rankings.push({
      id: crypto.randomUUID(),
      keyword: k.keyword.slice(0, 180),
      date: k.date,
      position: k.position,
      source: k.source,
    });
  }
  report.revision = report.revision + 1;
  report.updatedAt = new Date().toISOString();
  return report;
}
