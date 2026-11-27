import { expect, test } from "@playwright/test";

test("collection covers keep one action, readable front and motion preferences", async ({
  page,
}, testInfo) => {
  await page.goto("/components/preview-stack");
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", { name: "Preview stack example" });
  const first = example.getByRole("button", {
    name: "Load plates into dish rack 198 episodes",
  });
  const stack = first.locator(".uikit-preview-stack");
  await expect(stack.locator(".uikit-preview-stack-layer")).toHaveCount(3);
  await expect(
    example
      .getByRole("button", { name: "Single environment 1 environment" })
      .locator(".uikit-preview-stack-layer"),
  ).toHaveCount(1);
  await expect(stack).toHaveAttribute("aria-hidden", "true");
  await expect(stack).toHaveAttribute("inert", "");
  await expect(stack.locator('[data-depth="0"]')).toHaveCSS("filter", "none");
  await expect(stack.locator('[data-depth="0"]')).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  const well = first.locator(".uikit-collection-icon--preview-stack");
  await expect(well).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(well).toHaveCSS("overflow", "visible");
  const rear = stack.locator('[data-depth="2"]');
  const rest = await rear.evaluate((el) => getComputedStyle(el).transform);
  const restingBounds = await rear.boundingBox();
  await first.hover();
  await page.waitForTimeout(300);
  const expandedBounds = await rear.boundingBox();
  expect(Math.abs(expandedBounds!.x - restingBounds!.x)).toBeGreaterThan(15);
  await expect(
    example
      .getByRole("button", { name: "Single environment 1 environment" })
      .locator('[data-depth="0"]'),
  ).toHaveCSS("transform", "none");
  await example.screenshot({
    path: testInfo.outputPath("preview-stack-hover.png"),
  });
  await page.mouse.move(0, 0);
  await first.focus();
  await expect
    .poll(() => rear.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(rest);
  await page.keyboard.press("Enter");
  await expect(example.getByRole("status")).toHaveText(
    "Opened: Load plates into dish rack",
  );
  await page.keyboard.press("Tab");
  await expect(
    example.getByRole("button", { name: "Pick up the mug 198 episodes" }),
  ).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await first.focus();
  await expect(rear).toHaveCSS("transition-duration", "0s");
  await expect(rear).toHaveCSS("transform", rest);
  await first.blur();
  await example.screenshot({
    path: testInfo.outputPath("preview-stack-light.png"),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "dark"),
  );
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await example.screenshot({
    path: testInfo.outputPath("preview-stack-dark-narrow.png"),
  });
});
