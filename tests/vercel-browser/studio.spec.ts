import { test, expect } from "@playwright/test";
test("refresh clears the session key, preserves progress and renders the full Studio", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByLabel("CURRENT CLIENT REPORT")).toContainText(
    "Patriot Energy Solutions",
  );
  await page
    .getByLabel("OpenRouter API key", { exact: true })
    .fill("sk-or-v1-test-only");
  await page.getByRole("button", { name: "Use key for this tab" }).click();
  await expect(page.getByRole("button", { name: "Clear key" })).toBeVisible();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  const state = page.getByRole("combobox", { name: /^Status for / }).first();
  await state.selectOption("done");
  await expect(
    page.getByRole("status").filter({ hasText: "Changes saved" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("OpenRouter API key", { exact: true }),
  ).toHaveValue("");
  await expect(page.getByRole("button", { name: "Clear key" })).toHaveCount(0);
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: /^Status for / }).first(),
  ).toHaveValue("done");
  const stored = await page.evaluate(() =>
    JSON.stringify({ ...localStorage, ...sessionStorage }),
  );
  expect(stored).not.toContain("sk-or-v1");
  await page.setViewportSize({ width: 390, height: 844 });
  const layout = await page.evaluate(() => ({
    viewport: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll("body *")]
      .filter(
        (element) =>
          element.getBoundingClientRect().right > innerWidth + 1 &&
          !element.closest(".s-table-wrap"),
      )
      .map((element) => ({
        tag: element.tagName,
        className: element.getAttribute("class"),
        width: element.getBoundingClientRect().width,
      }))
      .slice(0, 20),
  }));
  expect(
    layout.scrollWidth,
    JSON.stringify(layout.overflow),
  ).toBeLessThanOrEqual(layout.viewport);
  expect(errors).toEqual([]);
});
test("creates a measured report without a key and exports a PDF", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New report", exact: true }).click();
  await page.getByLabel("Client name").fill("Vercel sample client");
  await page.getByLabel("Website URL").fill("https://example.com");
  await page.getByLabel("Business focus").fill("Home energy improvements");
  await page.getByLabel("Include Muse Spark").uncheck();
  await page.getByText("Website blocks automated access?").click();
  await page.getByLabel("Import saved homepage HTML").setInputFiles({
    name: "sample.html",
    mimeType: "text/html",
    buffer: Buffer.from(
      '<html lang="en"><head><title>Home energy improvements</title></head><body><h1>Comfortable homes</h1><p>Services for local homeowners.</p></body></html>',
    ),
  });
  await page
    .getByRole("button", { name: "Create report", exact: true })
    .click();
  await expect(page.getByLabel("CURRENT CLIENT REPORT")).toContainText(
    "Vercel sample client",
  );
  await expect(page.getByRole("status")).toContainText("Report saved");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  await page.reload();
  await expect(page.getByLabel("CURRENT CLIENT REPORT")).toContainText(
    "Vercel sample client",
  );
});
