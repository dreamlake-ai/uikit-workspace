import { test, expect } from '@playwright/test'

test('panel tabs share their face and preserve inactive drafts', async ({ page }) => {
  await page.goto('/components/panel-tabs')
  const demo = page.locator('[data-panel-tabs-example]').first()
  await expect(demo).toBeVisible()
  // The first visible frame is server-rendered; wait for the tab controller.
  await expect(async () => {
    await demo.getByRole('tab', { name: 'Chat', exact: true }).click()
    await expect(demo.getByRole('tab', { name: 'Chat', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
      { timeout: 500 }
    )
  }).toPass({ timeout: 30000 })
  for (const theme of ['light', 'dark']) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme
    }, theme)
    for (const tab of await demo.locator('.uikit-document-tab[data-active]').all()) {
      await expect(tab).toHaveCSS('background-image', 'none')
      await expect(tab).toHaveCSS('border-bottom-width', '0px')
      await expect(tab).toHaveCSS('border-top-right-radius', '8px')
    }
    await expect(demo.locator('[aria-label="Project list"] [data-example-body]')).toHaveCSS(
      'border-top-right-radius',
      '12px'
    )
  }
  const draft = demo.getByRole('textbox', { name: 'Release memo draft', exact: true })
  await draft.fill('Retained draft')
  const width = (await demo.boundingBox())!.width
  await demo.getByRole('tab', { name: 'A long project review title', exact: true }).click()
  await demo.getByRole('tab', { name: 'Release memo', exact: true }).click()
  await expect(draft).toHaveValue('Retained draft')
  expect((await demo.boundingBox())!.width).toBe(width)
  await demo.getByRole('tab', { name: 'Release memo', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    demo.getByRole('tab', { name: 'A long project review title', exact: true })
  ).toBeFocused()
  for (let i = 0; i < 8; i++)
    await demo.getByRole('button', { name: 'Add document', exact: true }).click()
  await expect(demo.getByRole('tab', { name: 'Draft 8', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await demo.getByRole('button', { name: 'Close Draft 8', exact: true }).click()
  await expect(demo.getByRole('tab', { name: 'Draft 8', exact: true })).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 850 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
