// ProfileCard with top-right actions on a touch device.
//
// `(hover: none)` shows edit/delete permanently, on the title's line. The meta
// (timestamp) does not join them: it sits in the card's bottom-right corner, at
// the end of the footer row — `title …  ✏ 🗑` over `stats ……  2h ago`. Before
// #273 the timestamp was drawn through the buttons; #273 squeezed it between
// title and buttons, and it moved to the corner after design review.
// Asserted on the docs specimen at the device's own width, then with a long
// name, then on a narrow card.
import { expect, test, type Locator, type Page } from "@playwright/test";

type Box = { x: number; y: number; width: number; height: number };

async function boxes(card: Locator) {
  const get = async (l: Locator) => (await l.boundingBox()) as Box;
  return {
    card: await get(card),
    header: await get(card.locator("[data-uikit-header]")),
    footer: await get(card.locator("[data-uikit-footer]")),
    title: await get(card.locator("[data-uikit-title-col] > :first-child")),
    meta: await get(card.locator("[data-uikit-title-right-foot]")),
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

async function expectLayout(card: Locator) {
  const b = await boxes(card);
  // Top line: title then edit/delete, centred on the title's line (±2px), no
  // wrap, inside the card.
  const line = mid(b.title);
  expect(Math.abs(mid(b.edit) - line)).toBeLessThanOrEqual(2);
  expect(Math.abs(mid(b.del) - line)).toBeLessThanOrEqual(2);
  expect(b.header.height).toBeLessThanOrEqual(b.edit.height + 2);
  expect(b.edit.x).toBeGreaterThanOrEqual(right(b.title));
  expect(b.del.x).toBeGreaterThanOrEqual(right(b.edit));
  expect(right(b.del)).toBeLessThanOrEqual(right(b.card));
  // Meta: the bottom-right corner — on the footer row, right-aligned with the
  // delete button's right edge (±2px), below the header.
  expect(Math.abs(mid(b.meta) - mid(b.footer))).toBeLessThanOrEqual(2);
  expect(b.meta.y).toBeGreaterThanOrEqual(b.header.y + b.header.height);
  expect(Math.abs(right(b.meta) - right(b.del))).toBeLessThanOrEqual(2);
  // The header copy is gone, not just faded — out of the accessibility tree.
  await expect(card.locator("[data-uikit-header] [data-uikit-title-right]")).toBeHidden();
  return b;
}

test("the timestamp sits bottom-right; title and edit/delete share the top line", async ({
  page,
}) => {
  const card = await specimen(page);
  await expectLayout(card);
  await expect(card.locator("[data-uikit-title-right-foot]")).toHaveText("2h ago");
});

test("a long name truncates before the buttons", async ({ page }) => {
  const card = await specimen(page);
  await card.evaluate((el) => {
    const title = el.querySelector("[data-uikit-title-col] > :first-child")!;
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode()))
      if (n.textContent === "arm-bc-v2")
        n.textContent = "arm-bc-v2-ego-teleop-resnet-encoder-sweep-03-with-augmentations-v7";
  });
  await expectLayout(card);
  // The title box or the text span inside it (the specimen leads the name with
  // its visibility icon) carries the ellipsis.
  const truncated = await card
    .locator("[data-uikit-title-col] > :first-child")
    .evaluate((t) =>
      [t, ...t.querySelectorAll("span")].some(
        (e) => e.scrollWidth > e.clientWidth,
      ),
    );
  expect(truncated).toBe(true);
});

test("a narrow card keeps the timestamp in the corner", async ({ page }) => {
  const card = await specimen(page);
  await card.evaluate((el) => {
    (el.parentElement as HTMLElement).style.width = "13rem";
  });
  const b = await expectLayout(card);
  expect(b.title.width).toBeGreaterThanOrEqual(40);
});
