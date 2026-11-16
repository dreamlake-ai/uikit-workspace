import { expect, test } from "@playwright/test";

for (const kind of ["documents", "panels"] as const) {
  test(`${kind}: tabs keep their gap at rest and stack only during overflow`, async ({
    page,
  }) => {
    await page.goto(
      `/components/${kind === "documents" ? "tab-row" : "panel-layout"}`,
    );
    // Docs render HTML before their interactive specimens hydrate.
    await page.waitForLoadState("networkidle");
    const row =
      kind === "documents"
        ? page.getByRole("tablist", { name: "Example documents" })
        : page
            .getByRole("tablist")
            .filter({
              has: page.getByRole("tab", { name: "index.ts", exact: true }),
            })
            .first();
    await row.scrollIntoViewIfNeeded();
    // Give the fixture enough space for its natural slots, independently of
    // the surrounding docs column. This is deliberately a non-overflow case.
    await row.evaluate((el) => {
      el.style.minWidth = "560px";
      el.style.maxWidth = "560px";
      el.scrollLeft = 0;
    });
    const geometry = () =>
      row.evaluate((el) => {
        const tabs = [
          ...el.querySelectorAll<HTMLElement>(".uikit-document-tab"),
        ];
        const boxes = tabs.map((tab) => tab.getBoundingClientRect());
        return {
          scroll: el.scrollLeft,
          overflow: el.scrollWidth - el.clientWidth,
          gaps: boxes.slice(1).map((box, i) => box.left - boxes[i].right),
        };
      });
    await expect.poll(geometry).toMatchObject({ scroll: 0, overflow: 0 });
    expect((await geometry()).gaps.every((gap) => gap >= 1)).toBe(true);
    await expect(row).toHaveCSS("scrollbar-width", "none");
    const first = row.getByRole("tab").first();
    await first.click();
    await expect(first).toHaveAttribute("aria-selected", "true");
    const firstFace = row.locator(".uikit-document-tab").first();
    const vertical = () =>
      firstFace.evaluate((el) =>
        [
          el.querySelector(".uikit-document-tab-label")!,
          el.querySelector(".uikit-document-tab-close")!,
        ].map((node) => {
          const r = node.getBoundingClientRect();
          return { y: r.y, height: r.height };
        }),
      );
    const activeGeometry = await vertical();
    await row.getByRole("tab").nth(1).click();
    await expect(first).toHaveAttribute("aria-selected", "false");
    expect(await vertical()).toEqual(activeGeometry);
    expect(
      await firstFace.evaluate(
        (el) => getComputedStyle(el, "::before").borderRadius,
      ),
    ).toBe("6px");
    const closeBeforeHover = await firstFace
      .locator(".uikit-document-tab-close")
      .boundingBox();
    await firstFace.hover();
    expect(
      await firstFace.locator(".uikit-document-tab-close").boundingBox(),
    ).toEqual(closeBeforeHover);
    await first.click();

    await row.evaluate((el) => {
      el.style.minWidth = "180px";
      el.style.maxWidth = "180px";
    });
    await expect
      .poll(async () => (await geometry()).overflow)
      .toBeGreaterThan(0);
    await row.evaluate((el) => {
      el.scrollLeft = 70;
    });
    await expect
      .poll(async () => (await geometry()).gaps.some((gap) => gap < -1))
      .toBe(true);
    // Later tabs own the overlapping pixels; the earlier tab must not hide
    // them just because it is active. Test the actual hit target, not z-index.
    expect(
      await row.evaluate((el) => {
        const tabs = [
          ...el.querySelectorAll<HTMLElement>(".uikit-document-tab"),
        ];
        const a = tabs[0].getBoundingClientRect(),
          b = tabs[1].getBoundingClientRect();
        const x = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
        return tabs[1].contains(
          document.elementFromPoint(x, b.top + b.height / 2),
        );
      }),
    ).toBe(true);
    const secondFace = row.locator(".uikit-document-tab").nth(1);
    const secondLabel =
      (await row.getByRole("tab").nth(1).getAttribute("aria-label")) ??
      (await row.getByRole("tab").nth(1).textContent());
    const count = await row.getByRole("tab").count();
    const end = secondFace.locator(".uikit-document-tab-close");
    const closeBox = (await end.boundingBox())!,
      rowBox = (await row.boundingBox())!;
    expect(closeBox.x).toBeGreaterThanOrEqual(rowBox.x);
    expect(closeBox.x + closeBox.width).toBeLessThanOrEqual(
      rowBox.x + rowBox.width + 1,
    );
    await end.click();
    await expect(row.getByRole("tab")).toHaveCount(count - 1);
    await expect(
      row.getByRole("tab", { name: secondLabel!, exact: true }),
    ).toHaveCount(0);
    await row.getByRole("tab").first().focus();
    await page.keyboard.press("End");
    await expect(row.getByRole("tab").last()).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.keyboard.press("Home");
    await expect(row.getByRole("tab").first()).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBe(0);
  });
}
