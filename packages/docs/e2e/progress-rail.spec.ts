import { expect, test } from "@playwright/test";

test("progress rail stays readable at narrow widths without adding tab stops", async ({
  page,
}, testInfo) => {
  await page.goto("/components/progress-rail");
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", { name: "Progress rail example" });
  const list = example.getByRole("list", {
    name: "Evaluation progress",
    exact: true,
  });
  await expect(list.getByRole("listitem")).toHaveCount(4);
  await expect(list.locator('[aria-current="step"]')).toContainText("Running");
  await expect(list.locator("button, a, [tabindex]")).toHaveCount(0);
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
  const compact = example.getByRole("list", {
    name: "Compact evaluation progress",
  });
  await expect(compact).toHaveAttribute("data-variant", "compact");
  const specimen = compact.locator("..");
  await example.getByRole("button", { name: "Use rail", exact: true }).click();
  await expect(compact).toHaveAttribute("data-variant", "rail");
  await specimen.screenshot({
    path: testInfo.outputPath("compact-before.png"),
  });
  await example
    .getByRole("button", { name: "Use compact", exact: true })
    .click();
  await expect(compact).toHaveAttribute("data-variant", "compact");
  await specimen.screenshot({ path: testInfo.outputPath("compact-after.png") });
  const compactHeight = (await compact.boundingBox())!.height;
  expect(compactHeight).toBeLessThan(120);
  const time = compact.locator("time");
  const active = compact.locator('[aria-current="step"]');
  expect(
    Math.abs(
      (await time.locator("..").boundingBox())!.y -
        (await active.boundingBox())!.y,
    ),
  ).toBeLessThan(2);
  await expect(compact.locator("li > span").first()).toHaveCSS(
    "border-top-width",
    "0px",
  );
  await expect(compact.locator("li > span")).toHaveCount(5);
  for (const stages of [list, compact]) {
    await expect(stages.locator(".lucide-check").first()).toHaveCSS(
      "color",
      "rgb(35, 170, 255)",
    );
    await expect(stages.locator(".lucide-circle, .rounded-full")).toHaveCount(
      0,
    );
    await expect(stages.locator("li > span").last()).toHaveCSS(
      "border-top-width",
      "0px",
    );
  }
  await expect(list.locator("li > span.absolute")).toHaveCount(3);
  await expect(compact.locator("li > span.absolute")).toHaveCount(0);
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
  await expect(error.locator(".lucide-x")).toBeVisible();
  await expect(compact.locator(".lucide-check").first()).toHaveCSS(
    "color",
    "rgb(35, 170, 255)",
  );
  expect(await error.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await example.screenshot({
    path: testInfo.outputPath("progress-rail-dark-narrow.png"),
  });
});
