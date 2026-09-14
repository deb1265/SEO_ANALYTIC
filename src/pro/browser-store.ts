import seed from "../../server/seed.json";
import type { SeoReport } from "./types";
import { updateReport } from "./report-updates";
const DB_NAME = "seo-analytic-studio";
function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined")
      return reject(
        new Error(
          "Browser report storage is unavailable. Enable site storage and retry.",
        ),
      );
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("reports", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Could not open report storage. Enable site storage and retry.",
        ),
      );
    request.onblocked = () =>
      reject(
        new Error("Close other Studio tabs and retry opening report storage."),
      );
  });
}
async function transaction<T>(
  run: (store: IDBObjectStore, done: (value: T) => void) => void,
): Promise<T> {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("reports", "readwrite");
    let value: T;
    tx.oncomplete = () => {
      db.close();
      resolve(value);
    };
    tx.onabort = () => {
      db.close();
      reject(
        tx.error ||
          new Error(
            "Report could not be saved. Storage may be full; export a backup.",
          ),
      );
    };
    try {
      run(tx.objectStore("reports"), (v) => {
        value = v;
      });
    } catch (e) {
      tx.abort();
      reject(e);
    }
  });
}
export function listBrowserReports() {
  return transaction<SeoReport[]>((store, done) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const reports = request.result as SeoReport[];
      if (!reports.length) {
        const baseline = structuredClone(seed) as SeoReport;
        baseline.id = "patriot-example";
        baseline.revision = 1;
        store.put(baseline);
        reports.push(baseline);
      }
      done(reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
  });
}
export async function saveBrowserReport(
  report: SeoReport,
  expectedRevision?: number,
) {
  const saved = structuredClone(report);
  saved.pages.forEach((page) => {
    page.bodyExcerpt = "";
  });
  let conflict = false;
  try {
    return await transaction<SeoReport>((store, done) => {
      const request = store.get(saved.id);
      request.onsuccess = () => {
        const current = request.result as SeoReport | undefined;
        if (
          (expectedRevision === undefined && current) ||
          (expectedRevision !== undefined &&
            current?.revision !== expectedRevision)
        ) {
          conflict = true;
          store.transaction.abort();
          return;
        }
        if (current) {
          saved.revision = current.revision + 1;
          saved.updatedAt = new Date().toISOString();
        }
        store.put(saved);
        done(saved);
      };
    });
  } catch (e) {
    if (conflict)
      throw new Error(
        "This report changed in another tab while research was running. Refresh to see your saved audit and edits.",
      );
    throw e;
  }
}
export async function patchBrowserReport(id: string, input: unknown) {
  let validationError: unknown;
  try {
    return await transaction<SeoReport>((store, done) => {
      const request = store.get(id);
      request.onsuccess = () => {
        try {
          if (!request.result) throw new Error("Report not found.");
          const report = updateReport(request.result, input);
          store.put(report);
          done(report);
        } catch (e) {
          validationError = e;
          store.transaction.abort();
        }
      };
    });
  } catch (e) {
    throw validationError || e;
  }
}
