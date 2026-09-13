import { it, expect, vi } from "vitest";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import seed from "../server/seed.json";
it("loads the saved Patriot report and renders every reporting workspace section", async () => {
  const dom = new JSDOM('<div id="app"></div>', {
    url: "https://audit.example.com/",
  });
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("localStorage", dom.window.localStorage);
  vi.stubGlobal("navigator", dom.window.navigator);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("fetch", async (path: string) =>
    Response.json(
      path === "/api/config"
        ? { aiConfigured: true, storage: true, model: "meta/muse-spark-1.3" }
        : { reports: [seed] },
    ),
  );
  const { default: App } = await import("../src/App");
  const root = createRoot(document.getElementById("app")!);
  try {
    await act(async () => root.render(<App />));
    expect(document.body.textContent).toContain("Patriot Energy Solutions");
    for (const tab of [
      "Issues",
      "Keywords",
      "Competitors",
      "Action plan",
      "Progress",
      "Reports",
      "Overview",
    ]) {
      const button = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.trim().startsWith(tab),
      )!;
      expect(button).toBeTruthy();
      await act(async () => button.click());
      expect(
        document.querySelector("main")?.textContent?.length,
      ).toBeGreaterThan(300);
    }
    expect(document.body.textContent).toContain("95");
  } finally {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
    dom.window.close();
  }
});
