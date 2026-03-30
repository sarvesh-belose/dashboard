import { test, expect } from '@playwright/test'

test.describe('Widget Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Enter edit mode
    await page.locator('button').filter({ hasText: '' }).first().click()
  })

  test('opens wizard on Add Widget click', async ({ page }) => {
    await page.getByRole('button', { name: /add widget/i }).click()
    // Modal/wizard should appear
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('wizard shows step 1: Select Type', async ({ page }) => {
    await page.getByRole('button', { name: /add widget/i }).click()
    // Step 1 content — type selection cards
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // Should show widget type options
    await expect(dialog.getByText(/chart|grid|text|custom/i).first()).toBeVisible()
  })

  test('can select widget type and proceed to next step', async ({ page }) => {
    await page.getByRole('button', { name: /add widget/i }).click()
    const dialog = page.getByRole('dialog')

    // Select "Text" widget type
    await dialog.getByText(/^text$/i).click()
    // Click Next
    await dialog.getByRole('button', { name: /next/i }).click()

    // Should advance to step 2: Basic Info
    await expect(dialog.getByText(/basic info|title/i).first()).toBeVisible()
  })

  test('closes wizard on cancel/close', async ({ page }) => {
    await page.getByRole('button', { name: /add widget/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Close via X button or Cancel
    const closeBtn = dialog.getByRole('button', { name: /close|cancel/i }).first()
    await closeBtn.click()

    await expect(dialog).not.toBeVisible()
  })
})
