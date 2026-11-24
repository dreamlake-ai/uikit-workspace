import { expect, test } from "@playwright/test";

test("date dividers do not select, collapse or interrupt row navigation", async ({
  page,
}) => {
  await page.goto("/components/list-divider");
  await page.waitForLoadState("networkidle");
  const list = page.locator('[aria-label="Grouped sessions"]');
  const divider = list.getByRole("separator", {
    name: "Yesterday",
    exact: true,
  });
  await divider.click();
  await expect(list.locator('[aria-pressed="true"]')).toHaveCount(0);
  await expect(divider).not.toHaveAttribute("tabindex");
  await expect(divider).not.toHaveAttribute("aria-expanded");
  await expect(divider.locator("button, input")).toHaveCount(0);
  await list
    .getByRole("button", { name: "Fix terminal reconnect", exact: true })
    .click();
  const next = list.getByRole("button", {
    name: "Improve session navigation",
    exact: true,
  });
  await next.click({ modifiers: ["Shift"] });
  await expect(list.locator('[aria-pressed="true"]')).toHaveCount(4);
  await list
    .getByRole("button", { name: "Review deployment", exact: true })
    .focus();
  await page.keyboard.press("ArrowDown");
  await expect(next).toBeFocused();
  await page.keyboard.press("Control+a");
  await expect(list.locator('[aria-pressed="true"]')).toHaveCount(6);
  const virtual = page.locator('[aria-label="Virtualized grouped sessions"]');
  await virtual
    .getByRole("button", { name: "Fix workspace switching", exact: true })
    .click();
  await expect(virtual.locator('[aria-pressed="true"]')).toHaveCount(1);
});
