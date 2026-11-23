import { expect, test } from "@playwright/test";

test("checkbox has an accent mark without a resting box, with native keyboard and label behavior", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/components/checkbox");
  const group = page.getByRole("group", { name: "Checkbox examples" });
  const curves = group.getByRole("checkbox", { name: "Show curves" });
  await expect(curves).toBeChecked();
  await group.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const style = () =>
    curves.evaluate((el) => {
      const s = getComputedStyle(el);
      const svg = el.nextElementSibling!;
      return {
        border: s.borderTopColor,
        background: s.backgroundColor,
        outline: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        mark: getComputedStyle(svg).display,
        color: getComputedStyle(svg).color,
        transition: s.transitionDuration,
      };
    });
  expect((await style()).border).toBe("rgba(0, 0, 0, 0)");
  expect((await style()).background).toBe("rgba(0, 0, 0, 0)");
  expect((await style()).mark).not.toBe("none");
  await group.screenshot({
    path: test.info().outputPath("checkbox-light-rest.png"),
  });
  await curves.hover();
  expect((await style()).border).not.toBe("rgba(0, 0, 0, 0)");
  await group.screenshot({
    path: test.info().outputPath("checkbox-hover.png"),
  });
  await page.mouse.move(0, 0);
  await curves.focus();
  await page.keyboard.press("Space");
  await expect(curves).not.toBeChecked();
  expect((await style()).outline).toBe("solid");
  expect((await style()).outlineWidth).toBe("2px");
  expect((await style()).border).not.toBe("rgba(0, 0, 0, 0)");
  await group.screenshot({
    path: test.info().outputPath("checkbox-focus.png"),
  });
  await group.getByText("Show curves", { exact: true }).click();
  await expect(curves).toBeChecked();
  const mixed = group.getByRole("checkbox", { name: "Mixed selection" });
  await expect(mixed).toHaveJSProperty("indeterminate", true);
  await mixed.focus();
  await page.keyboard.press("Space");
  await expect(mixed).toHaveJSProperty("indeterminate", false);
  await expect(mixed).toBeChecked();
  await expect(
    group.getByRole("checkbox", { name: "Disabled choice" }),
  ).toBeDisabled();
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.classList.add("dark");
  });
  await group.screenshot({ path: test.info().outputPath("checkbox-dark.png") });
  await group.evaluate((el) =>
    (el as HTMLElement).style.setProperty(
      "--uikit-accent",
      "rgb(180, 30, 220)",
    ),
  );
  expect((await style()).color).toBe("rgb(180, 30, 220)");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await style()).transition).toBe("0s");
  await group.screenshot({
    path: test.info().outputPath("checkbox-custom-accent.png"),
  });
  await page.emulateMedia({ forcedColors: "active" });
  await expect(curves).toHaveCSS("appearance", "auto");
  expect((await style()).mark).toBe("none");
  expect(errors).toEqual([]);
});

test("narrow touch label toggles once and native form reset restores state", async ({
  browser,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Chromium touch context.");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/components/checkbox/`);
  const group = page.getByRole("group", { name: "Checkbox examples" });
  const curves = group.getByRole("checkbox", { name: "Show curves" });
  await group.getByText("Show curves", { exact: true }).tap();
  await expect(curves).not.toBeChecked();
  await group.getByText("Show curves", { exact: true }).tap();
  await expect(curves).toBeChecked();
  const labels = group.getByRole("checkbox", { name: "Show labels" });
  await labels.evaluate((el) => {
    const form = document.createElement("form");
    const label = el.closest("label")!;
    label.before(form);
    form.append(label);
  });
  await labels.tap();
  await expect(labels).toBeChecked();
  expect(
    await labels.evaluate((el) =>
      new FormData((el as HTMLInputElement).form!).get("showLabels"),
    ),
  ).toBe("visible");
  await labels.evaluate((el) => (el as HTMLInputElement).form!.reset());
  await expect(labels).not.toBeChecked();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await group.screenshot({
    path: test.info().outputPath("checkbox-touch.png"),
  });
  await context.close();
});
