// Disclosures and dialogs grow smoothly. A Collapsible's height moves in
// between-steps (not one frame); a Dialog whose content changes glides to its
// new height and stays centred; the chevron turns; reduced motion is instant.
import { expect, test, type Page } from "@playwright/test";

async function openGrowing(page: Page) {
  await page.goto("/components/dialog");
  await page.waitForLoadState("networkidle");
  const open = page.getByRole("button", { name: "Open", exact: true }).first();
  await open.scrollIntoViewIfNeeded();
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Connect a Server" });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(450); // enter animation
  return dialog;
}

/** The dialog panel's height and top on every frame for `ms`. */
function sample(page: Page, ms: number) {
  return page.evaluate(
    (dur) =>
      new Promise<{ h: number; top: number; bottom: number }[]>((resolve) => {
        const el = document.querySelector<HTMLElement>('[role="dialog"]')!;
        const out: { h: number; top: number; bottom: number }[] = [];
        const t0 = performance.now();
        // Read after each frame has painted (a task queued from rAF runs after
        // the frame), so a read never lands between layout and the
        // ResizeObserver that starts the glide.
        const step = () => {
          const r = el.getBoundingClientRect();
          out.push({ h: r.height, top: r.top, bottom: r.bottom });
          if (performance.now() - t0 < dur)
            requestAnimationFrame(() => setTimeout(step, 0));
          else resolve(out);
        };
        requestAnimationFrame(() => setTimeout(step, 0));
      }),
    ms,
  );
}

test("expanding a section grows the dialog through in-between heights", async ({
  page,
}) => {
  const dialog = await openGrowing(page);
  const trigger = dialog.getByRole("button", { name: "Connection options" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  const frames = sample(page, 400);
  await trigger.click();
  const f = await frames;
  const heights = [...new Set(f.map((x) => Math.round(x.h)))];
  expect(heights.length).toBeGreaterThan(5);
  expect(f.at(-1)!.h - f[0].h).toBeGreaterThan(40);
  // Stays centred: top moves up by about half of what the height grows.
  const dh = f.at(-1)!.h - f[0].h;
  const dTop = f[0].top - f.at(-1)!.top;
  expect(Math.abs(dTop - dh / 2)).toBeLessThan(3);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const chevron = trigger.locator("svg.uikit-collapsible-chevron");
  await expect(chevron).toHaveAttribute("data-state", "open");
});

test("an error line appearing glides the dialog instead of jumping", async ({
  page,
}) => {
  const dialog = await openGrowing(page);
  const frames = sample(page, 400);
  await dialog.getByRole("button", { name: "Connect", exact: true }).click();
  const f = await frames;
  const steps = f.map((x, i) => (i ? x.h - f[i - 1].h : 0));
  const grew = f.at(-1)!.h - f[0].h;
  expect(grew).toBeGreaterThan(10);
  // No single frame takes more than 60% of the growth.
  expect(Math.max(...steps)).toBeLessThan(grew * 0.6);
});

test("reduced motion: the section opens at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const dialog = await openGrowing(page);
  const before = (await dialog.boundingBox())!.height;
  await dialog.getByRole("button", { name: "Connection options" }).click();
  await page.waitForTimeout(40);
  const after = (await dialog.boundingBox())!.height;
  expect(after - before).toBeGreaterThan(40);
});
