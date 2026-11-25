import { expect, test } from "@playwright/test";

test("panel width hides secondary slots, then icons, and preserves keyboard selection", async ({
  page,
}) => {
  await page.goto("/components/collection-list");
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", {
    name: "Responsive collection example",
  });
  const slider = example.getByRole("slider", { name: "Panel width" });
  const row = example.getByRole("button", {
    name: "Research brief",
    exact: true,
  });
  await row.scrollIntoViewIfNeeded();
  await row.focus();
  await page.keyboard.press("Enter");
  await expect(row).toHaveAttribute("aria-pressed", "true");
  const width = async (value: number) => {
    await slider.evaluate((el, value) => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(el, String(value));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    await expect(example.locator(".uikit-collection-list")).toHaveCSS(
      "width",
      `${value}px`,
    );
  };
  await width(300);
  await expect(row.locator(".uikit-collection-end")).toBeHidden();
  await expect(row.locator(".uikit-collection-detail")).toBeHidden();
  await expect(row.locator(".uikit-collection-icon")).toBeVisible();
  await width(180);
  await expect(row.locator(".uikit-collection-icon")).toBeHidden();
  await expect(row.locator(".uikit-collection-name")).toBeVisible();
  await expect(row).toHaveAttribute("aria-pressed", "true");
  await row.focus();
  await page.keyboard.press("Tab");
  await expect(
    example.getByRole("button", { name: "Evaluation recordings", exact: true }),
  ).toBeFocused();
  await width(300);
  await expect(row.locator(".uikit-collection-icon")).toBeVisible();
});
