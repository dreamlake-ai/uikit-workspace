import { expect, test } from "@playwright/test";

test("existing experiment selection semantics compose with the virtual list", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/components/virtual-list");
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", {
    name: "Selectable experiments example",
  });
  await example.scrollIntoViewIfNeeded();
  const row = (index: number) =>
    example.locator(`[data-selection-row="${index}"]`);
  const output = example.locator("[data-selection-output]");
  await row(2).click();
  await expect(output).toHaveText("Experiment 3");
  await row(0).click({ modifiers: ["Control"] });
  await expect(output).toHaveText("Experiment 3, Experiment 1");
  await row(4).click({ modifiers: ["Shift"] });
  await expect(output).toHaveText(
    "Experiment 1, Experiment 2, Experiment 3, Experiment 4, Experiment 5",
  );
  const drag = async (from: number, to: number) => {
    const start = (await row(from).boundingBox())!;
    const end = (await row(to).boundingBox())!;
    await page.mouse.move(start.x + 30, start.y + 16);
    await page.mouse.down();
    await page.mouse.move(end.x + 30, end.y + 16, { steps: 8 });
    await page.mouse.up();
  };
  await drag(1, 3);
  await expect(output).toHaveText("Experiment 2, Experiment 3, Experiment 4");
  await page.keyboard.down("Control");
  await drag(5, 6);
  await page.keyboard.up("Control");
  await expect(output).toHaveText(
    "Experiment 2, Experiment 3, Experiment 4, Experiment 6, Experiment 7",
  );
  await row(0).click();
  await expect(output).toHaveText("Experiment 1");
  await row(3).focus();
  await page.keyboard.press("Enter");
  await expect(output).toHaveText("Experiment 4");
  await page.keyboard.press("Escape");
  await expect(output).toHaveText("No experiments selected");
  expect(await example.locator("[data-selection-row]").count()).toBeLessThan(
    20,
  );
  await example.screenshot({
    path: test.info().outputPath("selection-desktop.png"),
  });
  expect(errors).toEqual([]);
});

test("touch scrolling remains native and a narrow-screen tap selects", async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Native touch synthesis uses Chromium CDP.",
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 800 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${test.info().project.use.baseURL}/components/virtual-list`);
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", {
    name: "Selectable experiments example",
  });
  await example.scrollIntoViewIfNeeded();
  const first = example.locator('[data-selection-row="0"]');
  await first.tap();
  await expect(example.locator("[data-selection-output]")).toHaveText(
    "Experiment 1",
  );
  // CDP delivers a native touch sequence; it must scroll rather than paint a drag range.
  const box = (await first.boundingBox())!;
  const session = await context.newCDPSession(page);
  const x = box.x + Math.min(80, box.width / 2),
    y = box.y + 210;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 8; i++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y - i * 18 }],
    });
    await page.waitForTimeout(20);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(150);
  await expect(example.locator("[data-selection-output]")).toHaveText(
    "Experiment 1",
  );
  await expect(first).toHaveCount(0);
  await example.screenshot({
    path: test.info().outputPath("selection-touch.png"),
  });
  expect(errors).toEqual([]);
  await context.close();
});
