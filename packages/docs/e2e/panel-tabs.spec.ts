import { test, expect } from "@playwright/test";

test("panel tabs share their face and preserve inactive drafts", async ({
  page,
}) => {
  await page.goto("/components/panel-tabs");
  const demo = page.locator("[data-panel-tabs-example]").first();
  await expect(demo).toBeVisible();
  // The first visible frame is server-rendered; wait for the tab controller.
  await expect(async () => {
    await demo.getByRole("tab", { name: "Chat", exact: true }).click();
    await expect(
      demo.getByRole("tab", { name: "Chat", exact: true }),
    ).toHaveAttribute("aria-selected", "true", { timeout: 500 });
  }).toPass({ timeout: 30000 });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    for (const tab of await demo
      .locator(".uikit-document-tab[data-active]")
      .all()) {
      const backgroundPanel = await tab.evaluate(
        (el) => !!el.closest("[data-workspace-panel]"),
      );
      await expect(tab).toHaveCSS(
        "background-image",
        backgroundPanel ? /linear-gradient/ : "none",
      );
      await expect(tab).toHaveCSS("border-bottom-width", "0px");
      await expect(tab).toHaveCSS("border-top-right-radius", "8px");
    }
    await expect(
      demo.locator('[aria-label="Project list"] [data-example-body]'),
    ).toHaveCSS("border-top-right-radius", "12px");
  }
  const draft = demo.getByRole("textbox", {
    name: "Release memo draft",
    exact: true,
  });
  await draft.fill("Retained draft");
  const width = (await demo.boundingBox())!.width;
  await demo
    .getByRole("tab", { name: "A long project review title", exact: true })
    .click();
  await demo.getByRole("tab", { name: "Release memo", exact: true }).click();
  await expect(draft).toHaveValue("Retained draft");
  expect((await demo.boundingBox())!.width).toBe(width);
  await demo.getByRole("tab", { name: "Release memo", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    demo.getByRole("tab", { name: "A long project review title", exact: true }),
  ).toBeFocused();
  for (let i = 0; i < 8; i++)
    await demo
      .getByRole("button", { name: "Add document", exact: true })
      .click();
  await expect(
    demo.getByRole("tab", { name: "Draft 8", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await demo
    .getByRole("button", { name: "Close Draft 8", exact: true })
    .click();
  await expect(
    demo.getByRole("tab", { name: "Draft 8", exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 850 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("panel mode controls tint only the track and match the inactive fill", async ({
  page,
}) => {
  await page.goto("/components/tab-row");
  const demo = page.locator("[data-panel-toggle-example]").first();
  const group = demo.getByRole("group", { name: "Session view" });
  const chat = group.getByRole("button", { name: "Chat", exact: true });
  const terminal = group.getByRole("button", { name: "Terminal", exact: true });
  await expect(async () => {
    await chat.click();
    await expect(chat).toHaveAttribute("aria-pressed", "true", {
      timeout: 500,
    });
  }).toPass();
  for (const theme of ["light", "dark"]) {
    await chat.click();
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    await page.mouse.move(0, 0);
    await chat.blur();
    await expect
      .poll(() => group.evaluate((el) => el.style.backgroundColor))
      .toBe("");
    await group.evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
    const rest = await group.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const thumb = group.locator(":scope > div").first();
    const selected = await thumb.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    await terminal.hover();
    await expect
      .poll(() => group.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(rest);
    await expect(thumb).toHaveCSS("background-color", selected);
    await expect(terminal).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(chat).toHaveAttribute("aria-pressed", "true");
    await terminal.click();
    await page.mouse.move(0, 0);
    await expect(group).toHaveCSS("background-color", rest);
    const dimensions = await demo.evaluate((el) => {
      const inactive = el.querySelector(
        ".uikit-document-tab:not([data-active])",
      )!;
      const rect = inactive.getBoundingClientRect();
      const before = getComputedStyle(inactive, "::before");
      const fillHeight =
        rect.height -
        2 * parseFloat(getComputedStyle(inactive).borderTopWidth) -
        parseFloat(before.top) -
        parseFloat(before.bottom);
      return {
        fillHeight,
        controls: [
          ...el.querySelectorAll("[data-panel-action], [data-toggle-variant]"),
        ].map((el) => el.getBoundingClientRect().height),
      };
    });
    for (const height of dimensions.controls)
      expect(Math.abs(height - dimensions.fillHeight)).toBeLessThanOrEqual(1);
  }
  await chat.click();
  const draft = demo.getByRole("textbox", { name: "Example chat draft" });
  await draft.fill("Keep my draft");
  await terminal.click();
  await chat.click();
  await expect(draft).toHaveValue("Keep my draft");
  await page.setViewportSize({ width: 390, height: 850 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("tab row actions are quiet, compact and close buttons have balanced edge gaps", async ({
  page,
}) => {
  await page.goto("/components/tab-row");
  await page.waitForLoadState("networkidle");
  const demo = page.locator('[data-tab-row-example="compression"]');
  const action = demo.getByRole("button", { name: "Document options" });
  await action.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(action).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await action.hover();
  await expect(action).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const sizes = await demo.evaluate((el) => {
    const tab = el
      .querySelector(".uikit-document-tab[data-active]")!
      .getBoundingClientRect();
    const close = el
      .querySelector(
        ".uikit-document-tab[data-active] .uikit-document-tab-close",
      )!
      .getBoundingClientRect();
    const action = el
      .querySelector('[aria-label="Document options"]')!
      .getBoundingClientRect();
    return {
      top: close.top - tab.top,
      right: tab.right - close.right,
      actionHeight: action.height,
      tabHeight: tab.height,
    };
  });
  expect(Math.abs(sizes.top - sizes.right)).toBeLessThanOrEqual(1);
  expect(sizes.actionHeight).toBe(sizes.tabHeight - 4);
});

test("inactive document tabs keep short separators without close controls", async ({
  page,
}) => {
  await page.goto("/components/tab-row");
  const demo = page.locator('[data-tab-row-example="groups"]');
  await expect(demo).toBeVisible();
  const shell = demo.getByRole("tab", { name: "shell · 1", exact: true });
  await expect(async () => {
    await shell.click();
    await expect(shell).toHaveAttribute("aria-selected", "true", {
      timeout: 500,
    });
  }).toPass({ timeout: 30000 });
  await expect(demo.getByRole("button", { name: /^Close / })).toHaveCount(1);
  const inactive = demo.locator(".uikit-document-tab:not([data-active])");
  await expect(inactive.locator(".uikit-document-tab-close")).toHaveCount(0);
  const agents = demo
    .getByRole("tab", { name: "Agents", exact: true })
    .locator("..");
  await agents.hover();
  const divider = await agents.evaluate((node) => {
    const style = getComputedStyle(node, "::after");
    return {
      content: style.content,
      height: style.height,
      width: style.width,
      top: style.top,
      tabHeight: node.getBoundingClientRect().height,
    };
  });
  expect(divider.content).toBe('""');
  expect(divider.height).toBe("12px");
  expect(divider.width).toBe("1px");
  expect(divider.tabHeight).toBeGreaterThan(12);
  await expect(inactive.locator(".uikit-document-tab-close")).toHaveCount(0);
  await demo
    .getByRole("button", { name: "Close shell · 1", exact: true })
    .click();
  await expect(shell).toHaveCount(0);
  await expect(
    demo.getByRole("tab", { name: "Brief", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});
