import { expect, test } from '@playwright/test'
for (const width of [1280, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`${theme} split-button variants and keyboard at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/components/split-button')
      await page.waitForLoadState('networkidle')
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme
      }, theme)
      const specimen = page.locator('[data-split-button-specimen]')
      await expect(specimen).toBeVisible()
      const status = specimen.getByRole('status')
      for (const label of ['Framed', 'Filled', 'Ghost', 'Header action']) {
        const trigger = specimen.getByRole('button', {
          name: `${label}: more add options`,
          exact: true,
        })
        const group = trigger.locator('xpath=../..')
        const primary = group.getByRole('button', { name: 'New note', exact: true })
        await expect(primary).toHaveCSS('border-top-left-radius', '6px')
        await expect(trigger).toHaveCSS('border-top-right-radius', '6px')
        await primary.click()
        await expect(status).toHaveText('New note')
        await expect(page.getByRole('menu')).toHaveCount(0)
        await trigger.focus()
        await page.keyboard.press('ArrowDown')
        await expect(page.getByRole('menuitem', { name: 'New note', exact: true })).toBeFocused()
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')
        await expect(status).toHaveText('Add existing')
        await expect(trigger).toBeFocused()
        await expect(trigger).toHaveAttribute('aria-expanded', 'false')
        const iconTrigger = specimen.getByRole('button', {
          name: `${label}: icon add options`,
          exact: true,
        })
        await iconTrigger.click()
        await expect(page.getByRole('menuitem', { name: 'New folder', exact: true })).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(iconTrigger).toBeFocused()
      }
      await expect(specimen.getByRole('button', { name: 'Disabled', exact: true })).toBeDisabled()
      await expect(specimen.getByRole('button', { name: 'Creating…', exact: true })).toBeDisabled()
      await specimen.screenshot({ path: info.outputPath(`split-${theme}-${width}.png`) })
    })
  }
}
