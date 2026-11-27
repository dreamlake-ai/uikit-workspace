import { expect, test } from "@playwright/test";

test("compact tree keeps selection, disclosure and native source navigation independent", async ({
  page,
}) => {
  await page.goto("/components/compact-tree-list");
  const example = page.getByRole("region", { name: "Compact tree example" });
  const accuracy = example.locator('[data-demo-row="accuracy"]');
  const calibration = example.getByRole("button", {
    name: "Calibration",
    exact: true,
  });
  await expect(accuracy).toBeVisible();
  await calibration.click();
  await expect(calibration).toHaveAttribute("aria-pressed", "true");
  await expect(accuracy.locator(".uikit-collection-row")).toHaveCSS(
    "height",
    "32px",
  );
  await expect(accuracy.locator(".uikit-collection-name")).toHaveCSS(
    "line-height",
    "18px",
  );
  const geometry = await accuracy.evaluate((row) => {
    const bounds = row.getBoundingClientRect();
    const elbow = row
      .querySelector("[data-tree-elbow]")!
      .getBoundingClientRect();
    return {
      left: elbow.left - bounds.left,
      midpoint: elbow.bottom - bounds.top,
    };
  });
  expect(geometry).toEqual({ left: 39, midpoint: 16 });
  // Calibration is the final sibling: only the continuing ancestor keeps a trunk.
  await expect(
    example.locator(
      '[data-demo-row="calibration"] [data-tree-elbow] + [data-tree-trunk]',
    ),
  ).toHaveCount(0);
  const source = accuracy.getByRole("link", { name: /Open source/ });
  await source.click();
  await expect(page).toHaveURL(/#recorded-source$/);
  await expect(calibration).toHaveAttribute("aria-pressed", "true");
  const disclosure = example.getByRole("button", {
    name: "Toggle Quality checks",
  });
  await disclosure.click();
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await expect(calibration).toHaveCount(0);
  await disclosure.click();
  await expect(calibration).toHaveAttribute("aria-pressed", "true");
  const slider = example.getByRole("slider", { name: "Tree panel width" });
  await slider.evaluate((el) => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(el, "180");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(example.locator(".uikit-collection-list")).toHaveCSS(
    "width",
    "180px",
  );
  await expect(source).toBeVisible();
  await expect(disclosure).toBeVisible();
  await expect(accuracy.locator(".uikit-collection-row")).toHaveCSS(
    "height",
    "32px",
  );
  const box = await accuracy.locator(".uikit-collection-row").boundingBox();
  const sourceBox = await source.boundingBox();
  expect(sourceBox!.x + sourceBox!.width).toBeLessThanOrEqual(
    box!.x + box!.width + 1,
  );
  await source.focus();
  await expect(source).toBeFocused();
  await calibration.focus();
  await page.keyboard.press("Enter");
  await expect(calibration).toHaveAttribute("aria-pressed", "true");
  // The complete hierarchy is much larger than the viewport: rows remain virtualized.
  expect(await example.locator("[data-demo-row]").count()).toBeLessThan(46);
  expect(
    await example.locator("button button, button a, a button").count(),
  ).toBe(0);
});
