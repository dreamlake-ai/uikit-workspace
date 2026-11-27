import { expect, test } from "@playwright/test";

test("progress rail stays readable at narrow widths without adding tab stops", async ({
  page,
}, testInfo) => {
  await page.goto("/components/progress-rail");
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", { name: "Progress rail example" });
  const list = example.getByRole("list", { name: "Evaluation progress" });
  await expect(list.getByRole("listitem")).toHaveCount(4);
  await expect(list.locator('[aria-current="step"]')).toContainText("Running");
  await expect(example.locator("button, a, [tabindex]")).toHaveCount(0);
  const node = list.locator('li > span[aria-hidden="true"]').last();
  await expect(node).toHaveCSS("width", "19px");
  await expect(node).toHaveCSS("height", "19px");
  const rows = await list.getByRole("listitem").evaluateAll((els) =>
    els.map((el) => {
      const box = el.getBoundingClientRect();
      return {
        top: box.top,
        left: box.left,
        width: box.width,
        fits: el.scrollWidth <= el.clientWidth,
      };
    }),
  );
  expect(rows.every((row) => row.width === 140 && row.fits)).toBe(true);
  expect(rows.every((row, i) => i === 0 || row.top > rows[i - 1]!.top)).toBe(
    true,
  );
  await example.screenshot({
    path: testInfo.outputPath("progress-rail-after.png"),
  });
  // Before this component, the same statuses use the existing inline stage layout.
  const before = await page.addStyleTag({
    content:
      '[aria-label="Progress rail example"] ol { display:flex; flex-wrap:wrap; gap:8px; } [aria-label="Progress rail example"] li { display:block; padding:0; } [aria-label="Progress rail example"] li > span { display:none; }',
  });
  await example.screenshot({
    path: testInfo.outputPath("progress-rail-before.png"),
  });
  await before.evaluate((el) => el.remove());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "dark"),
  );
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  const error = example
    .getByRole("list", { name: "Collection progress" })
    .locator('[aria-current="step"]');
  await expect(error).toContainText("Evidence collection needs authorization");
  expect(await error.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await example.screenshot({
    path: testInfo.outputPath("progress-rail-dark-narrow.png"),
  });
});
