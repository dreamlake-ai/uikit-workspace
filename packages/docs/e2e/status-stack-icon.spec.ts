import { test, expect } from "@playwright/test";
test("status stacks keep exact accessible states and completion badge in a compact slot", async ({
  page,
}) => {
  await page.goto("/components/status-stack-icon");
  const example = page.getByRole("region", { name: "Status stack example" });
  const all = example.getByRole("img", {
    name: "All passed: 12 passed, 0 failed, 0 other; complete",
    exact: true,
  });
  await expect(all).toHaveAttribute("data-all-passed", "true");
  await expect(all).toHaveCSS("width", "18px");
  await expect(all.locator("[data-status-check] path:last-child")).toHaveCSS(
    "stroke",
    "rgb(35, 170, 255)",
  );
  const incomplete = example.getByRole("img", {
    name: "Incomplete inventory: 5 passed, 0 failed, 0 other; incomplete",
    exact: true,
  });
  await expect(incomplete.locator("[data-status-check]")).toHaveCount(0);
  const empty = example.getByRole("img", {
    name: "Empty inventory: 0 passed, 0 failed, 0 other; complete",
    exact: true,
  });
  await expect(empty.locator("[data-status-check]")).toHaveCount(0);
  await expect(
    example
      .getByRole("img", { name: /Mixed outcomes/ })
      .locator("[data-status-layer]"),
  ).toHaveCount(3);
  const toggle = example.getByRole("button", {
    name: "Inventory complete",
    exact: true,
  });
  await toggle.click();
  await expect(
    example.getByRole("img", {
      name: "Interactive group: 3 passed, 0 failed, 0 other; complete",
      exact: true,
    }),
  ).toHaveAttribute("data-all-passed", "true");
  await toggle.click();
  await expect(
    example
      .getByRole("img", { name: /Interactive group/ })
      .locator("[data-status-check]"),
  ).toHaveCount(0);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (theme) => document.documentElement.setAttribute("data-theme", theme),
      theme,
    );
    await expect(all.locator("[data-status-check] path:last-child")).toHaveCSS(
      "stroke",
      "rgb(35, 170, 255)",
    );
    await all.evaluate(
      (el) =>
        ((el.parentElement as HTMLElement).style.background =
          "var(--selected-bg)"),
    );
    const fits = await all.evaluate((el) => {
      const svg = el as SVGSVGElement;
      const box = svg.getBBox();
      return (
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= 24 &&
        box.y + box.height <= 24
      );
    });
    expect(fits).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
