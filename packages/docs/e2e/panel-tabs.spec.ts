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

test("panel mode controls share memo geometry and keep three-option hover neutral", async ({
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
      .poll(() => group.evaluate((el) => el.style.background))
      .toBe("var(--chip-bg)");
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
      .toBe(rest);
    await expect(thumb).toHaveCSS("background-color", selected);
    await expect(terminal).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(chat).toHaveAttribute("aria-pressed", "true");
    await terminal.click();
    await page.mouse.move(0, 0);
    await expect(group).toHaveCSS("background-color", rest);
    const vim = demo.getByRole("button", { name: "Vim style reference" });
    await expect(group).toHaveCSS("height", "20px");
    await expect(thumb).toHaveCSS("height", "16px");
    const geometry = async (locator: typeof group) =>
      locator.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          height: style.height,
          radius: style.borderRadius,
          background: style.backgroundColor,
          duration: style.transitionDuration,
        };
      });
    expect(await geometry(group)).toEqual(await geometry(vim));
    const vimThumb = vim.locator(":scope > div").first();
    expect(await geometry(thumb)).toMatchObject({
      height: "16px",
      radius: "2px",
      background: (await geometry(vimThumb)).background,
    });
    await terminal.hover();
    await expect(group).toHaveCSS("background-color", rest);
    await expect(chat).not.toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(chat).toHaveCSS("opacity", "0.5");
    await expect(thumb).toHaveCSS("background-color", selected);
    await page.mouse.move(0, 0);
    await expect(chat).toHaveCSS("opacity", "0.5");
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

test("leading tab icons stay compact while empty and trailing icons do not affect padding", async ({
  page,
}) => {
  await page.goto("/components/tab-row");
  await page.waitForLoadState("networkidle");
  const demo = page.locator("[data-leading-icons-example]");
  const pending = demo.getByRole("tab", { name: "Loading icon", exact: true });
  const ready = demo.getByRole("tab", { name: "Ready", exact: true });
  const text = demo.getByRole("tab", { name: "Text only", exact: true });
  const trailing = demo.getByRole("tab", {
    name: "Trailing icon",
    exact: true,
  });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(pending).toHaveCSS("padding-left", "6px");
    await expect(ready).toHaveCSS("padding-left", "6px");
    await expect(text).toHaveCSS("padding-left", "12px");
    await expect(trailing).toHaveCSS("padding-left", "12px");
    const slot = pending.locator("[data-tab-leading-icon]");
    await expect(slot).toHaveCSS("display", "none");
    await demo.getByRole("button", { name: "Load pending icon" }).click();
    await expect(slot.locator("svg")).toBeVisible();
    await expect(pending).toHaveCSS("padding-left", "6px");
    await demo.getByRole("button", { name: "Unload icon" }).click();
    await expect(slot).toHaveCSS("display", "none");
  }
});

test("four-size gutter keeps neutral hover and visible keyboard focus while two-choice tint remains", async ({
  page,
}) => {
  await page.goto("/components/toggle");
  const demo = page.locator("[data-gutter-sizes-example]").first();
  const sizes = demo.getByRole("group", { name: "Preview size" });
  const large = sizes.getByRole("button", { name: "L", exact: true });
  await expect(async () => {
    await large.click();
    await expect(large).toHaveAttribute("aria-pressed", "true", {
      timeout: 500,
    });
  }).toPass();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (theme) => (document.documentElement.dataset.theme = theme),
      theme,
    );
    await page.mouse.move(0, 0);
    await large.blur();
    await sizes.evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
    const rest = await sizes.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    for (const option of await sizes.getByRole("button").all()) {
      await option.hover();
      await expect(sizes).toHaveCSS("background-color", rest);
      await expect(large).toHaveAttribute("aria-pressed", "true");
    }
    await large.focus();
    await page.keyboard.press("Tab");
    const xl = sizes.getByRole("button", { name: "XL", exact: true });
    await expect(xl).toBeFocused();
    await expect(xl).toHaveCSS("outline-style", "solid");
    await expect(xl).toHaveCSS("outline-width", "2px");
    await page.keyboard.press("Enter");
    await expect(xl).toHaveAttribute("aria-pressed", "true");
    await large.click();
    const pair = demo.getByRole("group", { name: "Browse layout" });
    await pair.getByRole("button", { name: "List", exact: true }).hover();
    await expect(pair).toHaveCSS("background-color", "rgb(35, 170, 255)");
  }
  await page.setViewportSize({ width: 390, height: 850 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
