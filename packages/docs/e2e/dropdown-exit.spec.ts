// Dropdown-like panels FOLD back into their trigger's corner when they close —
// the unfold played backwards — instead of vanishing. Checked in a real
// engine (jsdom has no Web Animations): the panel stays in the DOM for the
// fold but is already out of reach (inert, aria-hidden), focus is back on the
// trigger at once, a pick applies at once, reopening mid-fold turns the same
// panel around, and reduced motion is a short fade.
import { expect, test, type Locator, type Page } from "@playwright/test";

const FOLD_MS = 220;

async function selectTrigger(page: Page) {
  await page.goto("/components/select");
  await page.waitForLoadState("networkidle");
  const trigger = page
    .getByRole("combobox")
    .filter({ hasText: "Pick a region" })
    .first();
  await trigger.scrollIntoViewIfNeeded();
  return trigger;
}

async function menuTrigger(page: Page) {
  await page.goto("/components/dropdown-menu");
  await page.waitForLoadState("networkidle");
  const trigger = page.getByRole("button", { name: "Actions" }).first();
  await trigger.scrollIntoViewIfNeeded();
  return trigger;
}

/** Opacity / clip-path / transform of the panel on every frame until it leaves the DOM. */
function sampleUntilGone(page: Page, selector: string) {
  return page.evaluate(
    (sel) =>
      new Promise<
        { t: number; opacity: number; clip: string; transform: string }[]
      >((resolve) => {
        const el = document.querySelector<HTMLElement>(sel);
        const out: {
          t: number;
          opacity: number;
          clip: string;
          transform: string;
        }[] = [];
        if (!el) return resolve(out);
        const t0 = performance.now();
        const tick = () => {
          if (!el.isConnected) return resolve(out);
          const cs = getComputedStyle(el);
          out.push({
            t: Math.round(performance.now() - t0),
            opacity: Number(cs.opacity),
            clip: cs.clipPath,
            transform: cs.transform,
          });
          if (performance.now() - t0 > 2000) return resolve(out);
          requestAnimationFrame(tick);
        };
        tick();
      }),
    selector,
  );
}

async function waitOpenSettled(panel: Locator) {
  await expect(panel).toBeVisible();
  // The unfold is 320ms; let it finish so the fold starts from fully open.
  await panel.page().waitForTimeout(400);
}

test("Select: Escape folds the list back into the trigger; focus returns at once", async ({
  page,
}) => {
  const trigger = await selectTrigger(page);
  await trigger.click();
  const list = page.locator('[role="listbox"]').first();
  await waitOpenSettled(list);
  const samples = sampleUntilGone(page, '[role="listbox"]');
  await page.keyboard.press("Escape");
  // Still in the DOM, folding, but already out of the accessibility tree.
  await expect(page.locator("[data-closing]")).toHaveCount(1);
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  const frames = await samples;
  const last = frames.at(-1)!;
  expect(last.t).toBeGreaterThanOrEqual(FOLD_MS - 40);
  expect(last.t).toBeLessThan(FOLD_MS + 200);
  // Opacity only ever goes down, and the panel ends clipped toward its corner.
  for (let i = 1; i < frames.length; i++)
    expect(frames[i].opacity).toBeLessThanOrEqual(
      frames[i - 1].opacity + 0.001,
    );
  expect(frames.some((f) => f.clip.includes("100%"))).toBe(true);
  await expect(page.locator("[data-unfold]")).toHaveCount(0);
});

test("Select: picking an option applies it at once and folds the list", async ({
  page,
}) => {
  const trigger = await selectTrigger(page);
  await trigger.click();
  const list = page.locator('[role="listbox"]').first();
  await waitOpenSettled(list);
  await page.getByRole("option", { name: "US West (Oregon)" }).click();
  // The trigger now reads the pick (located by its new text: the old one is gone).
  await expect(
    page.getByRole("combobox").filter({ hasText: "US West (Oregon)" }),
  ).toHaveCount(1);
  await expect(page.locator("[data-closing]")).toHaveCount(1);
  await expect(page.locator("[data-unfold]")).toHaveCount(0, { timeout: 1000 });
});

test("Select: reopening mid-fold turns the same panel around", async ({
  page,
}) => {
  const trigger = await selectTrigger(page);
  await trigger.click();
  const list = page.locator('[role="listbox"]').first();
  await waitOpenSettled(list);
  const marked = await list.evaluate((el) => {
    (el as HTMLElement).dataset.probe = "same";
    return true;
  });
  expect(marked).toBe(true);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(80);
  await trigger.click();
  const reopened = page.locator('[role="listbox"]').first();
  await expect(reopened).toHaveAttribute("data-probe", "same");
  await expect(reopened).not.toHaveAttribute("data-closing", "");
  await page.waitForTimeout(400);
  const cs = await reopened.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      opacity: Number(s.opacity),
      animations: el.getAnimations().length,
    };
  });
  expect(cs.opacity).toBe(1);
  // The turned-around fold has settled and been dropped.
  expect(cs.animations).toBe(0);
});

test("Select: an outside click closes it and reaches what is underneath", async ({
  page,
}) => {
  const trigger = await selectTrigger(page);
  await trigger.click();
  const list = page.locator('[role="listbox"]').first();
  await waitOpenSettled(list);
  const box = (await list.boundingBox())!;
  await page.mouse.click(box.x + box.width + 120, box.y + 10);
  await expect(page.locator("[data-closing]")).toHaveCount(1);
  // A folding panel never takes the pointer.
  const pe = await page
    .locator("[data-closing]")
    .evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(["none", "auto"]).toContain(pe);
  const hit = await page.evaluate(
    ([x, y]) =>
      (document.elementFromPoint(x, y) as HTMLElement | null)?.closest(
        "[data-closing]",
      ) != null,
    [box.x + box.width / 2, box.y + box.height / 2],
  );
  expect(hit).toBe(false);
  await expect(page.locator("[data-unfold]")).toHaveCount(0, { timeout: 1000 });
});

test("DropdownMenu: Escape and item select both fold; focus returns to the trigger", async ({
  page,
}) => {
  const trigger = await menuTrigger(page);
  await trigger.click();
  const menu = page.getByRole("menu").first();
  await waitOpenSettled(menu);
  const samples = sampleUntilGone(page, '[role="menu"]');
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const frames = await samples;
  expect(frames.at(-1)!.t).toBeGreaterThanOrEqual(FOLD_MS - 40);
  for (let i = 1; i < frames.length; i++)
    expect(frames[i].opacity).toBeLessThanOrEqual(
      frames[i - 1].opacity + 0.001,
    );

  await trigger.click();
  await waitOpenSettled(page.getByRole("menu").first());
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await expect(page.locator("[data-closing]")).toHaveCount(1);
  await expect(page.locator("[data-unfold]")).toHaveCount(0, { timeout: 1000 });
});

test("reduced motion: the fold is a short fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const trigger = await selectTrigger(page);
  await trigger.click();
  const list = page.locator('[role="listbox"]').first();
  await waitOpenSettled(list);
  const samples = sampleUntilGone(page, '[role="listbox"]');
  await page.keyboard.press("Escape");
  const frames = await samples;
  expect(frames.at(-1)!.t).toBeLessThan(200);
  expect(
    frames.every(
      (f) =>
        f.transform === "none" || f.transform === "matrix(1, 0, 0, 1, 0, 0)",
    ),
  ).toBe(true);
});
