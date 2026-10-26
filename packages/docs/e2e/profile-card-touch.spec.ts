// ProfileCard with top-right actions on a touch device: ONE header line.
//
// `(hover: none)` shows edit/delete permanently, so they share the title's
// line with the meta: `title …  2h ago  ✏ 🗑`. Before this, the timestamp was
// drawn through the buttons (main), and then dropped to its own line under
// them (first cut of #273). Asserted on the docs specimen at the device's own
// width, then with a long name, then squeezed until the meta has to go.
import { expect, test, type Locator, type Page } from "@playwright/test";

type Box = { x: number; y: number; width: number; height: number };

async function boxes(card: Locator) {
  const get = async (l: Locator) => (await l.boundingBox()) as Box;
  return {
    card: await get(card),
    header: await get(card.locator("[data-uikit-header]")),
    main: await get(card.locator("[data-uikit-header-main]")),
    title: await get(card.locator("[data-uikit-title-col] > :first-child")),
    meta: await get(card.locator("[data-uikit-title-right]")),
    edit: await get(card.getByRole("button", { name: "Edit project" })),
    del: await get(card.getByRole("button", { name: "Delete project" })),
  };
}

const mid = (b: Box) => b.y + b.height / 2;
const right = (b: Box) => b.x + b.width;

async function specimen(page: Page) {
  await page.goto("/components/profile-card");
  const card = page
    .locator("[data-uikit-card]", {
      has: page.getByRole("button", { name: "Edit project" }),
    })
    .first();
  await card.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => matchMedia("(hover: none)").matches)).toBe(
    true,
  );
  return card;
}

function expectOneLine(
  b: Awaited<ReturnType<typeof boxes>>,
  { meta }: { meta: boolean },
) {
  // Everything centred on the title's line (±2px). Boxes differ in height —
  // 24px buttons, 18px title, 16px mono meta — so the centre is the shared line.
  const line = mid(b.title);
  expect(Math.abs(mid(b.edit) - line)).toBeLessThanOrEqual(2);
  expect(Math.abs(mid(b.del) - line)).toBeLessThanOrEqual(2);
  // Nothing wrapped: the header is no taller than its tallest control.
  expect(b.header.height).toBeLessThanOrEqual(b.edit.height + 2);
  // Left to right, no overlap: title · meta · edit · delete, inside the card.
  expect(b.edit.x).toBeGreaterThanOrEqual(right(b.title));
  expect(b.del.x).toBeGreaterThanOrEqual(right(b.edit));
  expect(right(b.del)).toBeLessThanOrEqual(right(b.card));
  if (meta) {
    expect(Math.abs(mid(b.meta) - line)).toBeLessThanOrEqual(2);
    expect(b.meta.x).toBeGreaterThanOrEqual(right(b.title));
    expect(b.edit.x).toBeGreaterThanOrEqual(right(b.meta));
  } else {
    // Dropped, not wrapped: it sits on the clipped second flex line.
    expect(b.meta.y).toBeGreaterThanOrEqual(b.main.y + b.main.height);
  }
}

test("title, timestamp and edit/delete share one line at the specimen width", async ({
  page,
}) => {
  const card = await specimen(page);
  expectOneLine(await boxes(card), { meta: true });
  await expect(card.locator("[data-uikit-title-right]")).toHaveText("2h ago");
});

test("a long name truncates before the timestamp and the buttons", async ({
  page,
}) => {
  const card = await specimen(page);
  await card.evaluate((el) => {
    const title = el.querySelector("[data-uikit-title-col] > :first-child")!;
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode()))
      if (n.textContent === "arm-bc-v2")
        n.textContent = "arm-bc-v2-ego-teleop-resnet-encoder-sweep-03";
  });
  const b = await boxes(card);
  expectOneLine(b, { meta: true });
  const truncated = await card
    .locator("[data-uikit-title-col] > :first-child")
    .evaluate((t) => t.scrollWidth > t.clientWidth);
  expect(truncated).toBe(true);
});

test("a narrow card hides the timestamp rather than wrapping", async ({
  page,
}) => {
  const card = await specimen(page);
  // 13rem: too narrow for title floor + tag + meta + buttons.
  await card.evaluate((el) => {
    (el.parentElement as HTMLElement).style.width = "13rem";
  });
  const b = await boxes(card);
  expectOneLine(b, { meta: false });
  // The title keeps its floor (~6 characters) instead of collapsing to "…".
  expect(b.title.width).toBeGreaterThanOrEqual(40);
});
