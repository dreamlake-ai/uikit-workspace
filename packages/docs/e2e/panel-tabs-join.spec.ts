import { expect, test } from '@playwright/test'

test('tab-row examples join their content, including headers with taller actions', async ({ page }) => {
  await page.goto('/components/tab-row')
  await page.waitForLoadState('networkidle')
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value }, theme)
    for (const scenario of ['normal', 'crowded', 'chat']) {
      const select = page.getByRole('combobox', { name: 'Preview scenario' })
      const options = await select.locator('option').evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value))
      await select.selectOption(options[['normal', 'crowded', 'chat'].indexOf(scenario)])
      const seams = await page.locator('.dl-tabs-workspace-panel').evaluateAll(panels => panels.map(panel => {
        const tab = panel.querySelector('.dl-tabs-workspace-header .uikit-document-tab[data-active]')!
        const body = panel.querySelector('.dl-tabs-workspace-body')!
        return body.getBoundingClientRect().top - tab.getBoundingClientRect().bottom
      }))
      for (const seam of seams) expect(Math.abs(seam)).toBeLessThanOrEqual(1)
    }
    for (const example of await page.locator('[data-tab-row-example]').all()) {
      const seam = await example.evaluate(panel => {
        const tab = panel.querySelector('.uikit-document-tab[data-active]')!
        const body = panel.querySelector('[data-tab-row-body]')!
        return body.getBoundingClientRect().top - tab.getBoundingClientRect().bottom
      })
      expect(Math.abs(seam)).toBeLessThanOrEqual(1)
    }
  }
  // The explicit flush variant still has the shared rounded shoulder.
  await page.getByRole('combobox', { name: 'Left neighbor' }).selectOption('flush')
  await expect(page.getByRole('tablist', { name: 'Example documents' }).locator('.uikit-document-tab').first()).toHaveCSS('border-top-left-radius', '12px')
})
