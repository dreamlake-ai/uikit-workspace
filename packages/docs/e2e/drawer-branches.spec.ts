import { expect, test } from "@playwright/test";
for (const theme of ["light", "dark"]) {
  test(`drawer branches remain opaque and keyboard operable in ${theme}`, async ({
    page,
  }, info) => {
    await page.goto("/components/tree-view");
    const demo = page.locator("[data-drawer-branches-demo]");
    await expect(demo).toBeVisible();
    const drawer = demo.getByRole("button", { name: /Child sessions/ });
    const selected = demo.getByRole("button", {
      name: "Spawned · investigate parser",
    });
    // The first visible specimen is server-rendered; wait for its controller.
    const sibling = demo.getByRole("button", {
      name: "Forked · alternative approach",
    });
    await expect(async () => {
      await sibling.click();
      await expect(sibling).toHaveAttribute("aria-pressed", "true", {
        timeout: 500,
      });
    }).toPass({ timeout: 30_000 });
    await page.evaluate((theme) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.dataset.theme = theme;
    }, theme);
    await selected.click();
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    await drawer.focus();
    await page.keyboard.press("Space");
    await expect(drawer).toHaveAttribute("aria-expanded", "false");
    await expect(selected).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    const nested = demo.getByRole("button", { name: /Nested agents/ });
    await nested.click();
    await expect(
      demo.getByText("Contains agent · evidence reader"),
    ).toHaveCount(0);
    await nested.click();
    await expect(
      demo.getByText("Contains agent · evidence reader"),
    ).toBeVisible();
    const guides = demo
      .locator('[data-tree-guides="strong"]')
      .filter({ has: page.locator("[data-tree-elbow]") });
    for (const guide of await guides.all()) {
      await expect(guide).toHaveCSS("opacity", "1");
      const elbow = guide.locator("[data-tree-elbow]");
      await expect(elbow).toHaveCSS("border-left-width", "2px");
      const color = await elbow.evaluate(
        (node) => getComputedStyle(node).borderLeftColor,
      );
      expect(color).toBe(
        theme === "dark" ? "rgb(129, 129, 139)" : "rgb(170, 168, 162)",
      );
    }
    await expect(
      demo.locator("[data-demo-unresolved] [data-tree-guides]"),
    ).toHaveCount(0);
    await demo.screenshot({
      path: info.outputPath(`drawer-branches-${theme}.png`),
    });
  });
}
